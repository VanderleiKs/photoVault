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

## Estado atual (v0.5, Fase 3)

Funciona hoje:

- **Início** com foto de destaque, totais, anos e fotos recentes
- **Todas as fotos** com grade rápida mesmo com dezenas de milhares de itens, filtros (tipo, favoritas, ano, mês, local, câmera), ordenação e **busca (Ctrl+K)** por nome, pasta, local, álbum ou data ("julho 2025")
- **Seleção múltipla** (círculo na miniatura, Shift/Ctrl+clique) com ações em lote
- **Favoritos** em qualquer lugar (coração, tecla F, em lote)
- **Álbuns** manuais e inteligentes (salve os filtros atuais como álbum que se atualiza sozinho)
- **Timeline** por ano, mês e dia, com navegação rápida por ano
- **Visualizador** com contador no contexto, tira de miniaturas, zoom, teclado e vídeo
- Várias bibliotecas, scan incremental e análise em segundo plano (EXIF, local, miniaturas, hashes)
- Modo portátil real no Windows e no Linux

Ainda não funciona:

- Miniaturas de HEIC (os metadados já são lidos) e de vídeo
- Duplicatas, fotos semelhantes e qualidade (Fase 4)
- Lixeira e revisão (Fase 5), viagens (Fase 6), pessoas (Fase 7)

Veja o [plano](docs/PLANO.md).

## Licença

Privado.
