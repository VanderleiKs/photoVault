#!/usr/bin/env node
// Linux only: Microsoft's official ONNX Runtime (CPU) for the local AI, bundled in the
// AppImage (`tauri.conf.json` → bundle.linux.appimage.files) and used by `tauri dev`.
//
// Why not the static build that `ort` downloads (used on Windows): it needs glibc 2.38+
// and GCC 13's libstdc++, so it doesn't link on Ubuntu 22.04 and wouldn't run on older
// distros. Microsoft's needs glibc 2.27 / GLIBCXX_3.4.21.
//
// Pinned version and SHA-256; does nothing on other systems or when the file is right.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const VERSION = '1.28.2';
const DOWNLOAD = `https://github.com/microsoft/onnxruntime/releases/download/v${VERSION}/onnxruntime-linux-x64-${VERSION}.tgz`;
const ARCHIVE_SHA256 = 'd7209b8751b27b862b0c76332c2e20e203396edb5dab700ecf4bb485cf147415';
const LIB_SHA256 = '088f24b1fc56714d3efaaeb3ac2ee486a5d7b50ccfbb3dd26fd1a612534a05fb';

if (process.platform !== 'linux' || process.arch !== 'x64') process.exit(0);

const root = new URL('..', import.meta.url).pathname;
const dest = join(root, 'src-tauri', 'lib', 'libonnxruntime.so.1');
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

if (existsSync(dest) && sha256(readFileSync(dest)) === LIB_SHA256) process.exit(0);

console.log(`Downloading ONNX Runtime ${VERSION} (Microsoft, MIT) for the local AI…`);
const response = await fetch(DOWNLOAD);
if (!response.ok) throw new Error(`Download failed: ${response.status} ${DOWNLOAD}`);
const archive = Buffer.from(await response.arrayBuffer());
if (sha256(archive) !== ARCHIVE_SHA256) throw new Error('ONNX Runtime archive: unexpected SHA-256');

const work = mkdtempSync(join(tmpdir(), 'pv-ort-'));
try {
  const tgz = join(work, 'ort.tgz');
  writeFileSync(tgz, archive);
  const inner = `onnxruntime-linux-x64-${VERSION}/lib/libonnxruntime.so.${VERSION}`;
  execFileSync('tar', ['xzf', tgz, '-C', work, inner]);
  const lib = join(work, inner);
  if (sha256(readFileSync(lib)) !== LIB_SHA256) throw new Error('libonnxruntime: unexpected SHA-256');
  mkdirSync(join(root, 'src-tauri', 'lib'), { recursive: true });
  copyFileSync(lib, dest);
  console.log(`ONNX Runtime ready: ${dest}`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
