import { neon } from '@neondatabase/serverless';

// DATABASE_URL must be set in Vercel environment variables.
// We intentionally do NOT throw at module import time because Next.js
// static analysis imports this module during build, where the env var
// may not be available. The error surfaces naturally at request time.
export const sql = neon(process.env.DATABASE_URL || '');
