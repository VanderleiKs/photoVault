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

## Estado atual (v0.7, Fase 4)

Funciona hoje:

- **Início**, **Todas as fotos** (filtros, ordenação e busca Ctrl+K), **Timeline**, **Favoritos**, **Álbuns** manuais e inteligentes, **visualizador**
- **Organizar**, com contadores no menu:
  - possíveis duplicatas (cópias exatas e visuais), com a melhor candidata destacada;
  - fotos semelhantes e sequências em rajada;
  - baixa qualidade (borradas, escuras, estouradas, sem informação, baixa resolução);
  - fotos momentâneas (documentos, fotos acidentais) e screenshots.
- **Tags** manuais, buscáveis e filtráveis; classificação de cada foto no painel de informações
- Limiares da organização ajustáveis em Configurações (recalcula em segundos, sem reler as fotos)
- Várias bibliotecas, scan incremental, análise em segundo plano, modo portátil no Windows e no Linux

Nada é apagado automaticamente: a organização só sugere.

Ainda não funciona:

- Miniaturas de HEIC (os metadados já são lidos) e de vídeo
- Revisão das sugestões e lixeira (Fase 5), viagens (Fase 6), pessoas e IA local (Fase 7)

Veja o [plano](docs/PLANO.md).

## Licença

Privado.
