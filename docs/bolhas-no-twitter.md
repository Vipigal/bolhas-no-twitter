# bolhas-no-twitter: front do TCC como sistema do TP de Teste de Software

> **Status:** em revisão · **Data:** 2026-11-26
> **Spec vivo:** este arquivo é a fonte única da tarefa. Mudanças são editadas aqui e anotadas em
> "Mudança no spec" na seção Registro; leia o Registro junto do restante.
> **Repos:** `bolhas-no-twitter` (novo, dono: Vinicius) recebe o snapshot do `web/` de `tcc-ufmg`.
> `tcc-ufmg` só é lido, nunca alterado. A fonte única deste spec é `docs/` do repo
> `bolhas-no-twitter`. A cópia em `teste-softwares/docs/` ficou só como rascunho histórico.

## Para o humano

- **TL;DR:** o leitor de clusters do TCC (React, Vite, JSON estático, sem backend) vira um repo
  próprio, `bolhas-no-twitter`, levando os 5 commits em que nasceu. Em cima dele entram o que o TP
  pede e o app ainda não tem: testes de componentes, páginas e hooks até a cobertura ≥ 80% (hoje
  está em 32,5% das linhas), 5 testes e2e em Playwright, CI em Linux, macOS e Windows, Codecov e
  deploy na Vercel. Os commits novos saem do próprio trabalho (cerca de 45 a 55) e nenhum é
  fabricado.
- **Revise com atenção:**
  1. P2: o e2e roda contra o `data/export` real (tweets de pessoas reais publicados num site aberto).
  2. P3: o que entra no cálculo de cobertura e quais limites viram gate.
  3. P7: o deploy usa a integração Git da Vercel, não um job do Actions.
- **O que muda para o visitante do site:** nada. O app vai para produção igual ao do TCC. Só
  muda o que algum teste revelar como bug, e cada correção vem com um teste de regressão.

## 1. Contexto e problema

O TP (README em `teste-softwares/README.md`) pede um sistema web pequeno, com nome próprio, e exige:

- ≥ 50 testes de unidade;
- 5 testes e2e;
- cobertura ≥ 80% publicada no Codecov;
- CI no GitHub Actions em Linux, macOS e Windows;
- ≥ 50 commits pequenos e descritivos;
- deploy em plano gratuito;
- README com 5 seções;
- vídeo de até 5 minutos.

Levantamento dos repos do usuário (2026-11-26): o front do TCC é o candidato que já tem um
app web pronto, sem backend, com deploy preparado (`vercel.json`) e 58 testes unitários. O que
falta é justamente o objeto do TP:

- **Cobertura:** 32,5% das linhas (171/526) e 26,3% dos branches. `src/lib` está em 87%; `components/`,
  `pages/`, `data/`, `content/` e `App.tsx` estão em 0%.
- **Testes:** nenhum e2e, nenhum teste de componente.
- **Infra:** nenhum CI.
- **Histórico:** só 5 commits tocam `web/` ou `data/export/` em `tcc-ufmg`, todos grandes.

## 2. Princípios

- **Histórico verdadeiro.** Nada de commits picados artificialmente nem datas retroativas. O
  versionamento é critério avaliado, e o histórico tem que refletir o processo real.
- **Testar pelo comportamento visível.** O teste renderiza o componente e consulta por papel,
  texto ou rótulo acessível, como o usuário veria. Nada de testar estado interno ou usar snapshot
  de DOM. É a "API pública" que o TP pede.
- **Um comportamento por teste, com nome que diz o comportamento.** Facilita o vídeo e a leitura
  do Codecov.
- **Comportamento do app intocado.** O TP mede testes, não features (decisão D5). Mudança de
  código de produção só para corrigir um bug que um teste revelou.
- **Nada depende de rede.** Unitários mockam `fetch`. O e2e serve o build local. Assim os testes
  passam igual nos três sistemas.

## 3. Decisões

### 3.1 Batidas (não reabrir)

| # | Decisão | Por quê |
|---|---|---|
| D1 | O sistema do TP é o leitor de clusters (`tcc-ufmg/web`) | App web pronto, sem backend, com deploy preparado. Evita os problemas de autoria, de Postgres no CI e de S3 do par sistemaCompsi e dacompsi-web-client |
| D2 | Snapshot com histórico: extrair `web/` e `data/export/` com `git filter-repo` | Preserva a origem (5 commits) sem custo. Os ~45 commits restantes vêm do trabalho do TP |
| D3 | Nome do repo: `bolhas-no-twitter` | Escolha do usuário. Nome próprio, como o TP exige |
| D4 | Snapshot congelado: o TCC segue em `tcc-ufmg`, sem sincronia entre os repos | Sem acoplamento. Se fizer sentido depois, os testes podem ser copiados de volta para o TCC |
| D5 | Nenhuma feature nova | O app já tem navegação, grafo clicável, comparação de grupos e tema. Escopo menor. Entra uma feature só se o professor achar a interação pouca |
| D6 | Commits reais, um por passo, mensagens no estilo Conventional Commits em pt-BR (`test: cobre GraphStage…`) | Atende "commits pequenos, frequentes e descritivos" sem fabricar nada |

