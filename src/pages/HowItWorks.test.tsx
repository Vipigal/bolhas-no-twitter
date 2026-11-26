import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { buildEvent, buildIndex } from "../test/fixtures";
import { stubFetchJson } from "../test/fetch";

const index = buildIndex({
  events: [
    buildEvent({ slug: "eleicoes", n_nodes: 500, n_edges: 1_000_000 }),
    buildEvent({ slug: "invasao-3-poderes", n_nodes: 12345, n_edges: 3_000_000, run_config: { tau: 0.25 } }),
  ],
});

async function renderHow(route = "/como-funciona") {
  vi.resetModules();
  const { HowItWorks } = await import("./HowItWorks");
  const { renderWithProviders } = await import("../test/render");
  return renderWithProviders(<HowItWorks />, { route });
}

beforeEach(() => {
  stubFetchJson({ "/index.json": index });
});

describe("HowItWorks", () => {
  it("começa no primeiro passo", async () => {
    await renderHow();
    expect(await screen.findByRole("tab", { name: "1. Coleções" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { level: 2, name: "Cada pessoa tem uma coleção de retweets" })).toBeInTheDocument();
  });
  it("avança para o passo seguinte no botão Próximo passo", async () => {
    const { user } = await renderHow();
    await user.click(await screen.findByRole("button", { name: "Próximo passo" }));
    expect(screen.getByRole("tab", { name: "2. Sobreposição" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { level: 2, name: "O que as coleções têm em comum vira ligação" })).toBeInTheDocument();
  });
  it("vai direto a um passo ao clicar na aba", async () => {
    const { user } = await renderHow();
    await user.click(await screen.findByRole("tab", { name: "4. Milhares" }));
    expect(screen.getByRole("heading", { level: 2, name: "Com milhares de pessoas, as ligações formam uma rede" })).toBeInTheDocument();
  });
  it("volta a um passo anterior ao clicar na aba", async () => {
    const { user } = await renderHow();
    await user.click(await screen.findByRole("tab", { name: "3. Ligações" }));
    await user.click(screen.getByRole("tab", { name: "1. Coleções" }));
    expect(screen.getByRole("tab", { name: "1. Coleções" })).toHaveAttribute("aria-selected", "true");
  });
  it("mostra o corte tau no segundo passo quando o run_config o traz", async () => {
    const { user } = await renderHow();
    await user.click(await screen.findByRole("tab", { name: "2. Sobreposição" }));
    expect(screen.getByText(/Abaixo de 0,25, a ligação é descartada\./)).toBeInTheDocument();
  });
  it("omite o corte tau quando o run_config não o traz", async () => {
    stubFetchJson({ "/index.json": buildIndex({ events: [buildEvent({ slug: "invasao-3-poderes" })] }) });
    const { user } = await renderHow();
    await user.click(await screen.findByRole("tab", { name: "2. Sobreposição" }));
    expect(screen.queryByText(/a ligação é descartada/)).not.toBeInTheDocument();
  });
  it("usa os números do 8 de janeiro no quarto passo", async () => {
    const { user } = await renderHow();
    await user.click(await screen.findByRole("tab", { name: "4. Milhares" }));
    expect(screen.getByText(/12\.345 pessoas e cerca de 3 milhões de ligações/)).toBeInTheDocument();
  });
  it("usa o último evento quando o 8 de janeiro não está no index", async () => {
    stubFetchJson({ "/index.json": buildIndex({ events: [buildEvent({ slug: "outro", n_nodes: 777, n_edges: 2_000_000 })] }) });
    const { user } = await renderHow();
    await user.click(await screen.findByRole("tab", { name: "4. Milhares" }));
    expect(screen.getByText(/777 pessoas e cerca de 2 milhões de ligações/)).toBeInTheDocument();
  });
  it("troca o botão Próximo passo pelo link das bolhas no último passo", async () => {
    const { user } = await renderHow();
    await user.click(await screen.findByRole("tab", { name: "5. Bolhas" }));
    expect(screen.queryByRole("button", { name: "Próximo passo" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver as bolhas do 8 de janeiro" })).toHaveAttribute("href", "/invasao-3-poderes");
  });
  it("preserva ?tags=0 no link do último passo", async () => {
    const { user } = await renderHow("/como-funciona?tags=0");
    await user.click(await screen.findByRole("tab", { name: "5. Bolhas" }));
    expect(screen.getByRole("link", { name: "Ver as bolhas do 8 de janeiro" })).toHaveAttribute(
      "href",
      "/invasao-3-poderes?tags=0",
    );
  });
  it("explica a cor com a leitura de inclinação por padrão", async () => {
    await renderHow();
    expect(await screen.findByText("azul")).toBeInTheDocument();
  });
  it("omite a leitura de inclinação com ?tags=0", async () => {
    await renderHow("/como-funciona?tags=0");
    await screen.findByRole("tab", { name: "1. Coleções" });
    expect(screen.queryByText("azul")).not.toBeInTheDocument();
  });
  it("mostra o erro quando o index não carrega", async () => {
    stubFetchJson({});
    await renderHow();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
