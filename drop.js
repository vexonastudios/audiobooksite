require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql`ALTER TABLE push_subscriptions ALTER COLUMN user_id DROP NOT NULL;`.then(() => console.log('Dropped NOT NULL')).catch(console.error);