### 3.2 Pendentes (confirmar na revisão)

| # | Proposta | Alternativa | Recomendação |
|---|---|---|---|
| P1 | Layout: o conteúdo de `web/` vai para a raiz, `data/export/` fica em `data/export/`, e `publicDir` vira `"data/export"` | Manter `web/` como subpasta | Proposta: raiz limpa, scripts e CI sem `working-directory` |
| P2 | Os unitários usam fixtures mínimas montadas em código. O e2e roda contra o `data/export` real servido por `vite preview` | O e2e usar um export reduzido em `e2e/fixtures` | Proposta: o e2e testa o que vai para produção, e os dados são estáticos (D4 congela). Pré-requisito: o orientador concordar com a publicação dos tweets (é necessário de qualquer jeito para o deploy) |
| P3 | Cobertura com v8 sobre `src/**`, excluindo `main.tsx`, `types.ts` e `*.test.*`. Limites no Vitest de 80% para linhas, statements e funções. Branches só aparecem no relatório. No Codecov, status de projeto com alvo de 80% | Também exigir 80% de branches | Proposta: o TP pede "cobertura ≥ 80%" sem especificar a métrica, e exigir branches dobraria o esforço em código visual. Os limites só viram gate na T10, quando a meta já tiver sido alcançada |
| P4 | Ambiente de teste `jsdom` global (os testes de `src/lib` continuam funcionando), `include` em `src/**/*.test.{ts,tsx}` | `happy-dom`, ou um ambiente diferente por arquivo | Proposta: jsdom é o padrão da Testing Library e o de menos surpresa |
| P5 | Node 24 LTS no CI e no `.nvmrc`. Matriz só de sistema operacional | Matriz de sistema × versão do Node | Proposta: o TP pede os 3 sistemas, não versões do Node |
| P6 | Playwright só com Chromium, num job `e2e` que roda nos 3 sistemas, servindo `npm run build && npm run preview` pelo `webServer` | Três browsers; e2e só no Linux | Proposta: cumpre os 3 sistemas sem triplicar o tempo do CI. O plano B é rodar só no Linux, se o macOS ou o Windows ficarem instáveis, e registrar isso aqui |
| P7 | Deploy pela integração Git da Vercel: produção a cada push na `main`, preview por PR | Deploy por um job do Actions com `vercel deploy` e token | Proposta: zero código e zero segredo no repo. O TP pede deploy, não que ele seja feito por um job |
| P8 | Branch curta e PR por tarefa, com merge na `main` depois do CI verde | Commits direto na `main` | Proposta: mostra o CI rodando em cada PR, o que reforça o critério de versionamento e rende material para o vídeo |

## 4. Escopo

### Dentro

- O repo novo com o snapshot e o histórico (T0).
- A fundação de testes: Testing Library, jsdom e fixtures (T1).
- Testes unitários de `lib`, `data`, `components`, `pages` e `App` até ≥ 80% (T4–T7).
- 5 testes e2e em Playwright (T8, T9).
- O workflow de CI nos 3 sistemas, com upload para o Codecov (T2, T9, T10).
- O deploy na Vercel (T3).
- O README com as 5 seções e os badges (T11).
- A correção de bugs que os testes revelarem, cada uma com o teste escrito antes da correção.

### Fora

- **Features novas (D5).** Entram se o professor achar a interação pouca. A candidata é a busca
  de tweets dentro da bolha, que é lógica pura e rende um fluxo e2e a mais.
- **Mudanças no `tcc-ufmg` (D4).** Copiar os testes de volta é um passo manual depois do TP.
- **Pipeline Python e dados brutos do TCC.** Só `data/export/` vem junto.
- **Vídeo e submissão no Moodle (T12).** São do usuário. O spec só lista o roteiro.

## 5. Terreno: como a codebase faz hoje

Fatos conferidos no `main` de `tcc-ufmg` em 2026-11-26:

- **Stack** (`web/package.json`): React 19.3, react-router-dom 7, Tailwind 4, Vite 8, Vitest 4.1,
  TypeScript ~6.0. Scripts `dev`, `build` (`tsc -b && vite build`), `test` (`vitest run`). Não há
  ESLint. `npm run build` passa e gera um bundle de 318 kB.
- **Dados** (`web/vite.config.ts:9`): `publicDir: "../data/export"`. O app faz `fetch` de
  `/index.json` e `/<slug>/tweets.json`, sem backend. São 63 arquivos (7,6 MB): JSON e imagens
  `.webp` dos grafos, para 4 eventos (`eleicoes`, `invasao-3-poderes`, `mobilizacao-0709`,
  `roberto-jefferson`).
- **Configuração de teste** (`web/vite.config.ts:10-13`): `environment: "node"`, `include` só
  `src/**/*.test.ts`. Há 10 arquivos e 58 testes, todos em `src/lib`, todos passando.
- **Rotas** (`web/src/main.tsx`):
  - `/`;
  - `/como-funciona`;
  - `/:evento`;
  - `/:evento/:community`;
  - `*`, que redireciona para `/`.

  Regras de query:
  - `?comparar=<community>` abre a comparação;
  - `?tags=0` oculta a inclinação e sobrevive à navegação (`src/lib/nav.ts`).
