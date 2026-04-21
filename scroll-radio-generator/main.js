// main.js — Electron main process
// Entry point for the Scroll Radio desktop app.
// Spawns "node generation.js [--dry-run]" as a child process and streams
// its stdout back to the renderer via IPC events.

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { spawn } from 'child_process';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve('.env');

// ── Window ────────────────────────────────────────────────────────────────────

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 740,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0d0d14',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: path.join(__dirname, 'renderer', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Remove default menu on Windows/Linux
  if (process.platform !== 'darwin') {
    win.setMenuBarVisibility(false);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── IPC: Settings (.env read/write) ──────────────────────────────────────────

ipcMain.handle('load-settings', () => {
  if (!fs.existsSync(ENV_PATH)) return {};
  const raw = fs.readFileSync(ENV_PATH, 'utf8');
  const settings = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    settings[key] = val;
  }
  return settings;
});

ipcMain.handle('save-settings', (_event, updates) => {
  let raw = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^(${key}\\s*=.*)$`, 'm');
    const newLine = `${key}="${value}"`;
    if (regex.test(raw)) {
      raw = raw.replace(regex, newLine);
    } else {
      raw += `\n${newLine}`;
    }
  }

  fs.writeFileSync(ENV_PATH, raw.trim() + '\n', 'utf8');
  return { ok: true };
});

// ── IPC: Generation ───────────────────────────────────────────────────────────

let activeChild = null;

function runGeneration(event, dryRun) {
  if (activeChild) {
    event.sender.send('gen-log', { type: 'error', text: 'A generation is already running.' });
    return;
  }

  const args = ['generation.js'];
  if (dryRun) args.push('--dry-run');

  event.sender.send('gen-started', { dryRun });

  activeChild = spawn('node', args, {
    cwd: __dirname,
    env: { ...process.env },
  });

  activeChild.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    event.sender.send('gen-log', { type: 'stdout', text });
  });

  activeChild.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    event.sender.send('gen-log', { type: 'stderr', text });
  });

  activeChild.on('close', (code) => {
    activeChild = null;
    event.sender.send('gen-done', { code, success: code === 0 });
  });

  activeChild.on('error', (err) => {
    activeChild = null;
    event.sender.send('gen-log', { type: 'error', text: `Failed to start: ${err.message}` });
    event.sender.send('gen-done', { code: -1, success: false });
  });
}

ipcMain.on('run-dry-run', (event) => runGeneration(event, true));
ipcMain.on('run-generate', (event) => runGeneration(event, false));

ipcMain.on('cancel-generation', () => {
  if (activeChild) {
    activeChild.kill();
    activeChild = null;
  }
});

ipcMain.on('open-output-folder', () => {
  shell.openPath(path.join(__dirname, 'output'));
});

ipcMain.on('open-external', (_event, url) => {
  shell.openExternal(url);
});
