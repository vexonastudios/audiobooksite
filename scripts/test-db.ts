import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function test() {
  const { getAnalyticsSummary } = await import('@/lib/db/analytics');
  
  try {
     const data = await getAnalyticsSummary(30);
     console.log("SUCCESS!", data);
  } catch(e) {
     console.error("ERROR!!", e);
  }
}
test().catch(console.error);