- **Carregamento** (`web/src/data/fetchJson.ts:17`): lança `ExportNotFoundError` se a resposta
  não for ok ou não for JSON. O `useAsync` (`web/src/data/hooks.ts:18`) descarta respostas de uma
  chave antiga e expõe os estados `loading`, `error` e `ready`. Erro não tem retry.
- **Pontos que exigem dublê no jsdom:**
  - `GraphStage` usa `getBoundingClientRect` para saber qual grupo foi clicado
    (`web/src/components/GraphStage.tsx:17`) e cai para a imagem sem destaque no `onError` do `<img>`.
  - `Comparison` lê `matchMedia("(prefers-reduced-motion…)")` (`web/src/components/Comparison.tsx:40`).
  - `TweetThread` usa `setTimeout` para centralizar o tweet citado e tirar o destaque
    (`web/src/components/TweetThread.tsx:60-61`), o que pede fake timers.
  - O tema persiste em `localStorage` (`web/src/lib/theme.ts:27`) com uma interface de storage
    injetável (`browserStorage`).
- **Gráficos são SVG ou `<img>`, sem canvas** (`OverlapDemo.tsx`, `GraphStage.tsx`). Dá para
  testar no jsdom pelo `aria-label` e pelos botões.
- **Deploy** (`web/vercel.json`): já tem o rewrite de SPA para `/index.html`.
- **Histórico que entra no snapshot** (`git log -- web data/export`):
  - `0219c3c` (2026-09-15)
  - `3427b08` (2026-09-15)
  - `2754878` (2026-10-13)
  - `ff845b6` (2026-10-14)
  - `46b8606` (2026-11-17)
- **Cobertura de base** (v8, `src/**`):

  | Métrica | Cobertura |
  |---|---|
  | Statements | 32,0% |
  | Branches | 26,3% |
  | Funções | 24,3% |
  | Linhas | 32,5% |

  Arquivos de `src/lib` sem cobertura: `nav.ts`, `palette.ts` e `glossary.ts`.

## 6. Desenho

### 6.1 Repo e snapshot

- O `git filter-repo` roda num clone descartável de `tcc-ufmg`. Ele mantém só `web/` e
  `data/export/` e move `web/` para a raiz (P1). Dos commits originais ficam data, autor e
  mensagem.
- O primeiro commit novo ajusta o snapshot para o repo novo:
  - `publicDir` passa para `"data/export"`;
  - `name` no `package.json` passa para `bolhas-no-twitter`;
  - entram `.nvmrc` e `.gitattributes` (`* text=auto eol=lf`, para o Windows não alterar fixtures);
  - entra um README inicial que declara a origem: "código-base extraído do front do TCC em `tcc-ufmg`".
- A criação do repo no GitHub e o primeiro push são confirmados com o usuário antes. São ações
  públicas.

### 6.2 Testes de unidade

- **Ferramentas:** Vitest, `@testing-library/react`, `@testing-library/user-event`,
  `@testing-library/jest-dom` e jsdom (P4).
- **Arquivo de setup `src/test/setup.ts`:**
  - stub de `matchMedia`;
  - stub de `scrollIntoView`;
  - limpeza de `localStorage` entre testes.
- **Builders de fixture em `src/test/fixtures.ts`:** `index`, `event`, `cluster`, `tweet` e
  `groupMap`, com padrões mínimos e override por campo (P2). Os builders seguem os tipos de
  `src/types.ts`, nunca um JSON copiado do export.
- **Helper para renderizar com providers:** envolve o componente em `MemoryRouter` e
  `ThemeProvider` e aceita uma rota inicial.
- **Rede:** `fetch` é mockado por teste com `vi.stubGlobal`. Nenhum teste lê `data/export`.

Alvos por área. A contagem é estimada; o que manda é a cobertura e um comportamento por teste.

| Área | Comportamentos a cobrir (exemplos) | Testes estimados |
|---|---|---|
| `lib` (lacunas) | `useShowTags`, `useKeptSearch` e `useNav` preservando `?tags=0`; `groupColor`; `axisColors`; glossário; ramos de `theme` e `citations` | 8–10 |
| `data` | `fetchJson`: ok; 404; HTML com status 200. Loaders montando o caminho certo. `useAsync`: loading → ready; loading → error; troca de chave descarta a resposta antiga | 8–10 |
| Componentes de tweet | `TweetText`, `CitedText`, `Avatar` (iniciais quando não há imagem), `MediaGrid`, `ThreadTweet`, `TweetThread` (centraliza e tira o destaque, com fake timers), `Timeline`, `States` | 12–16 |
| Grafo e grupos | `GraphStage`: clique no rótulo seleciona; clique na região seleciona; `onError` cai para a imagem sem destaque. `EventGraph`. `GroupPanel`. `Comparison` com e sem movimento reduzido. `OverlapDemo` pelos `aria-label` | 12–16 |
| `App` e páginas | `ThemeProvider` alterna e persiste. `WithIndex`: loading; erro. `Home` lista os 4 eventos. `EventPage`: slug inválido vai para `/`; community inválida abre a primeira bolha; `?comparar=`. `HowItWorks` avança os passos | 10–14 |

