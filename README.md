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

## Estado atual (v2.2, Fase 8.1)

Funciona hoje:

- **Início**, **Todas as fotos** (filtros, ordenação e busca Ctrl+K), **Timeline**, **Favoritos**, **Álbuns** manuais e inteligentes, **visualizador**
- **Organizar**, com contadores no menu:
  - possíveis duplicatas (cópias exatas e visuais), com a melhor candidata destacada;
  - fotos semelhantes e sequências em rajada;
  - baixa qualidade (borradas, escuras, estouradas, sem informação, baixa resolução);
  - fotos momentâneas (documentos, fotos acidentais) e screenshots.
- **Revisão**: todas as sugestões priorizadas, por motivo, com Manter, Ignorar, Favoritar e Enviar para a lixeira (por foto ou em lote) e histórico com Desfazer
- **Exemplos**: dê fotos como exemplo do que você costuma apagar (ou manter) e as parecidas aparecem na Revisão
- **Cópias exatas**: "Remover todas" deixa só a sugerida de cada grupo; opcionalmente, isso acontece sozinho depois de cada análise
- **Lixeira** reversível dentro da própria biblioteca (`.photovault-trash`), com restauração byte a byte, exclusão definitiva com confirmação dupla e opção de usar a lixeira do sistema
- **Viagens e eventos** encontrados pelas datas e pela localização (ex.: "Viagem para Gramado e Canela · 10 a 12 jul 2025 · 90 fotos"): aceite, edite (título, período, fotos) ou ignore; tela do evento com destaques, cards por dia e linha do tempo; álbuns inteligentes sugeridos
- **IA local (opcional)**: busca pelo conteúdo das fotos, em português ("cachorro na praia", "gato 2024"), e etiquetas de cena ("Praia 71 %"). Os modelos (228 MB) são baixados só quando você pede, em Configurações → IA local; depois disso tudo roda no seu computador
- **Pessoas (opcional)**: os rostos são agrupados por pessoa; você dá nomes, junta grupos, corrige ("Não é a Ana", "Não é um rosto") e busca pelo nome ("Ana", "Ana praia", "Ana Bruno"). Os modelos de rostos (39 MB) têm download próprio, em Configurações → IA local, e rostos e nomes ficam só no seu computador
- **Tags** manuais, buscáveis e filtráveis; classificação de cada foto no painel de informações
- **Organizar pastas**: move e renomeia os arquivos por uma regra (Ano / Mês, Ano / Evento, Ano / Local ou a sua, e nome por data e hora), com prévia antes → depois de cada arquivo, confirmação, pausa (inclusive se o HD for desconectado), retomada e desfazer. Nada é sobrescrito, e os arquivos `.xmp`/`.aae`/`.json` vão junto
- Limiares e prioridades ajustáveis em Configurações (recalcula em segundos, sem reler as fotos)
- Várias bibliotecas, scan incremental, análise em segundo plano, modo portátil no Windows e no Linux

Nada é apagado automaticamente: a organização só sugere, e toda operação no disco pede confirmação e fica registrada.

Ainda não funciona:

- Miniaturas de HEIC (os metadados já são lidos); vídeos com codec que o sistema não toca ficam com o ícone
- Mapa das viagens, olhos fechados na melhor candidata, busca por foto de exemplo; os exemplos ainda comparam o aspecto das fotos, não o conteúdo

Veja o [plano](docs/PLANO.md).

## Licença

Privado.

Dados de terceiros: nomes de lugares do [GeoNames](https://www.geonames.org) (`cities1000`, licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), embutidos em `crates/photovault-core/data/cities.tsv.gz` (gerado por `data/build_cities.py`).

IA local (baixada sob demanda, não distribuída com o app): [CLIP ViT-B/32](https://github.com/openai/CLIP) (OpenAI, licença MIT; ONNX de [Xenova/clip-vit-base-patch32](https://huggingface.co/Xenova/clip-vit-base-patch32)) e [clip-ViT-B-32-multilingual-v1](https://huggingface.co/sentence-transformers/clip-ViT-B-32-multilingual-v1) (sentence-transformers, licença Apache 2.0). Rostos: [YuNet](https://huggingface.co/opencv/face_detection_yunet) (MIT) e [SFace](https://huggingface.co/opencv/face_recognition_sface) (Apache 2.0), do OpenCV Zoo. Motor: [ONNX Runtime](https://onnxruntime.ai) (MIT), via o crate `ort`.
