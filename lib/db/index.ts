import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// We cannot call neon() at module level because Next.js evaluates server modules
// during the build's "collect page data" phase, before runtime env vars are available.
// Instead, we lazily initialize the client on the first DB call.

let _client: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (_client) return _client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set.');
  _client = neon(url);
  return _client;
}

// sql is a function identical in signature to neon()'s return value.
// Tagged template usage: await sql`SELECT ...`
// The type cast ensures call-sites see the exact same type as before.
export const sql: NeonQueryFunction<false, false> = (
  (strings: TemplateStringsArray, ...values: unknown[]) =>
    getClient()(strings, ...values)
) as unknown as NeonQueryFunction<false, false>;