O total novo fica entre 50 e 66, mais os 58 que já existem.

### 6.3 Testes e2e (Playwright)

- **Configuração:** em `playwright.config.ts`, o `webServer` roda `npm run build && npm run
  preview` numa porta fixa, só com Chromium (P6). Os testes ficam em `e2e/`, com nomes de fluxo.
- **Consultas:** por papel e texto, sem seletor de CSS.

Os cinco fluxos:

1. **Abrir um evento pela home:** a home lista os 4 eventos. O clique em um leva a `/<slug>`, e a
   maior bolha aparece aberta.
2. **Trocar de grupo pelo grafo:** o clique no rótulo de outro grupo muda a URL para
   `/<slug>/<community>` e atualiza o painel do grupo.
3. **Comparar dois grupos:** a comparação abre pela UI (ou por `?comparar=`), e a URL e a tela
   mostram os dois grupos.
4. **Tema persistente:** depois de alternar para o claro e recarregar, a página continua no claro.
5. **Rotas inválidas e `?tags=0`:**
   - um slug inválido volta para `/`;
   - uma community inválida abre a primeira bolha;
   - `?tags=0` oculta a inclinação e se mantém ao navegar.

### 6.4 CI/CD

O workflow fica em `.github/workflows/ci.yml` e roda em `push` e `pull_request`, com dois jobs:

- **`unit`:** matriz `ubuntu-latest`, `macos-latest` e `windows-latest`.
  1. `npm ci`;
  2. `npm run build` (inclui o typecheck);
  3. `npm run test:coverage`;
  4. upload do lcov com `codecov/codecov-action` e o segredo `CODECOV_TOKEN`, só na matriz do Ubuntu,
     para evitar três uploads iguais.
- **`e2e`:** mesma matriz. Instala os browsers com `npx playwright install --with-deps chromium`
  e roda `npm run test:e2e`. Em caso de falha, sobe o relatório como artefato.

Complementos:

- `codecov.yml`: status de projeto com alvo de 80% e status de patch só informativo (P3).
- Deploy: integração Git da Vercel (P7). O link de produção vai para o README e para o campo
  "Website" do repo.

### 6.5 Plano de commits

Cada tarefa da §8 rende commits pequenos, um por componente testado ou por passo de
configuração. Estimativa por tarefa:

| Tarefa | Commits estimados |
|---|---|
| T0 | 3–4 |
| T1 | 2–3 |
| T2 | 3–5 |
| T3 | 1–2 |
| T4 | 4–5 |
| T5 | 6–8 |
| T6 | 5–7 |
| T7 | 5–6 |
| T8 | 6–7 |
| T9 | 1–2 |
| T10 | 1–2 |
| T11 | 2–3 |
| Correções | 3–8 |

O total fica entre 42 e 62 commits, mais os 5 herdados. O número de commits é acompanhado ao fechar cada onda.

## 7. Consequências

- **Fica melhor:**
  - o app do TCC sai com testes de componente e e2e, que podem voltar para o TCC;
  - o repo novo é pequeno, com uma stack só, e roda nos 3 sistemas sem serviços externos.
- **Fica pior ou mais caro:**
  - dois códigos do mesmo front passam a divergir (D4). Aceito porque o TP tem prazo e o TCC tem
    outro ritmo;
  - o CI com e2e nos 3 sistemas leva alguns minutos por push. Aceito para cumprir o enunciado à risca.
- **Riscos e mitigação:**
  - *Publicação dos tweets:* confirmar com o orientador antes do deploy (pré-requisito da T3).
  - *Instabilidade do Playwright no macOS ou no Windows:* esperar por papel e texto, nunca por
    tempo fixo. Se persistir, aplicar o plano B da P6 e registrar aqui.
  - *Componentes visuais sem cobertura suficiente:* extrair lógica pura para `lib/` só quando um
    teste a revelar. É uma refatoração sem mudança de comportamento, registrada no Registro.
  - *Codecov sem token:* `CODECOV_TOKEN` é segredo do repo, criado pelo usuário (T2).
  - *Nome em inglês e conteúdo em pt-BR:* sem impacto técnico.
  - *Avatares externos:* o app carrega avatares de `pbs.twimg.com`, que podem falhar e caem para
    as iniciais. No e2e (T8), bloquear essas requisições com `page.route` deixa o teste
    determinístico e cumpre o princípio de não depender de rede externa.
- **O que não pode mudar:**
  - o comportamento visível do app, salvo correção de bug com teste de regressão;
  - o `data/export/`, que é sempre cópia fiel do TCC;
  - o `tcc-ufmg`, que não é alterado;
  - o histórico, que não é reescrito depois do primeiro push, não tem commits fabricados nem
    datas alteradas;
  - nenhum teste acessa a rede externa.

## 8. Plano de implementação

