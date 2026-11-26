import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router-dom";
import {
  buildAuthor,
  buildCluster,
  buildEvent,
  buildGroupLabel,
  buildGroupMap,
  buildIndex,
  buildSlot,
  buildTweet,
} from "../test/fixtures";
import { stubFetchJson } from "../test/fetch";

const SLUG = "invasao-3-poderes";

const summary = {
  sintese: "Veja [333].",
  contas_prevalentes: "Contas.",
  inclinacao_politica: { texto: "Texto da inclinação.", confianca: "alta" as const },
  limites: "Limites do grupo.",
  model: "m",
  prompt_version: "v1",
  generated_at: "2026-01-01T00:00:00Z",
  invalid_ids: [],
};

const index = buildIndex({
  events: [
    buildEvent({ slug: "eleicoes", name: "Eleições", event_date: "2022-10-30" }),
    buildEvent({
      slug: SLUG,
      name: "8 de janeiro",
      event_date: "2023-01-08",
      n_nodes: 4321,
      clusters: [
        buildCluster({
          community: 1,
          group: 1,
          label: "Grupo A",
          summary,
          curation: { trecho: [], eixo: "direita", stale: false },
        }),
        buildCluster({ community: 2, group: 2, label: "Grupo B" }),
        buildCluster({ community: 3, group: 3, label: "Grupo C" }),
      ],
    }),
  ],
});

const groupMap = buildGroupMap({
  groups: [buildGroupLabel({ community: 1 }), buildGroupLabel({ community: 2, group: 2 })],
});

const slots = [
  buildSlot({ community: 1, tweet_id: "t1", tweet: buildTweet({ id: "t1", text: "tweet do A" }), author: buildAuthor() }),
  buildSlot({
    community: 1,
    tweet_id: "333",
    origin: "characteristic",
    tweet: buildTweet({ id: "333", text: "tweet característico do A" }),
    author: buildAuthor(),
  }),
  buildSlot({ community: 2, tweet_id: "t2", tweet: buildTweet({ id: "t2", text: "tweet do B" }), author: buildAuthor() }),
];

function Where() {
  const { pathname, search } = useLocation();
  return <p data-testid="local">{pathname + search}</p>;
}

async function renderEvent(route: string) {
  vi.resetModules();
  const { EventPage } = await import("./EventPage");
  const { renderWithProviders } = await import("../test/render");
  return renderWithProviders(
    <>
      <Where />
      <Routes>
        <Route path="/" element={<p>home</p>} />
        <Route path="/:evento" element={<EventPage />} />
        <Route path="/:evento/:community" element={<EventPage />} />
      </Routes>
    </>,
    { route },
  );
}

beforeEach(() => {
  stubFetchJson({ "/index.json": index, [`/${SLUG}/tweets.json`]: slots, [`/${SLUG}/grafo.json`]: groupMap });
});

