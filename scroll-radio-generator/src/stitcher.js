// src/stitcher.js
// Concatenates all clip + bumper MP3 files into one long block MP3.
// Uses ffmpeg's concat demuxer — fastest method, no re-encoding.

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Concatenates an ordered list of MP3 file paths into a single output file.
 *
 * @param {string[]} inputPaths - Ordered array of local MP3 file paths
 * @param {string}  outputPath  - Where to write the final stitched MP3
 * @param {string}  tempDir     - Working directory for the concat list file
 */
export async function stitchClips(inputPaths, outputPath, tempDir) {
  if (inputPaths.length === 0) throw new Error('stitchClips: no input files provided');

  // Write the ffmpeg concat file
  const listPath = path.join(tempDir, 'concat_list.txt');
  const listContent = inputPaths
    .map(p => `file '${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`)
    .join('\n');
  fs.writeFileSync(listPath, listContent, 'utf8');

  const args = [
    '-y',
    '-f', 'concat',           // use concat demuxer
    '-safe', '0',             // allow absolute paths in the list
    '-i', listPath,           // the list file
    '-c', 'copy',             // no re-encoding — instant stitch
    outputPath,
  ];

  console.log(`🔧 Stitching ${inputPaths.length} clips into final MP3...`);

  try {
    await execFileAsync('ffmpeg', args, { timeout: 600_000 }); // 10 min max
  } catch (err) {
    if (err.code !== 0) {
      throw new Error(`ffmpeg stitch failed: ${err.stderr ?? err.message}`);
    }
  }

  // Cleanup the list file
  fs.unlinkSync(listPath);
  console.log(`   ✅ Stitch complete → ${path.basename(outputPath)}`);
}