| # | Tarefa | Depende de | Arquivos | Fronteira de teste | Pronto quando | Oráculo de verificação |
|---|---|---|---|---|---|---|
| T0 | Repo e snapshot: `filter-repo` (D2, P1), ajuste do `publicDir`, `package.json`, `.nvmrc`, `.gitattributes`, README inicial declarando a origem, cópia deste spec para `docs/`. Criação do repo no GitHub e push depois do ok do usuário | — | raiz, `vite.config.ts`, `package.json`, `README.md`, `docs/` | os 58 unitários atuais | `git log` mostra os 5 commits herdados mais os novos; `npm ci && npm run build && npm test` passam na raiz | `npm run dev` abre `/`, com os 4 eventos e as imagens dos grafos carregando (prova que o `publicDir` está certo) |
| T1 | Fundação de testes: dependências da Testing Library e do jsdom, `src/test/setup.ts`, `src/test/fixtures.ts`, helper de render, `vitest` com jsdom e `include` de `.tsx`, script `test:coverage` com v8 e reporter lcov e texto, **ainda sem limites** | T0 | `package.json`, `vite.config.ts`, `src/test/*` | um teste-piloto (`States`) | `npm run test:coverage` gera `coverage/lcov.info` e o piloto passa | o relatório de texto lista `src/components/States.tsx` acima de 0% |
| T2 | CI e Codecov: job `unit` na matriz de 3 sistemas, upload do Codecov no Ubuntu, `codecov.yml`. O usuário cria a conta no Codecov e o segredo `CODECOV_TOKEN` | T1 | `.github/workflows/ci.yml`, `codecov.yml` | — | o run no Actions fica verde nos 3 sistemas e o Codecov mostra o relatório | link do run e página do repo no Codecov |
| T3 | Deploy: o usuário conecta o repo na Vercel (P7) depois do ok do orientador sobre os dados | T0 | `vercel.json` (só se precisar de ajuste) | — | a URL pública abre a home e as rotas profundas | abrir `/eleicoes` e `/eleicoes/<c>` direto na URL, sem 404, e alternar o tema |
| T4 | Unitários de `lib` (lacunas) e `data` (§6.2) | T1 | `src/lib/*.test.ts`, `src/data/*.test.ts(x)` | unitário | `lib` e `data` ≥ 90% de linhas | relatório de texto do `test:coverage` |
| T5 | Unitários dos componentes de tweet (§6.2) | T1 | `src/components/{TweetText,CitedText,Avatar,MediaGrid,ThreadTweet,TweetThread,Timeline,States}.test.tsx` | unitário | esses arquivos ≥ 80% de linhas | relatório de texto do `test:coverage` |
| T6 | Unitários do grafo e dos grupos (§6.2) | T1 | `src/components/{GraphStage,EventGraph,GroupPanel,Comparison,OverlapDemo}.test.tsx` | unitário | esses arquivos ≥ 80% de linhas | relatório de texto do `test:coverage` |
| T7 | Unitários de `App` e das páginas (§6.2) | T1 | `src/App.test.tsx`, `src/pages/*.test.tsx`, `src/content/events.test.ts` | unitário | esses arquivos ≥ 80% de linhas | relatório de texto do `test:coverage` |
| T8 | E2E: Playwright, configuração, script `test:e2e` e os 5 fluxos (§6.3) | T0 | `package.json`, `playwright.config.ts`, `e2e/*.spec.ts` | e2e | `npm run test:e2e` passa localmente, 5 de 5 | relatório HTML do Playwright com os 5 fluxos verdes |
| T9 | E2E no CI: job `e2e` na matriz de 3 sistemas, artefato do relatório em caso de falha | T2, T8 | `.github/workflows/ci.yml` | e2e | o job `e2e` fica verde nos 3 sistemas | link do run |
| T10 | Gate de cobertura: limites de 80% (P3) no Vitest e alvo de 80% no Codecov | T2, T4, T5, T6, T7 | `vite.config.ts`, `codecov.yml` | — | o CI falha abaixo de 80% e passa com o código atual | badge do Codecov ≥ 80% |
| T11 | README final com as 5 seções do TP (Integrantes, Sobre o sistema, Tecnologias, Uso de IA, Execução dos testes) e os badges de CI e Codecov | T3, T9, T10 | `README.md` | — | as 5 seções preenchidas, sem placeholder, e os badges funcionando | leitura do README renderizado no GitHub |
| T12 | Vídeo (≤ 5 min: sistema, tecnologias, uso de IA, testes) e submissão dos 5 links no Moodle | T11 | — | — | os 5 links funcionando | abrir cada link numa janela anônima |

### Ondas e paralelismo

- **Onda 0, fundação (sequencial):** T0 e depois T1. Todos os testes dependem do setup e das
  fixtures da T1.
- **Onda 1 (paralela):**
  - T2, T4, T5, T6 e T7 dependem da T1;
  - T3 e T8 dependem só da T0, mas entram junto.

  Arquivos são disjuntos. A T1 já mexeu em `vite.config.ts` e no `package.json`, e na Onda 1 só
  a T8 toca o `package.json`.
- **Onda 2:**
  - T9 depende de T2 e T8 (as duas tocam `ci.yml`, por isso a T9 vem depois da T2);
  - T10 depende de T2 e de T4 a T7.
