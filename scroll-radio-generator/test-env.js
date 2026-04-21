import fs from 'fs';
import path from 'path';

const ENV_PATH = path.resolve('.env');
console.log('ENV_PATH:', ENV_PATH);
const raw = fs.readFileSync(ENV_PATH, 'utf8');
const settings = {};
for (const line of raw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  settings[key] = val;
}
console.log(settings);
