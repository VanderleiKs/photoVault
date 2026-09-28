# PhotoVault

Aplicativo portátil (sem instalação) para organizar bibliotecas pessoais de fotos e vídeos, para Windows 11 e Linux. O app nunca modifica seus arquivos: ele constrói uma biblioteca lógica sobre eles.

**Stack:** Angular 22 + Optimus UI v2 + Tailwind 4 + PrimeIcons · Tauri 2 + Rust 2024 · SQLite (WAL)

- Requisitos do produto: [docs/PRD.md](docs/PRD.md)
- Diagnóstico e plano de fases: [docs/PLANO.md](docs/PLANO.md)
- Guia para quem desenvolve (arquitetura e armadilhas): [AGENTS.md](AGENTS.md)

## Pré-requisitos

- [Rust](https://rustup.rs/) stable
- Node.js 22+ e npm 10+
- Linux:
  ```bash
  sudo apt install build-essential pkg-config libwebkit2gtk-4.1-dev libgtk-3-dev \
    librsvg2-dev patchelf
  ```
- Windows 11: o WebView2 já vem no sistema; é preciso o Visual Studio Build Tools (C++).

## Desenvolvimento

```bash
npm install
npm run tauri:dev          # Angular + backend, com live reload
npm test                   # testes do frontend (Vitest)
cargo test --workspace     # testes do backend (também regenera os bindings TS)
```

Para testar com um catálogo limpo: `PHOTOVAULT_HOME=/tmp/pv npm run tauri:dev`.

## Gerar a versão portátil

```bash
# Linux
npx tauri build --bundles appimage && npm run package:portable
# Windows
npx tauri build --no-bundle && npm run package:portable
```

O resultado fica em `release/PhotoVault/`. Basta compactar e distribuir. Tudo o que o app grava fica ao lado do executável:

```text
PhotoVault/
├── PhotoVault.exe | PhotoVault.AppImage
├── portable.flag                           # ativa o modo portátil (não apague)
├── data/catalog.db                         # catálogo SQLite (WAL)
├── thumbnails/256/<ab>/<cd>/<id>.webp      # miniaturas
├── cache/webview/                          # perfil do WebView (fora de %LOCALAPPDATA%)
└── logs/photovault.log.AAAA-MM-DD
```

Sem o `portable.flag`, os dados vão para a pasta de dados do sistema. O CI gera os dois pacotes automaticamente a cada tag `v*` (`.github/workflows/release.yml`).

## Estado atual (v0.4, Fase 2)

Funciona hoje:

- Layout novo (sidebar, topbar, painel de informações), tema claro e escuro, layout responsivo
- Várias bibliotecas: adicionar, trocar a ativa, renomear, relocalizar (quando o disco muda de letra ou de ponto de montagem) e remover do catálogo
- Scan incremental rápido (novos, modificados, ausentes, restaurados e movidos, preservando favoritos)
- Análise em segundo plano, com pausa e retomada, que continua depois de fechar o app:
  - data do EXIF (ou do nome do arquivo);
  - câmera, lente e exposição;
  - local offline a partir do GPS;
  - miniaturas corretamente orientadas;
  - hashes para duplicatas.
- Galeria com rolagem infinita, timeline por mês e visualizador (zoom, teclado, vídeo)
- Diagnóstico de arquivos com problema em Configurações
- Modo portátil real no Windows e no Linux

Ainda não funciona:

- Miniaturas de HEIC (os metadados já são lidos)
- Miniaturas de vídeo
- Busca
- Álbuns
- Tela de duplicatas

Veja o [plano](docs/PLANO.md).

## Licença

Privado.