- **Onda 3:** T11, depois T12 (usuário).
- **Caminho crítico:** T0 → T1 → T5, T6 ou T7 (o mais longo) → T10 → T11 → T12.

## 9. Para o agente executor

- **Comece por:** T0. Antes, confirme que o `git filter-repo` está instalado (`pipx install
  git-filter-repo` ou `apt install git-filter-repo`) e peça o ok do usuário antes de criar o repo
  no GitHub.
- **Leia antes:**
  - este spec inteiro, com o Registro;
  - `teste-softwares/README.md` (o enunciado);
  - os testes que já existem em `src/lib/*.test.ts`, que são a referência de estilo e de nomes.
- **Não toque:**
  - o `tcc-ufmg`;
  - o `data/export/`;
  - o comportamento do app (salvo bug com teste de regressão anotado no Registro);
  - o histórico depois do primeiro push.
- **Gates:**
  - o commit é do usuário. Numa execução longa, o agente dono commita por tarefa aceita, sempre
    com a data real;
  - rodar os testes um arquivo por vez enquanto escreve e o `test:coverage` completo ao fechar a
    tarefa;
  - rodar `npm run build` (typecheck) ao fechar;
  - toda decisão nova é confirmada com o usuário, editada aqui e anotada em "Mudança no spec".
- **Ações do usuário (bloqueiam tarefas específicas):**
  - criar o repo no GitHub ou autorizar o agente a criar (T0);
  - criar a conta no Codecov e o segredo `CODECOV_TOKEN` (T2);
  - pedir o ok do orientador sobre os dados e conectar a Vercel (T3);
  - informar os integrantes (T11);
  - gravar o vídeo (T12).
- **Iteração:** perguntas ao usuário em lote, numeradas, com a recomendação em cada uma.

## Notas de implementação

## Execução

### Execução de 2026-11-26

#### Registro de decisões

Repo: `bolhas-no-twitter`, branch `main`.

Escopo desta execução, na ordem:
1. Base de testes de componente (Testing Library, jsdom, fixtures e o script de cobertura).
2. Em paralelo:
   - o CI nos três sistemas com Codecov;
   - os testes de `lib` e `data`;
   - os testes dos componentes de tweet;
   - os testes do grafo e dos grupos;
   - os testes de `App` e das páginas;
   - os 5 fluxos e2e em Playwright.
3. O e2e no CI e o gate de 80% de cobertura.
4. O README final com as 5 seções do TP.

Tudo depende da base de testes. O e2e no CI depende do CI e do Playwright. O gate de 80% depende
do CI e dos quatro blocos de testes de unidade. O README vem por último.

Fora desta execução:
- o deploy na Vercel, que o usuário pediu para não publicar ainda;
- o vídeo e a entrega no Moodle, que são do usuário.

| Decisão | Por quê | Quem decidiu | Tipo | Se mudar, afeta | Commit |
|---|---|---|---|---|---|
| Implementadores e revisores rodam em Sonnet | pedido do usuário para acelerar e preservar contexto | você | detalhe | nenhuma tarefa | — |
| Commits pequenos direto na `main`, com push contínuo, sem PR por tarefa | o usuário liberou os pushes contínuos e revisa só no final. Tarefas paralelas dividem a mesma working tree, o que inviabiliza uma branch por tarefa | você | pilar | o histórico do repo | — |
| Um commit por arquivo de teste ou por passo de configuração, com a data real | o TP avalia commits pequenos e descritivos. Cada commit corresponde a trabalho de verdade | o dono | detalhe | nenhuma tarefa | — |
| Os três commits de ajuste do snapshot saíram sem o trailer `Co-Authored-By`, e os seguintes saem com ele | o histórico não é reescrito depois do push | o dono | detalhe | nada | 5fdb786..ac39f58 |
| O deploy na Vercel fica fora, e o README final sai sem o link de produção | pedido do usuário: não publicar ainda | você | pilar | o README final | — |
| O README lista um integrante: Vinicius Pinho Galvao | informado pelo usuário | você | detalhe | o README final | — |
| A base de testes cria um `localStorage` em memória quando o do ambiente não tem `clear` | no Node 25 local, o `localStorage` global quebrado esconde o do jsdom. No Node 24, que é o do CI, o do jsdom é usado direto | o dono | detalhe | só o setup dos testes | 7c21915 |
| `@testing-library/jest-dom` fica fixado na versão 7 | a versão 8 exige Vitest 5 | o dono | detalhe | só as dependências de teste | 7c21915 |
| Os cinco blocos da onda 1 (os quatro de testes de unidade e o e2e) rodam ao mesmo tempo, acima do teto de três da skill | o usuário pediu para acelerar. Os arquivos são disjuntos e cada bloco mede a cobertura num diretório próprio | o dono | detalhe | nenhuma tarefa | — |
| O servidor do e2e usa `vite build` e `vite preview`, sem o `tsc -b` | o e2e não deve falhar por erro de tipo em teste de unidade. O typecheck já roda no job de unidade | o dono | detalhe | o e2e | — |
| O commit do CI espera localmente até o token do `gh` ganhar o escopo `workflow` | o GitHub recusa o push de `.github/workflows` sem esse escopo. Os outros commits seguem sendo enviados | você (escopo liberado) | pilar | o CI, o Codecov e o gate de cobertura | 2c3bd30 |
| O stub de `fetch` que responde JSON por URL foi centralizado em `src/test/fetch.ts` | estava duplicado em 4 arquivos de teste das páginas | o dono | detalhe | só os testes | — |
| Os testes que esbarram no cache dos loaders isolam o cache com `vi.resetModules` e import dinâmico, sem mudar código de produção | a revisão apontou dependência de ordem e slugs únicos como contorno frágil | o dono | detalhe | só os testes | — |
| O gate de cobertura vale para linhas, statements e funções a 80%, com CSS fora do cálculo. O Codecov cobra 80% do projeto, com 1% de tolerância | como planejado. O CSS aparecia com 0% sem ser código | o dono | detalhe | o CI | — |
| O README diz "Claude Opus 5.5" para o agente principal e "Claude Sonnet 5.5" para os subagentes | são os modelos que de fato rodaram nesta execução | o dono | detalhe | a seção de uso de IA | — |

