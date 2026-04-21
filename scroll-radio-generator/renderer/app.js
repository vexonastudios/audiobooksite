// renderer/app.js — Scroll Radio Generator UI logic

const api = window.electronAPI;

// ── State ─────────────────────────────────────────────────────────────────────

let isRunning = false;

// ── DOM refs ──────────────────────────────────────────────────────────────────

const logArea       = document.getElementById('logArea');
const logEmpty      = document.getElementById('logEmpty');
const btnDryRun     = document.getElementById('btnDryRun');
const btnGenerate   = document.getElementById('btnGenerate');
const btnCancel     = document.getElementById('btnCancel');
const btnClearLog   = document.getElementById('btnClearLog');
const btnOpenFolder = document.getElementById('btnOpenFolder');
const btnOpenSite   = document.getElementById('btnOpenSite');
const btnSave       = document.getElementById('btnSave');
const saveMsg       = document.getElementById('saveMsg');
const footerStatus  = document.getElementById('footerStatus');
const progressBar   = document.getElementById('progressBar');
const statusDot     = document.getElementById('statusDot');
const statusText    = document.getElementById('statusText');
const statStatus    = document.getElementById('statStatus');
const statBooks     = document.getElementById('statBooks');
const statChapters  = document.getElementById('statChapters');
const statSelected  = document.getElementById('statSelected');
const statDuration  = document.getElementById('statDuration');

// Settings inputs
const settingsMap = {
  DATABASE_URL:              's-db',
  ELEVENLABS_API_KEY:        's-el-key',
  ELEVENLABS_VOICE_ID:       's-el-voice',
  ELEVENLABS_MODEL:          's-el-model',
  R2_ACCOUNT_ID:             's-r2-account',
  R2_ACCESS_KEY_ID:          's-r2-key',
  R2_SECRET_ACCESS_KEY:      's-r2-secret',
  R2_BUCKET_NAME:            's-r2-bucket',
  R2_PUBLIC_DOMAIN:          's-r2-domain',
  TARGET_DURATION_SECS:      's-target',
  MIN_CHAPTER_SECS:          's-min',
  MAX_CONSECUTIVE_SAME_BOOK: 's-max-consec',
};

// ── Log helpers ───────────────────────────────────────────────────────────────

function appendLog(text, cls = 'stdout') {
  logEmpty.style.display = 'none';

  // Color-code specific patterns in the text
  const colored = colorize(text);

  const line = document.createElement('div');
  line.className = `log-line ${cls}`;
  line.innerHTML = colored;
  logArea.appendChild(line);
  logArea.scrollTop = logArea.scrollHeight;

  // Parse stats from stdout
  extractStats(text);
}

function colorize(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/(✅[^\n]*)/g, '<span class="kw-success">$1</span>')
    .replace(/(❌[^\n]*)/g, '<span class="kw-error">$1</span>')
    .replace(/(⚠️[^\n]*)/g, '<span class="kw-warn">$1</span>')
    .replace(/(📻[^\n]*)/g, '<span class="kw-brand">$1</span>')
    .replace(/(📚[^\n]*)/g, '<span class="kw-brand">$1</span>')
    .replace(/(🎲[^\n]*)/g, '<span class="kw-brand">$1</span>')
    .replace(/(🎙️[^\n]*)/g, '<span class="kw-muted">$1</span>')
    .replace(/(✂️[^\n]*)/g, '<span class="kw-muted">$1</span>')
    .replace(/(🔧[^\n]*)/g, '<span class="kw-muted">$1</span>')
    .replace(/(☁️[^\n]*)/g, '<span class="kw-brand">$1</span>')
    .replace(/(═+)/g, '<span class="kw-brand">$1</span>')
    .replace(/(\[\d+\/\d+\])/g, '<span class="kw-brand">$1</span>');
}

