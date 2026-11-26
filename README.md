# Bolhas no Twitter

Leitor das bolhas de retweet no Twitter brasileiro em quatro eventos políticos entre 2022 e 2023
(mobilização de 7 de setembro, caso Roberto Jefferson, debate sobre democracia no 2º turno e ataques
de 8 de janeiro). Para cada evento, o app
mostra o grafo de quem retuitou quem, separado em grupos clicáveis, e, para cada grupo, os tweets
mais retuitados, uma síntese com citações e a comparação com outro grupo.

## Origem

O código-base foi extraído do front-end do meu TCC (repositório `tcc-ufmg`, pastas `web/` e
`data/export/`), com o histórico de commits preservado. A partir daqui, este repositório é o sistema do
trabalho prático de Teste de Software (UFMG): testes de unidade e e2e, cobertura, CI/CD e deploy. O
plano está em [`docs/bolhas-no-twitter.md`](docs/bolhas-no-twitter.md).

## Rodar

Requer Node 24 (veja `.nvmrc`).

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # testes de unidade (Vitest)
npm run build      # typecheck + build em dist/
```

Rotas:

| Rota | O que mostra |
|---|---|
| `/` | Os quatro eventos |
| `/como-funciona` | A animação de como as bolhas se formam |
| `/:evento` | As bolhas do evento, com a maior aberta |
| `/:evento/:community` | Uma bolha aberta. Aceita `?comparar=<community>` |

Comportamento das rotas:

- Um slug inválido volta para `/`.
- Uma community inválida abre a primeira bolha.
- `?tags=0` oculta a inclinação política.
- O tema escuro é o padrão e fica salvo no `localStorage`.

## Dados

O app não tem backend. `vite.config.ts` aponta `publicDir` para `data/export/`, então o app busca
JSON estático com `fetch("/index.json")` e `fetch("/<slug>/tweets.json")`. As imagens dos grafos
(`grafo-claro.webp`, `grafo-escuro.webp` e as variantes por grupo) e a grade de clique (`grafo.json`)
também vêm do export. O contrato dos dados está em `src/types.ts`.

O app não calcula nada da pesquisa: grupos, pureza e contagens chegam prontos do export. Ele só
formata os números e faz a razão `retweet_count / rt_event`.

## Estrutura

- `src/data/`: fetch com cache em memória (`loadIndex`, `loadEvent`, `loadGroupMap`) e hooks (`useIndex`,
  `useEvent`, `useGroupMap`).
- `src/content/events.ts`: contexto factual de cada evento (texto, fontes, marcos da linha do tempo).
- `src/lib/`: utilitários puros:
  - `groupMap`: traduz o clique na imagem para um grupo;
  - `timeline`;
  - `citations`;
  - `thread`;
  - `compare`;
  - `shared`;
  - `palette`;
  - `format`;
  - `entities`;
  - `paths`;
  - `nav`;
  - `theme`;
  - `glossary`.
- `src/components/`: os componentes do grafo (`GraphStage`, `EventGraph`), a bolha aberta (`GroupPanel`), a
  comparação (`Comparison`), os tweets (`TweetThread`, `ThreadTweet`, `TweetText`, `CitedText`, `MediaGrid`,
  `Avatar`), a animação (`OverlapDemo`), além de `Timeline` e `States`.
- `src/pages/`: `Home`, `HowItWorks` e `EventPage`.
- `src/App.tsx`: tema, cabeçalho (`PageFrame`) e `WithIndex`. As rotas ficam em `src/main.tsx`.