#### Plano de review

Resumo: ficaram prontos a base de testes, os quatro blocos de testes de unidade (326 testes, 99,8%
das linhas), os 5 fluxos e2e no Playwright, o gate de 80% de cobertura e o README com as 5 seções
pedidas. O CI com Codecov está escrito e commitado localmente, mas não subiu: o token do `gh` não
tem permissão para publicar workflows. O deploy ficou fora, como você pediu.

**Precisa da sua decisão**

1. Liberar a publicação do CI.
   O GitHub recusa `.github/workflows/ci.yml` sem o escopo `workflow` no token. Rode
   `gh auth refresh -h github.com -s workflow` e eu faço o push.
   Até lá, não há run no Actions nem relatório no Codecov, e esses são dois dos cinco links da
   entrega.
2. Conferir o texto de uso de IA no README.
   Ele descreve o que aconteceu nesta sessão: análise dos repos, plano, testes escritos por
   subagentes e revisão que achou asserções fracas. Ajuste o tom ou acrescente o que você usou fora
   daqui.

**Onde olhar**

Testes dos hooks de carregamento
- `src/data/hooks.test.tsx`, no teste que descarta a resposta antiga: é o teste mais sutil. Foi
  validado removendo a guarda do código e vendo o teste falhar.

Página do evento
- `src/pages/EventPage.test.tsx`: cobre redirecionamento, bolha inválida e `?comparar=`. Se algo
  desse comportamento mudar no TCC, é aqui que quebra.

e2e
- `e2e/rotas-invalidas-e-tags.spec.ts`: o fluxo com mais passos. Prova o rótulo visível antes de
  provar que `?tags=0` o esconde.
- Verificado: `npm run test:e2e` passa 8 de 8 localmente. Ainda não rodou em macOS nem Windows,
  porque depende do CI.

**Pode pular**

Os builders de `src/test/fixtures.ts`, o setup, os testes de constantes (glossário, contexto dos
eventos) e as mudanças de `package.json`.

Para consulta: os checkpoints estão no Registro. São 55 commits na `main` remota mais o do CI, que
está local.

## Registro

**Mudança no spec** · 2026-11-26 · T0, cabeçalho, §7

- **O quê:**
  - A fonte única do spec passa a ser `docs/` do repo `bolhas-no-twitter`.
  - Na T0, só os 5 commits herdados foram enviados ao GitHub. Os ajustes do primeiro commit novo
    ficaram na working tree, para revisão e commit do usuário.
  - Entra em §7 o risco dos avatares externos, com a mitigação a aplicar na T8.
- **Por quê:** o spec diz que o commit é do usuário. A criação do repo e o push do histórico
  herdado foram autorizados por ele ("pode ser público e pode seguir"). Os avatares de
  `pbs.twimg.com` foram vistos no README original durante a T0.
- **Seções editadas:** cabeçalho, §7.
- **Impacto na implementação:** T8 bloqueia `pbs.twimg.com` nos testes e2e.

**Checkpoint de implementação** · 2026-11-26 · T0

- **Feito:**
  - Repo público https://github.com/Vipigal/bolhas-no-twitter, criado com
    `git filter-repo --path web/ --path data/export/ --path-rename web/:`. São 5 commits
    herdados (ba37926 a 0b286a5), sem arquivo inesperado nem segredo no histórico.
  - Na working tree, sem commit:
    - `publicDir: "data/export"`;
    - `name` passa para `bolhas-no-twitter` no `package.json` e no lockfile;
    - `.nvmrc` com 24;
    - `.gitattributes` com LF e `*.webp` como binário;
    - README inicial declarando a origem;
    - `docs/` com este spec.
  - Validação:
    - `npm ci`, `npm run build` (ok) e `npm test` (58/58) passam;
    - o `vite preview` serve `/index.json`, `/eleicoes/tweets.json` e `.webp` com status 200;
    - no desktop, a home e `/eleicoes` aparecem com o grafo e os rótulos dos grupos.
