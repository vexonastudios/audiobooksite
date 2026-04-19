/**
 * Adds R2 environment variables to Vercel cleanly (no Windows newline corruption).
 * Run: node scripts/set-vercel-env.js
 */
const { execSync } = require('child_process');

const vars = [
  ['R2_ACCOUNT_ID',        '7f888ea20d137eb5eba42db45b492cba'],
  ['R2_ENDPOINT',          'https://7f888ea20d137eb5eba42db45b492cba.r2.cloudflarestorage.com'],
  ['R2_BUCKET_NAME',       'scrollreader'],
  ['R2_ACCESS_KEY_ID',     'be51efbe36931572c0ef702cd1ec057a'],
  ['R2_SECRET_ACCESS_KEY', '1a50708e657b06ad3b2ae807fa4680c35627f9199d225c8b9f1aa0e53aca4752'],
  ['R2_PUBLIC_URL',        'https://audio.scrollreader.com'],
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
