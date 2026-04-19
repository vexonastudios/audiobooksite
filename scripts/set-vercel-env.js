/**
 * Adds R2 environment variables to Vercel cleanly (no Windows newline corruption).
 * Run: node scripts/set-vercel-env.js
 */
const { execSync } = require('child_process');

require('dotenv').config({ path: '.env.local' });

const vars = [
  ['R2_ACCOUNT_ID',        process.env.R2_ACCOUNT_ID],
  ['R2_ENDPOINT',          process.env.R2_ENDPOINT],
  ['R2_BUCKET_NAME',       process.env.R2_BUCKET_NAME],
  ['R2_ACCESS_KEY_ID',     process.env.R2_ACCESS_KEY_ID],
  ['R2_SECRET_ACCESS_KEY', process.env.R2_SECRET_ACCESS_KEY],
  ['R2_PUBLIC_URL',        process.env.R2_PUBLIC_URL],
];

for (const [key, value] of vars) {
  try {
    // Write value to temp file with no BOM and no trailing newline
    const fs = require('fs');
    const tmp = require('os').tmpdir() + '/venv_val.txt';
    fs.writeFileSync(tmp, value, { encoding: 'utf8' });

    // Remove first (ignore error if doesn't exist)
    try { execSync(`npx vercel env rm ${key} production --yes`, { stdio: 'pipe' }); } catch {}

    // Re-add from file (no newline added)
    execSync(`npx vercel env add ${key} production < "${tmp}"`, {
      shell: 'cmd.exe',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(`✅ Set ${key}`);
  } catch (e) {
    console.error(`❌ Failed ${key}: ${e.message}`);
  }
}
console.log('\nDone. Run: npx vercel deploy --prod --yes');