describe("EventPage", () => {
  it("redireciona para a home quando o slug não existe no index", async () => {
    await renderEvent("/nao-existe");
    expect(await screen.findByText("home")).toBeInTheDocument();
    expect(screen.getByTestId("local")).toHaveTextContent(/^\/$/);
  });
  it("preserva ?tags=0 ao redirecionar para a home", async () => {
    await renderEvent("/nao-existe?tags=0");
    await screen.findByText("home");
    expect(screen.getByTestId("local")).toHaveTextContent("/?tags=0");
  });
  it("mostra a data do evento como título", async () => {
    await renderEvent(`/${SLUG}`);
    expect(await screen.findByRole("heading", { level: 1, name: "8 de janeiro de 2023" })).toBeInTheDocument();
  });
  it("conta as pessoas e cita o assunto do evento", async () => {
    await renderEvent(`/${SLUG}`);
    expect(await screen.findByText(/4\.321 pessoas retuitaram sobre/)).toBeInTheDocument();
  });
  it("liga o link Os quatro eventos à home", async () => {
    await renderEvent(`/${SLUG}`);
    expect(await screen.findByRole("link", { name: "Os quatro eventos" })).toHaveAttribute("href", "/");
  });
  it("lista as fontes do contexto do evento", async () => {
    await renderEvent(`/${SLUG}`);
    const source = await screen.findByRole("link", { name: "Bastos e Recuero (2023)" });
    expect(source).toHaveAttribute("href", "https://doi.org/10.1177/20563051231211881");
  });
  it("mostra o esqueleto enquanto os tweets carregam", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url === "/index.json"
          ? Promise.resolve(new Response(JSON.stringify(index), { headers: { "content-type": "application/json" } }))
          : new Promise<Response>(() => {}),
      ),
    );
    const { container } = await renderEvent(`/${SLUG}`);
    await screen.findByRole("heading", { level: 1 });
    expect(container.querySelector(".h-\\[420px\\]")).toBeInTheDocument();
  });
  it("mostra o erro quando os tweets do evento não existem", async () => {
    stubFetchJson({ "/index.json": index });
    await renderEvent(`/${SLUG}`);
    expect(await screen.findByRole("alert")).toHaveTextContent(`${SLUG}/tweets.json`);
  });
  it("abre a primeira bolha quando a URL não traz community", async () => {
    await renderEvent(`/${SLUG}`);
    expect(await screen.findByRole("heading", { level: 2, name: "Grupo A" })).toBeInTheDocument();
  });
  it("abre a bolha pedida na URL", async () => {
    await renderEvent(`/${SLUG}/2`);
    expect(await screen.findByRole("heading", { level: 2, name: "Grupo B" })).toBeInTheDocument();
  });
  it("abre a primeira bolha quando a community da URL não existe", async () => {
    await renderEvent(`/${SLUG}/99`);
    expect(await screen.findByRole("heading", { level: 2, name: "Grupo A" })).toBeInTheDocument();
  });
  it("mostra os tweets da bolha aberta", async () => {
    await renderEvent(`/${SLUG}/2`);
    expect(await screen.findByText("tweet do B")).toBeInTheDocument();
    expect(screen.queryByText("tweet do A")).not.toBeInTheDocument();
  });
  it("põe ?comparar na URL ao escolher uma bolha para comparar", async () => {
    const { user } = await renderEvent(`/${SLUG}`);
    await user.click(await screen.findByRole("button", { name: "Grupo B" }));
    expect(screen.getByTestId("local")).toHaveTextContent(`/${SLUG}/1?comparar=2`);
  });
  it("abre a bolha clicada no grafo", async () => {
    const { user } = await renderEvent(`/${SLUG}`);
    await user.click(await screen.findByRole("button", { name: /^Grupo B · / }));
    expect(screen.getByTestId("local")).toHaveTextContent(`/${SLUG}/2`);
  });
  it("preserva ?tags=0 ao abrir uma bolha pelo grafo", async () => {
    const { user } = await renderEvent(`/${SLUG}?tags=0`);
    await user.click(await screen.findByRole("button", { name: /^Grupo B · / }));
    expect(screen.getByTestId("local")).toHaveTextContent(`/${SLUG}/2?tags=0`);
  });
  it("mostra os característicos ao clicar numa citação deles na síntese", async () => {
    const { user } = await renderEvent(`/${SLUG}`);
    await user.click(await screen.findByRole("link", { name: "C1" }));
    expect(screen.getByRole("tab", { name: "Característicos" })).toHaveAttribute("aria-selected", "true");
  });
  it("não mostra a comparação sem ?comparar", async () => {
    await renderEvent(`/${SLUG}`);
    await screen.findByRole("heading", { level: 2, name: "Grupo A" });
    expect(screen.queryByRole("heading", { level: 4, name: "Nas duas" })).not.toBeInTheDocument();
  });
  it("mostra a comparação com a bolha de ?comparar", async () => {
    await renderEvent(`/${SLUG}?comparar=2`);
    expect(await screen.findByRole("heading", { level: 3, name: /^Grupo A e Grupo B/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grupo B" })).toHaveAttribute("aria-pressed", "true");
  });
  it("ignora ?comparar quando aponta para a própria bolha aberta", async () => {
    await renderEvent(`/${SLUG}/1?comparar=1`);
    await screen.findByRole("heading", { level: 2, name: "Grupo A" });
    expect(screen.queryByRole("heading", { level: 4, name: "Nas duas" })).not.toBeInTheDocument();
  });
  it("ignora ?comparar quando a bolha não existe", async () => {
    await renderEvent(`/${SLUG}?comparar=99`);
    await screen.findByRole("heading", { level: 2, name: "Grupo A" });
    expect(screen.queryByRole("heading", { level: 4, name: "Nas duas" })).not.toBeInTheDocument();
  });
  it("tira a comparação ao clicar de novo na bolha comparada", async () => {
    const { user } = await renderEvent(`/${SLUG}?comparar=2`);
    await user.click(await screen.findByRole("button", { name: "Grupo B" }));
    expect(screen.getByTestId("local")).toHaveTextContent(new RegExp(`^/${SLUG}/1$`));
  });
  it("mostra a inclinação da bolha por padrão", async () => {
    await renderEvent(`/${SLUG}`);
    expect(await screen.findByText('Por que "Direita"')).toBeInTheDocument();
  });
  it("oculta a inclinação da bolha com ?tags=0", async () => {
    await renderEvent(`/${SLUG}?tags=0`);
    await screen.findByRole("heading", { level: 2, name: "Grupo A" });
    expect(screen.queryByText('Por que "Direita"')).not.toBeInTheDocument();
  });
  it("preserva ?tags=0 ao escolher uma bolha para comparar", async () => {
    const { user } = await renderEvent(`/${SLUG}?tags=0`);
    await user.click(await screen.findByRole("button", { name: "Grupo C" }));
    expect(screen.getByTestId("local")).toHaveTextContent(`/${SLUG}/1?tags=0&comparar=3`);
  });
  it("avisa quando o evento não tem bolhas selecionadas", async () => {
    stubFetchJson({
      "/index.json": buildIndex({ events: [buildEvent({ slug: SLUG, clusters: [] })] }),
      [`/${SLUG}/tweets.json`]: [],
    });
    await renderEvent(`/${SLUG}`);
    expect(await screen.findByText("Este evento não tem bolhas selecionadas.")).toBeInTheDocument();
  });
  it("usa o nome do evento como título quando ele não tem data", async () => {
    stubFetchJson({
      "/index.json": buildIndex({ events: [buildEvent({ slug: SLUG, name: "Evento sem data", event_date: null })] }),
      [`/${SLUG}/tweets.json`]: slots,
    });
    await renderEvent(`/${SLUG}`);
    expect(await screen.findByRole("heading", { level: 1, name: "Evento sem data" })).toBeInTheDocument();
  });
});
