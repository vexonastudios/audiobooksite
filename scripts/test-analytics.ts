import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { getAnalyticsSummary } from '@/lib/db/analytics';

async function test() {
  try {
    const data = await getAnalyticsSummary(30);
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("ERROR:");
    console.error(e);
  }
}

test();