- **Divergiu do spec:** veja a "Mudança no spec" acima. A captura em viewport mobile travou no
  DevTools MCP e não foi feita. A T0 não altera nenhum componente visual.
- **Próximo:** o usuário revisa e commita os ajustes. Depois vem a T1 (fundação de testes).

**Checkpoint de implementação** · 2026-11-26 · T1

- **Feito:**
  - Base de testes:
    - jsdom, Testing Library e cobertura v8;
    - `src/test/setup.ts`, `src/test/fixtures.ts` e `src/test/render.tsx`;
    - piloto com 4 testes para os estados de erro e carregamento.
  - Evidência: `npm run test:coverage` gera `coverage/lcov.info`, com 62 testes passando. O build passa.
- **Divergiu do spec:** nada. As decisões técnicas estão no registro de decisões da execução.
- **Próximo:** os blocos da onda 1.

**Checkpoint de implementação** · 2026-11-26 · T4, T5, T6, T8

- **Feito:**

  | Bloco | Testes novos | Cobertura de linhas |
  |---|---|---|
  | `lib` e `data` | 57 | 100% em cada um |
  | Componentes de tweet (7 arquivos) | 73 | 100% em cada um |
  | Grafo e grupos (5 arquivos) | 50 | 100% em cada um |
  | e2e em Playwright | 7 testes em 5 arquivos de fluxo | — |

  No e2e, os avatares externos ficam bloqueados por uma fixture compartilhada.
- **Evidência:**
  - o gate do dono roda 188 testes de unidade, todos passando;
  - `tsc -b` não mostra erro nos arquivos dessas tarefas;
  - `npm run test:e2e` passa 7 de 7, em 4,6 s.
- **Bugs encontrados:** nenhum. Nenhum código de produção foi alterado.
- **Divergiu do spec:** o fluxo de rotas inválidas virou 3 testes num mesmo arquivo. Os 5 arquivos
  de fluxo se mantêm.
- **Próximo:** os testes de App e páginas, a revisão de qualidade dos testes e o CI (que espera o
  escopo `workflow`).

**Checkpoint de implementação** · 2026-11-26 · T7 e a rodada de revisão

- **Feito:**
  - Testes de App e das páginas: 73 testes, 100% das linhas (EventPage com 97,4%).
  - Helper de fetch em `src/test/fetch.ts`.
  - A revisão de qualidade achou 4 problemas bloqueantes, todos corrigidos pelos autores das tarefas:
    - a asserção vazia do TweetText;
    - a contagem de chamadas no TweetThread;
    - a dependência de ordem nos hooks;
    - o descarte de resposta antiga não provado.

    Também foram aplicados 5 ajustes opcionais: builders em compare e thread, um caso por teste
    no tema e em entities, glossário, OverlapDemo sem laço e o e2e com prova positiva.
- **Evidência:**
  - `npm run test:coverage` passa 326 testes, com 99,8% das linhas e 94,9% dos branches;
  - o build passa;
  - o e2e passa 8 de 8.
- **Divergiu do spec:** nada.
- **Próximo:** o e2e no CI, o gate de cobertura e o README.

**Checkpoint de implementação** · 2026-11-26 · T9, T10, T11

- **Feito:**
  - Gate de 80% (linhas, statements e funções) no Vitest. O Codecov cobra 80% do projeto.
  - Job `e2e` na matriz dos três sistemas.
  - README com as 5 seções e os badges.
- **Evidência:**
  - o `test:coverage` passa com limite de 80% e falha com limite de 100% ("Coverage for lines
    (99.8%) does not meet global threshold (100%)");
  - o build passa.
- **Divergiu do spec:** o CI e o `codecov.yml` estão commitados localmente, sem push, até o token
  ganhar o escopo `workflow`. O critério "run verde nos 3 sistemas" segue pendente por isso. O
  README sai sem o link de produção, como o usuário pediu.
- **Próximo:** o usuário libera o escopo `workflow`. O dono faz o push, acompanha o primeiro run e
  corrige o que falhar no macOS ou no Windows.

**Checkpoint de implementação** · 2026-11-27 · T2 e T9 (CI no ar)

- **Feito:**
  - CI publicado depois que o usuário liberou o escopo `workflow`.
  - Primeiro run: https://github.com/Vipigal/bolhas-no-twitter/actions/runs/45914320052. Os seis
    jobs passaram (`unit` e `e2e` em Ubuntu, macOS e Windows).
  - Relatório no Codecov: https://app.codecov.io/gh/Vipigal/bolhas-no-twitter, com 97,3% (578 de
    594 linhas, 36 arquivos). O Codecov conta como parcial a linha com branch descoberto, por isso o
    número é menor que os 99,8% do Vitest.
- **Divergiu do spec:** nada.
- **Problema e correção:** o envio ao Codecov falhou três vezes com "Repository not found". Primeiro
  faltava dar ao app do Codecov acesso ao repo novo. Depois, o `CODECOV_TOKEN` era o token de outro
  repo. O usuário corrigiu os dois, e a quarta tentativa enviou o relatório.
- **Próximo:** o deploy na Vercel (quando o usuário liberar) e o vídeo.
