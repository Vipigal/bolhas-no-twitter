import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { buildCluster, buildEvent, buildIndex } from "../test/fixtures";
import { stubFetchJson } from "../test/fetch";

const index = buildIndex({
  events: [
    buildEvent({ slug: "mobilizacao-0709", name: "7 de setembro", event_date: "2022-09-07", n_nodes: 1000 }),
    buildEvent({ slug: "roberto-jefferson", name: "Jefferson", event_date: "2022-10-23", n_nodes: 2000 }),
    buildEvent({ slug: "eleicoes", name: "Eleições", event_date: "2022-10-30", n_nodes: 3000 }),
    buildEvent({
      slug: "invasao-3-poderes",
      name: "8 de janeiro",
      event_date: "2023-01-08",
      n_nodes: 4000,
      clusters: [buildCluster(), buildCluster({ community: 2, group: 2 })],
    }),
  ],
});

async function renderHome(route = "/") {
  vi.resetModules();
  const { Home } = await import("./Home");
  const { renderWithProviders } = await import("../test/render");
  return renderWithProviders(<Home />, { route });
}

beforeEach(() => {
  stubFetchJson({ "/index.json": index });
});

describe("Home", () => {
  it("mostra o título da pesquisa", async () => {
    await renderHome();
    expect(await screen.findByRole("heading", { level: 1, name: "Um mesmo fato, duas realidades" })).toBeInTheDocument();
  });
  it("lista os quatro eventos do index com a data curta", async () => {
    await renderHome();
    await screen.findByRole("heading", { level: 1 });
    for (const dateShort of ["7 set 2022", "23 out 2022", "30 out 2022", "8 jan 2023"])
      expect(screen.getByRole("button", { name: new RegExp(dateShort) })).toBeInTheDocument();
  });
  it("mostra pessoas e bolhas de cada evento", async () => {
    await renderHome();
    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("button", { name: /4\.000 pessoas, 2 bolhas/ })).toBeInTheDocument();
  });
  it("seleciona o último evento ao abrir", async () => {
    await renderHome();
    expect(await screen.findByRole("button", { name: /8 jan 2023/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /7 set 2022/ })).toHaveAttribute("aria-pressed", "false");
  });
  it("mostra a história do evento selecionado", async () => {
    await renderHome();
    expect(await screen.findByRole("heading", { level: 2, name: "Invasão das sedes dos Três Poderes" })).toBeInTheDocument();
  });
  it("troca o evento selecionado ao clicar no cartão", async () => {
    const { user } = await renderHome();
    await user.click(await screen.findByRole("button", { name: /7 set 2022/ }));
    expect(screen.getByRole("button", { name: /7 set 2022/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { level: 2, name: "Bicentenário da Independência" })).toBeInTheDocument();
  });
  it("troca o evento selecionado ao clicar na linha do tempo", async () => {
    const { user } = await renderHome();
    await user.click(await screen.findByRole("button", { name: "Domingo, 23 de outubro de 2022" }));
    expect(screen.getByRole("heading", { level: 2, name: "A prisão de Roberto Jefferson" })).toBeInTheDocument();
  });
  it("liga o botão Ver as bolhas ao evento selecionado", async () => {
    const { user } = await renderHome();
    await user.click(await screen.findByRole("button", { name: /30 out 2022/ }));
    expect(screen.getByRole("link", { name: "Ver as bolhas deste dia" })).toHaveAttribute("href", "/eleicoes");
  });
  it("preserva ?tags=0 no link para o evento", async () => {
    await renderHome("/?tags=0");
    expect(await screen.findByRole("link", { name: "Ver as bolhas deste dia" })).toHaveAttribute("href", "/invasao-3-poderes?tags=0");
  });
  it("usa a miniatura clara ou escura conforme o tema", async () => {
    window.localStorage.setItem("leitor:theme", "light");
    const { container } = await renderHome();
    await screen.findByRole("heading", { level: 1 });
    expect(container.querySelector('img[src="/eleicoes/grafo-claro-mini.webp"]')).toBeInTheDocument();
  });
  it("avisa quando o export não tem eventos", async () => {
    stubFetchJson({ "/index.json": buildIndex({ events: [] }) });
    await renderHome();
    expect(await screen.findByText("Nenhum evento no export.")).toBeInTheDocument();
  });
  it("mostra o erro quando o index não carrega", async () => {
    stubFetchJson({});
    await renderHome();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
