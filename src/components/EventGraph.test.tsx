import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/render";
import { buildCluster, buildGroupLabel, buildGroupMap } from "../test/fixtures";
import type { GroupMap } from "../types";
import { EventGraph } from "./EventGraph";

const clusters = [buildCluster({ community: 1, label: "Grupo 1" }), buildCluster({ community: 2, group: 2, label: "Grupo 2" })];

let counter = 0;
function nextSlug() {
  counter += 1;
  return `evento-${counter}`;
}

function stubGroupMap(map: GroupMap | null) {
  const fetchMock = vi.fn(async () =>
    map
      ? new Response(JSON.stringify(map), { headers: { "content-type": "application/json" } })
      : new Response("nada", { status: 404 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderGraph(slug: string, onSelect = vi.fn()) {
  return renderWithProviders(
    <EventGraph slug={slug} clusters={clusters} selected={1} onSelect={onSelect} labelOf={(c) => `Grupo ${c}`} />,
  );
}

const map = buildGroupMap({
  groups: [buildGroupLabel({ community: 1 }), buildGroupLabel({ community: 2, group: 2 })],
  dominant_pairs: [{ a: 1, b: 2, share: 0.4 }],
});

afterEach(() => vi.unstubAllGlobals());

describe("EventGraph", () => {
  it("mostra o esqueleto enquanto o grafo carrega", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { container } = renderGraph(nextSlug());
    expect(container.querySelector("[aria-hidden='true']")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("busca o grafo do evento pelo slug", async () => {
    const slug = nextSlug();
    const fetchMock = stubGroupMap(map);
    renderGraph(slug);
    await screen.findByRole("img", { name: /Grafo do evento/ });
    expect(fetchMock).toHaveBeenCalledWith(`/${slug}/grafo.json`);
  });

  it("mostra o grafo e os rótulos dos grupos quando carrega", async () => {
    stubGroupMap(map);
    renderGraph(nextSlug());
    expect(await screen.findByRole("button", { name: /Grupo 1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Grupo 2/ })).toBeInTheDocument();
  });

  it("avisa que o grafo não foi gerado quando o arquivo não existe", async () => {
    stubGroupMap(null);
    renderGraph(nextSlug());
    expect(await screen.findByText(/O grafo deste evento ainda não foi gerado/)).toBeInTheDocument();
  });

  it("repassa a seleção de grupo do grafo", async () => {
    stubGroupMap(map);
    const onSelect = vi.fn();
    const { user } = renderGraph(nextSlug(), onSelect);
    await user.click(await screen.findByRole("button", { name: /Grupo 2/ }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("explica como ler o grafo mesmo sem os dados", async () => {
    stubGroupMap(null);
    renderGraph(nextSlug());
    await screen.findByText(/O grafo deste evento/);
    expect(screen.getByText(/Toque num grupo para abri-lo/)).toBeInTheDocument();
  });

  it("acrescenta a nota dos pares que circulam juntos", async () => {
    stubGroupMap(map);
    renderGraph(nextSlug());
    expect(await screen.findByText(/Grupo 1 e Grupo 2 aparecem juntos: 40%/)).toBeInTheDocument();
  });

  it("não mostra nota de pares quando não há pares dominantes", async () => {
    stubGroupMap(buildGroupMap({ groups: [buildGroupLabel({ community: 1 })] }));
    renderGraph(nextSlug());
    await screen.findByRole("img", { name: /Grafo do evento/ });
    expect(screen.queryByText(/aparecem juntos/)).not.toBeInTheDocument();
  });
});
