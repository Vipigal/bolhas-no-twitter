# Bolhas no Twitter

[![ci](https://github.com/Vipigal/bolhas-no-twitter/actions/workflows/ci.yml/badge.svg)](https://github.com/Vipigal/bolhas-no-twitter/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/Vipigal/bolhas-no-twitter/graph/badge.svg)](https://codecov.io/gh/Vipigal/bolhas-no-twitter)

## Integrantes

- Vinicius Pinho Galvao

## Sobre o sistema

Leitor das bolhas de retweet no Twitter brasileiro em quatro eventos políticos entre 2022 e 2023:

- a mobilização de 7 de setembro;
- o caso Roberto Jefferson;
- o debate sobre democracia no 2º turno;
- os ataques de 8 de janeiro.

O que o usuário pode fazer:

- escolher um evento na linha do tempo da página inicial;
- ver o grafo de quem retuitou quem, dividido em grupos (bolhas);
- abrir um grupo clicando no rótulo ou na região dele no grafo;
- ler, para o grupo aberto, os tweets mais retuitados, uma síntese com citações clicáveis e quanto
  ele compartilha com os outros grupos;
- comparar dois grupos lado a lado ("Comparar com");
- seguir a explicação animada de como as bolhas se formam;
- alternar entre tema claro e escuro (a escolha fica salva no navegador);
- ocultar a inclinação política com `?tags=0` na URL. O parâmetro se mantém ao navegar.

O app não tem backend: lê JSON estático e imagens dos grafos em `data/export/`, servidos na raiz do
site. Os grupos, as contagens e as sínteses chegam prontos do export. O app só formata e apresenta.

O código-base foi extraído do front-end do meu TCC (repositório `tcc-ufmg`, pastas `web/` e
`data/export/`), com o histórico de commits preservado (os cinco primeiros commits). Daqui em diante,
este repositório é o sistema do trabalho prático de Teste de Software (UFMG). O planejamento está em
[`docs/bolhas-no-twitter.md`](docs/bolhas-no-twitter.md).

| Rota | O que mostra |
|---|---|
| `/` | A linha do tempo com os quatro eventos |
| `/como-funciona` | A animação de como as bolhas se formam |
| `/:evento` | O grafo do evento, com a maior bolha aberta |
| `/:evento/:community` | Uma bolha aberta. Aceita `?comparar=<community>` |

Um slug inválido volta para `/`, e uma community inválida abre a primeira bolha.

## Tecnologias

- **React 19 + TypeScript:** a interface, em componentes funcionais com hooks, com TypeScript em modo estrito.
- **React Router 7:** as rotas por evento e por bolha, e os parâmetros de query (`comparar`, `tags`).
- **Vite 8:** o servidor de desenvolvimento e o build. O `publicDir` aponta para `data/export/`.
- **Tailwind CSS 4:** os estilos, com os temas claro e escuro em variáveis CSS.
- **Vitest 4 + Testing Library + jsdom:** os testes de unidade de funções, hooks, componentes e
  páginas, que consultam a tela por papel, texto e rótulo acessível, como o usuário a vê.
- **Cobertura v8 (`@vitest/coverage-v8`):** mede a cobertura, gera o relatório `lcov` e barra o
  build abaixo de 80%.
- **Playwright:** os testes end-to-end no Chromium, contra o build de produção servido pelo `vite preview`.
- **GitHub Actions:** a cada push e pull request, roda build, testes de unidade com cobertura e e2e
  em Linux, macOS e Windows.
- **Codecov:** recebe o relatório de cobertura enviado pelo GitHub Actions e o publica.

## Uso de IA

Usei o **Claude Code** (Anthropic) em todas as etapas do TP:

- **Escolha do sistema e planejamento.** O agente principal (**Claude Opus 5.5**) listou e
  analisou meus repositórios no GitHub para achar o candidato que melhor atendia ao enunciado.
  Comparou o front do TCC com outras opções e mediu a cobertura de partida (32,5% das linhas).
  Depois escreveu comigo o plano do trabalho em [`docs/bolhas-no-twitter.md`](docs/bolhas-no-twitter.md).
  As decisões foram minhas: o sistema, o nome do repositório, manter o histórico do TCC, não
  adicionar features e não publicar o deploy ainda.
- **Extração do repositório.** O agente principal extraiu o front do TCC com `git filter-repo`,
  preservando o histórico, e configurou o CI, o Codecov e o limite de cobertura.
- **Escrita dos testes.** Subagentes do Claude Code (**Claude Sonnet 5.5**) escreveram em paralelo
  os testes de unidade e os e2e, cada um responsável por uma parte do código (funções e dados,
  componentes de tweet, grafo e grupos, páginas, e2e). O agente principal rodava os testes, a
  cobertura e o typecheck antes de aceitar cada entrega.
- **Revisão de qualidade dos testes.** Outro subagente revisou os testes com os critérios do enunciado
  e achou problemas reais, que foram corrigidos:
  - uma asserção que sempre passava (`toHaveTextContent("")`);
  - um teste de hook que dependia da ordem de execução por causa de cache;
  - um teste que não provava o descarte de respostas antigas. Ele foi validado removendo a
    proteção do código e vendo o teste falhar;
  - um e2e que verificava a ausência de um texto sem antes provar que ele aparecia.
- **Rastro no histórico.** Os commits feitos com a ajuda do Claude Code trazem a linha `Co-Authored-By: Claude`.

## Execução dos testes

Requer Node 24 (veja `.nvmrc`).

```bash
npm ci

npm test                  # testes de unidade (Vitest)
npm run test:coverage     # testes de unidade + cobertura (texto no terminal, lcov em coverage/)

npx playwright install chromium   # uma vez, para baixar o navegador
npm run test:e2e                  # testes end-to-end (Playwright); relatório em playwright-report/

npm run build             # typecheck + build de produção em dist/
npm run dev               # app em http://localhost:5173
```

O que existe hoje:

- **326 testes de unidade** em 34 arquivos, sendo 58 herdados do TCC. Cada arquivo testa um módulo
  pela API pública: o que a função retorna ou o que o componente mostra e faz quando o usuário
  interage.
- **5 fluxos e2e** em `e2e/`, num total de 8 testes:
  - abrir um evento pela home;
  - trocar de grupo pelo grafo;
  - comparar dois grupos;
  - manter o tema escolhido depois de recarregar;
  - tratar rotas inválidas e `?tags=0`.

  Os avatares externos (`pbs.twimg.com`) são bloqueados nos testes, para eles não dependerem de rede.
- **Cobertura:** acima de 99% das linhas. Cair abaixo de 80% de linhas, statements ou funções faz o
  comando falhar.

No CI (`.github/workflows/ci.yml`), cada push roda os jobs `unit` e `e2e` em Ubuntu, macOS e Windows.
O relatório de cobertura do Ubuntu vai para o [Codecov](https://codecov.io/gh/Vipigal/bolhas-no-twitter).

## Estrutura

- `src/data/`: fetch dos JSON com cache em memória e os hooks de carregamento.
- `src/content/events.ts`: o contexto factual de cada evento.
- `src/lib/`: funções puras (formatação, citações, thread, comparação, paleta, rotas, tema).
- `src/components/`: o grafo, a bolha aberta, a comparação, os tweets, a animação e a linha do tempo.
- `src/pages/`: `Home`, `HowItWorks` e `EventPage`.
- `src/test/`: o setup dos testes, os builders de dados de teste e os helpers de render e de fetch.
- `e2e/`: os fluxos do Playwright.
