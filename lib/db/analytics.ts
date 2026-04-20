import { sql } from './index';

// ─── Record Events ────────────────────────────────────────────────────────────

export async function recordPlay(
  audiobookId: string,
  sessionId: string,
  platform: string,
  startPosition: number,
  userId?: string | null,
) {
  // 1. Record the detailed analytics event
  await sql`
    INSERT INTO play_events (audiobook_id, session_id, user_id, platform, start_position)
    VALUES (${audiobookId}, ${sessionId}, ${userId ?? null}, ${platform}, ${startPosition})
  `;

  // 2. Increment the legacy lifetime 'plays' counter on the audiobook itself 
  // so existing views aren't lost and new plays add to it
  await sql`
    UPDATE audiobooks 
    SET plays = plays + 1 
    WHERE id = ${audiobookId}
  `;
}

export async function recordListenHeartbeat(
  audiobookId: string,
  sessionId: string,
  platform: string,
  listenedSecs: number,
  position: number,
  userId?: string | null,
) {
  if (listenedSecs <= 0) return;

  await sql`
    INSERT INTO listen_time (audiobook_id, session_id, user_id, platform, listened_secs, position)
    VALUES (${audiobookId}, ${sessionId}, ${userId ?? null}, ${platform}, ${listenedSecs}, ${position})
  `;

  // UPSERT aggregated stats for logged-in users
  if (userId) {
    await sql`
      INSERT INTO user_listen_stats (user_id, audiobook_id, total_secs, play_count, last_listened, max_position)
      VALUES (${userId}, ${audiobookId}, ${listenedSecs}, 0, NOW(), ${position})
      ON CONFLICT (user_id, audiobook_id) DO UPDATE SET
        total_secs    = user_listen_stats.total_secs + ${listenedSecs},
        last_listened = NOW(),
        max_position  = GREATEST(user_listen_stats.max_position, ${position})
    `;
  }
}

// ─── User Stats ───────────────────────────────────────────────────────────────

export async function getUserListenStats(userId: string) {
  const rows = await sql`
    SELECT
      uls.audiobook_id,
      uls.total_secs,
      uls.play_count,
      uls.last_listened,
      uls.max_position,
      a.title,
      a.slug,
      a.cover_image,
      a.thumbnail_url,
      a.author_name,
      a.duration_secs,
      a.length_str,
      a.categories
    FROM user_listen_stats uls
    JOIN audiobooks a ON a.id = uls.audiobook_id
    WHERE uls.user_id = ${userId}
    ORDER BY uls.last_listened DESC
  `;

  return rows.map((r: any) => ({
    audiobookId: r.audiobook_id,
    totalSecs: Number(r.total_secs),
    playCount: Number(r.play_count),
    lastListened: r.last_listened,
    maxPosition: Number(r.max_position),
    completionPct: r.duration_secs > 0
      ? Math.min(100, Math.round((r.max_position / r.duration_secs) * 100))
      : 0,
    title: r.title,
    slug: r.slug,
    coverImage: r.thumbnail_url || r.cover_image,
    authorName: r.author_name,
    durationSecs: Number(r.duration_secs),
    lengthStr: r.length_str,
    categories: r.categories ?? [],
  }));
}