function extractStats(text) {
  // "Found 150 books with 2389 eligible chapters."
  const booksMatch = text.match(/Found (\d+) books with (\d+) eligible chapters/);
  if (booksMatch) {
    statBooks.textContent = booksMatch[1];
    statChapters.textContent = booksMatch[2];
  }
  // "Selected 10 chapters (~118 min of audio)"
  const selMatch = text.match(/Selected (\d+) chapters \(~([\d]+) min/);
  if (selMatch) {
    statSelected.textContent = selMatch[1];
    statDuration.textContent = `~${selMatch[2]}m`;
  }
  // "Total duration: 2h 3m 14s"
  const durMatch = text.match(/Total duration: ([^\n]+)/);
  if (durMatch) {
    statDuration.textContent = durMatch[1].trim();
  }
}

function clearLog() {
  logArea.innerHTML = '';
  logArea.appendChild(logEmpty);
  logEmpty.style.display = '';
  statBooks.textContent = '—';
  statChapters.textContent = '—';
  statSelected.textContent = '—';
  statDuration.textContent = '—';
}

// ── Status helpers ────────────────────────────────────────────────────────────

function setRunning(label) {
  isRunning = true;
  statusDot.className = 'status-dot running';
  statusText.textContent = label;
  statStatus.textContent = label;
  btnDryRun.disabled = true;
  btnGenerate.disabled = true;
  btnCancel.style.display = '';
  progressBar.style.display = '';
  footerStatus.textContent = `${label} in progress…`;
}

function setIdle(success, msg) {
  isRunning = false;
  statusDot.className = `status-dot ${success ? 'success' : 'error'}`;
  statusText.textContent = success ? 'Done' : 'Error';
  statStatus.textContent = success ? 'Done ✅' : 'Error ❌';
  btnDryRun.disabled = false;
  btnGenerate.disabled = false;
  btnCancel.style.display = 'none';
  progressBar.style.display = 'none';
  footerStatus.textContent = msg;
}

// ── IPC event handlers ────────────────────────────────────────────────────────

api.onGenStarted(({ dryRun }) => {
  clearLog();
  setRunning(dryRun ? 'Dry Run' : 'Generating');
  appendLog(`Starting ${dryRun ? 'dry run' : 'full generation'}…\n`, 'info');
});

api.onGenLog(({ type, text }) => {
  const cls = type === 'stderr' ? 'stderr' : type === 'error' ? 'error' : 'stdout';
  appendLog(text, cls);
});

api.onGenDone(({ code, success }) => {
  if (success) {
    appendLog('\n✅ Completed successfully.\n', 'success');
    setIdle(true, 'Done! Check the output folder for your files.');
  } else {
    appendLog(`\n❌ Process exited with code ${code}.\n`, 'error');
    setIdle(false, `Generation failed (exit code ${code}). See log for details.`);
  }
});

// ── Button handlers ───────────────────────────────────────────────────────────

btnDryRun.addEventListener('click', () => {
  if (isRunning) return;
  api.runDryRun();
});

btnGenerate.addEventListener('click', () => {
  if (isRunning) return;
  api.runGenerate();
});

btnCancel.addEventListener('click', () => {
  api.cancelGeneration();
  setIdle(false, 'Cancelled by user.');
  appendLog('\n⚠️ Cancelled by user.\n', 'stderr');
});

btnClearLog.addEventListener('click', () => {
  if (!isRunning) clearLog();
});

btnOpenFolder.addEventListener('click', () => {
  api.openOutputFolder();
});

btnOpenSite.addEventListener('click', () => {
  api.openExternal('https://scrollreader.com');
});

// ── Sidebar tab switching ─────────────────────────────────────────────────────

document.querySelectorAll('.sidebar-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.panel}`).classList.add('active');
  });
});

// ── Settings load / save ──────────────────────────────────────────────────────

async function loadSettings() {
  const s = await api.loadSettings();
  for (const [envKey, elId] of Object.entries(settingsMap)) {
    const el = document.getElementById(elId);
    if (el && s[envKey]) el.value = s[envKey];
  }
}

btnSave.addEventListener('click', async () => {
  const updates = {};
  for (const [envKey, elId] of Object.entries(settingsMap)) {
    const el = document.getElementById(elId);
    if (el && el.value.trim()) updates[envKey] = el.value.trim();
  }
  await api.saveSettings(updates);
  saveMsg.textContent = '✓ Saved';
  setTimeout(() => { saveMsg.textContent = ''; }, 2000);
});

// ── Init ──────────────────────────────────────────────────────────────────────

loadSettings();
