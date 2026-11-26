import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { buildIndex } from "./test/fixtures";
import { stubFetchJson } from "./test/fetch";

async function load() {
  vi.resetModules();
  const app = await import("./App");
  const { renderWithProviders } = await import("./test/render");
  return { ...app, renderWithProviders };
}

beforeEach(() => {
  stubFetchJson({ "/index.json": buildIndex() });
});

describe("ThemeProvider", () => {
  it("começa no tema escuro quando nada foi salvo", async () => {
    const { PageFrame, renderWithProviders } = await load();
    renderWithProviders(<PageFrame>conteúdo</PageFrame>);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: "usar tema claro" })).toBeInTheDocument();
  });
  it("começa no tema salvo no localStorage", async () => {
    window.localStorage.setItem("leitor:theme", "light");
    const { PageFrame, renderWithProviders } = await load();
    renderWithProviders(<PageFrame>conteúdo</PageFrame>);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("button", { name: "usar tema escuro" })).toBeInTheDocument();
  });
  it("alterna para o tema claro ao clicar no botão", async () => {
    const { PageFrame, renderWithProviders } = await load();
    const { user } = renderWithProviders(<PageFrame>conteúdo</PageFrame>);
    await user.click(screen.getByRole("button", { name: "usar tema claro" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(screen.getByRole("button", { name: "usar tema escuro" })).toBeInTheDocument();
  });
  it("volta ao tema escuro no segundo clique", async () => {
    const { PageFrame, renderWithProviders } = await load();
    const { user } = renderWithProviders(<PageFrame>conteúdo</PageFrame>);
    await user.click(screen.getByRole("button", { name: "usar tema claro" }));
    await user.click(screen.getByRole("button", { name: "usar tema escuro" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
  it("persiste a escolha no localStorage", async () => {
    const { PageFrame, renderWithProviders } = await load();
    const { user } = renderWithProviders(<PageFrame>conteúdo</PageFrame>);
    await user.click(screen.getByRole("button", { name: "usar tema claro" }));
    expect(window.localStorage.getItem("leitor:theme")).toBe("light");
  });
});

describe("PageFrame", () => {
  it("mostra o conteúdo dentro de main", async () => {
    const { PageFrame, renderWithProviders } = await load();
    renderWithProviders(<PageFrame>conteúdo da página</PageFrame>);
    expect(screen.getByRole("main")).toHaveTextContent("conteúdo da página");
  });
  it("liga o título à home e o outro link a Como as bolhas se formam", async () => {
    const { PageFrame, renderWithProviders } = await load();
    renderWithProviders(<PageFrame>x</PageFrame>);
    expect(screen.getByRole("link", { name: "Polarização no Twitter brasileiro" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Como as bolhas se formam" })).toHaveAttribute("href", "/como-funciona");
  });
  it("preserva ?tags=0 nos links do cabeçalho", async () => {
    const { PageFrame, renderWithProviders } = await load();
    renderWithProviders(<PageFrame>x</PageFrame>, { route: "/?tags=0" });
    expect(screen.getByRole("link", { name: "Polarização no Twitter brasileiro" })).toHaveAttribute("href", "/?tags=0");
    expect(screen.getByRole("link", { name: "Como as bolhas se formam" })).toHaveAttribute("href", "/como-funciona?tags=0");
  });
  it("descarta outros parâmetros da URL nos links do cabeçalho", async () => {
    const { PageFrame, renderWithProviders } = await load();
    renderWithProviders(<PageFrame>x</PageFrame>, { route: "/?comparar=2" });
    expect(screen.getByRole("link", { name: "Como as bolhas se formam" })).toHaveAttribute("href", "/como-funciona");
  });
});

describe("WithIndex", () => {
  it("mostra o esqueleto enquanto o index carrega", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
    const { WithIndex, renderWithProviders } = await load();
    const { container } = renderWithProviders(<WithIndex>{() => <p>pronto</p>}</WithIndex>);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByText("pronto")).not.toBeInTheDocument();
  });
  it("mantém o cabeçalho enquanto o index carrega", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
    const { WithIndex, renderWithProviders } = await load();
    renderWithProviders(<WithIndex>{() => <p>pronto</p>}</WithIndex>);
    expect(screen.getByRole("link", { name: "Como as bolhas se formam" })).toBeInTheDocument();
  });
  it("mostra o erro quando o index não existe", async () => {
    stubFetchJson({});
    const { WithIndex, renderWithProviders } = await load();
    renderWithProviders(<WithIndex>{() => <p>pronto</p>}</WithIndex>);
    expect(await screen.findByRole("alert")).toHaveTextContent("/index.json");
    expect(screen.queryByText("pronto")).not.toBeInTheDocument();
  });
  it("entrega o index carregado ao render-prop", async () => {
    const { WithIndex, renderWithProviders } = await load();
    renderWithProviders(<WithIndex>{(index) => <p>{index.events.length} evento(s)</p>}</WithIndex>);
    expect(await screen.findByText("1 evento(s)")).toBeInTheDocument();
  });
  it("não envolve o resultado pronto no cabeçalho", async () => {
    const { WithIndex, renderWithProviders } = await load();
    renderWithProviders(<WithIndex>{() => <p>pronto</p>}</WithIndex>);
    await waitFor(() => expect(screen.getByText("pronto")).toBeInTheDocument());
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });
});
