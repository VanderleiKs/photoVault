#!/usr/bin/env node
// Assemble the portable folder for the current OS after `tauri build`:
//
//   release/PhotoVault/
//     PhotoVault.exe | PhotoVault.AppImage
//     portable.flag      ← keeps data/, thumbnails/, cache/, logs/ next to the app
//     LEIA-ME.txt
//
// Windows: run after `tauri build --no-bundle`. Linux: after `tauri build --bundles appimage`.
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const out = join(root, 'release', 'PhotoVault');
const target = join(root, 'target', 'release');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

let app;
if (process.platform === 'win32') {
  app = 'PhotoVault.exe';
  copyFileSync(join(target, 'photovault.exe'), join(out, app));
} else if (process.platform === 'linux') {
  const dir = join(target, 'bundle', 'appimage');
  const image = existsSync(dir) && readdirSync(dir).find((f) => f.endsWith('.AppImage'));
  if (!image) throw new Error(`AppImage not found in ${dir}; run: npx tauri build --bundles appimage`);
  app = 'PhotoVault.AppImage';
  copyFileSync(join(dir, image), join(out, app));
  chmodSync(join(out, app), 0o755);
} else {
  throw new Error(`Portable packaging is not supported on ${process.platform}`);
}

writeFileSync(join(out, 'portable.flag'), 'Este arquivo ativa o modo portátil do PhotoVault.\n');
writeFileSync(
  join(out, 'LEIA-ME.txt'),
  [
    'PhotoVault - modo portátil',
    '',
    `Execute ${app}. Nada é instalado: o catálogo (data/), as miniaturas (thumbnails/),`,
    'o cache e os logs ficam nesta pasta. Copie a pasta inteira para levar o PhotoVault',
    'para outro disco ou computador (por exemplo, junto das fotos no HD externo).',
    '',
    'Não apague o arquivo portable.flag: sem ele, os dados vão para a pasta do sistema.',
    process.platform === 'win32'
      ? 'Requisitos: Windows 11 (o WebView2 já vem instalado).'
      : 'Requisitos: Linux x86_64 com glibc 2.35 ou mais recente.',
    '',
  ].join('\n'),
);

console.log(`Portable folder ready: ${out}`);