export async function getUserTotalListenSecs(userId: string): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(total_secs), 0) AS total
    FROM user_listen_stats
    WHERE user_id = ${userId}
  `;
  return Number((rows[0] as any)?.total ?? 0);
}

export async function getUserListeningStreak(userId: string): Promise<number> {
  // Days with at least one heartbeat, working backwards from today
  const rows = await sql`
    SELECT DISTINCT DATE(recorded_at AT TIME ZONE 'UTC') AS day
    FROM listen_time
    WHERE user_id = ${userId}
      AND recorded_at >= NOW() - INTERVAL '60 days'
    ORDER BY day DESC
  `;
  if (rows.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  today.setUTCHours(0,0,0,0);
  for (let i = 0; i < rows.length; i++) {
    const rowDay = new Date((rows[i] as any).day);
    rowDay.setUTCHours(0,0,0,0);
    const expected = new Date(today);
    expected.setUTCDate(today.getUTCDate() - i);
    if (rowDay.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────

export async function getAnalyticsSummary(days: number = 30) {
  const [
    totalsRow,
    playsPerDay,
    listenPerDay,
    topBooks,
    platformSplit,
    activeNow,
    registeredVsAnon,
  ] = await Promise.all([
    // Top-level totals
    sql`
      SELECT
        COUNT(*) AS total_plays,
        COUNT(DISTINCT session_id) AS unique_sessions,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS registered_sessions
      FROM play_events
      WHERE started_at >= NOW() - ${days + ' days'}::interval
    `,

    // Plays per day
    sql`
      SELECT
        DATE(started_at AT TIME ZONE 'UTC') AS day,
        COUNT(*) AS plays
      FROM play_events
      WHERE started_at >= NOW() - ${days + ' days'}::interval
      GROUP BY day
      ORDER BY day ASC
    `,

    // Listen minutes per day
    sql`
      SELECT
        DATE(recorded_at AT TIME ZONE 'UTC') AS day,
        ROUND((SUM(listened_secs) / 60.0)::numeric, 1) AS listen_minutes
      FROM listen_time
      WHERE recorded_at >= NOW() - ${days + ' days'}::interval
      GROUP BY day
      ORDER BY day ASC
    `,

    // Top books by listen time
    sql`
      SELECT
        lt.audiobook_id,
        a.title,
        a.slug,
        a.cover_image,
        a.thumbnail_url,
        a.author_name,
        a.duration_secs,
        ROUND((SUM(lt.listened_secs) / 3600.0)::numeric, 2) AS listen_hours,
        COUNT(DISTINCT pe.id) AS total_plays,
        COUNT(DISTINCT lt.session_id) AS unique_listeners,
        CASE WHEN a.duration_secs > 0
          THEN ROUND((AVG(lt.position::numeric / NULLIF(a.duration_secs, 0)) * 100)::numeric)
          ELSE 0
        END AS avg_completion_pct
      FROM listen_time lt
      JOIN audiobooks a ON a.id = lt.audiobook_id
      LEFT JOIN play_events pe ON pe.audiobook_id = lt.audiobook_id
        AND pe.started_at >= NOW() - ${days + ' days'}::interval
      WHERE lt.recorded_at >= NOW() - ${days + ' days'}::interval
      GROUP BY lt.audiobook_id, a.title, a.slug, a.cover_image, a.thumbnail_url, a.author_name, a.duration_secs
      ORDER BY listen_hours DESC
      LIMIT 20
    `,

    // Platform breakdown
    sql`
      SELECT platform, COUNT(*) AS count
      FROM play_events
      WHERE started_at >= NOW() - ${days + ' days'}::interval
      GROUP BY platform
      ORDER BY count DESC
    `,

    // Active listeners right now (heartbeat in last 2 min)
    sql`
      SELECT COUNT(DISTINCT session_id) AS active
      FROM listen_time
      WHERE recorded_at >= NOW() - INTERVAL '2 minutes'
    `,

    // Registered vs anon
    sql`
      SELECT
        COUNT(*) FILTER (WHERE user_id IS NOT NULL) AS registered,
        COUNT(*) FILTER (WHERE user_id IS NULL) AS anonymous
      FROM play_events
      WHERE started_at >= NOW() - ${days + ' days'}::interval
    `,
  ]);

  const totals = totalsRow[0] as any;
  const anon = registeredVsAnon[0] as any;

  // Total listen hours in period
  const listenHoursRow = await sql`
    SELECT COALESCE(ROUND((SUM(listened_secs) / 3600.0)::numeric, 1), 0) AS hours
    FROM listen_time
    WHERE recorded_at >= NOW() - ${days + ' days'}::interval
  `;

  return {
    totalPlays: Number(totals.total_plays),
    uniqueSessions: Number(totals.unique_sessions),
    registeredSessions: Number(totals.registered_sessions),
    totalListenHours: Number((listenHoursRow[0] as any).hours),
    activeNow: Number((activeNow[0] as any).active),
    playsPerDay: playsPerDay.map((r: any) => ({ day: String(r.day), plays: Number(r.plays) })),
    listenPerDay: listenPerDay.map((r: any) => ({ day: String(r.day), minutes: Number(r.listen_minutes) })),
    topBooks: topBooks.map((r: any) => ({
      audiobookId: r.audiobook_id,
      title: r.title,
      slug: r.slug,
      coverImage: r.thumbnail_url || r.cover_image,
      authorName: r.author_name,
      listenHours: Number(r.listen_hours),
      totalPlays: Number(r.total_plays),
      uniqueListeners: Number(r.unique_listeners),
      avgCompletionPct: Number(r.avg_completion_pct),
    })),
    platformSplit: (platformSplit as any[]).map(r => ({ platform: r.platform, count: Number(r.count) })),
    registeredPlays: Number(anon.registered),
    anonymousPlays: Number(anon.anonymous),
  };
}
