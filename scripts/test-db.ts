import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function test() {
  const { sql } = await import('@/lib/db/index');
  const { recordListenHeartbeat } = await import('@/lib/db/analytics');
  
  try {
     await recordListenHeartbeat('1260', '1776652409884-g7m56n0e', 'web', 30, 162.488131, 'user_123');
     console.log("SUCCESS!");
  } catch(e) {
     console.error("ERROR", e);
  }
}
test().catch(console.error);
