import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/render";
import { buildCluster } from "../test/fixtures";
import type { ClusterMeta } from "../types";
import { GroupSide, GroupSynthesis } from "./GroupPanel";

const summary: NonNullable<ClusterMeta["summary"]> = {
  sintese: "Primeiro parágrafo [10].\n\nSegundo parágrafo.",
  contas_prevalentes: "",
  inclinacao_politica: { texto: "Inclinação descrita [10].", confianca: "media" },
  limites: "Limites do modelo.",
  model: "m",
  prompt_version: "v1",
  generated_at: "2026-01-01T00:00:00Z",
  invalid_ids: [],
};

const cluster = buildCluster({
  community: 1,
  label: "Grupo 1",
  summary,
  curation: { trecho: [], eixo: "esquerda", stale: false },
  top_accounts: [
    { author_id: "1", username: "ana", name: "Ana", verified: null, rt_cluster: 1200, n_tweets: 3 },
    { author_id: "2", username: null, name: "Bruno", verified: null, rt_cluster: 5, n_tweets: 1 },
    { author_id: "3", username: null, name: null, verified: null, rt_cluster: 2, n_tweets: 1 },
  ],
});
const clusters = [cluster, buildCluster({ community: 2, label: "Grupo 2" }), buildCluster({ community: 3, label: "Grupo 3" })];
const labels = new Map([["10", "1"]]);

function renderSide(overrides: Partial<Parameters<typeof GroupSide>[0]> = {}) {
  const onCompare = vi.fn();
  const onCite = vi.fn();
  const view = renderWithProviders(
    <GroupSide
      cluster={cluster}
      clusters={clusters}
      compareWith={null}
      showTags
      labels={labels}
      labelOf={(c) => `Grupo ${c}`}
      onCompare={onCompare}
      onCite={onCite}
      {...overrides}
    />,
  );
  return { ...view, onCompare, onCite };
}

describe("GroupSide", () => {
  it("mostra o nome do grupo aberto e a frase de tamanho", () => {
    renderSide();
    expect(screen.getByRole("heading", { level: 2, name: "Grupo 1" })).toBeInTheDocument();
    expect(screen.getByText("100 pessoas, 50% do evento.")).toBeInTheDocument();
  });

  it("mostra a inclinação curada do grupo", () => {
    renderSide();
    expect(screen.getByText("Esquerda")).toBeInTheDocument();
    expect(screen.getByText('Por que "Esquerda"')).toBeInTheDocument();
  });

  it("esconde a inclinação com showTags desligado", () => {
    renderSide({ showTags: false });
    expect(screen.queryByText("Esquerda")).not.toBeInTheDocument();
    expect(screen.queryByText(/Por que/)).not.toBeInTheDocument();
  });

  it("mostra o texto da inclinação com a confiança declarada", () => {
    renderSide();
    expect(screen.getByText(/Inclinação descrita/)).toBeInTheDocument();
    expect(screen.getByText(/Confiança declarada: média\./)).toBeInTheDocument();
  });

  it("oferece comparar só com os outros grupos", () => {
    renderSide();
    expect(screen.getByRole("button", { name: "Grupo 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grupo 3" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Grupo 1" })).not.toBeInTheDocument();
  });

  it("pede a comparação com o grupo escolhido", async () => {
    const { user, onCompare } = renderSide();
    await user.click(screen.getByRole("button", { name: "Grupo 2" }));
    expect(onCompare).toHaveBeenCalledWith(2);
  });

  it("fecha a comparação ao clicar no grupo já comparado", async () => {
    const { user, onCompare } = renderSide({ compareWith: 2 });
    const button = screen.getByRole("button", { name: "Grupo 2" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    await user.click(button);
    expect(onCompare).toHaveBeenCalledWith(null);
  });

  it("leva ao tweet ao clicar numa citação", async () => {
    const { user, onCite } = renderSide();
    await user.click(screen.getByRole("link", { name: "1" }));
    expect(onCite).toHaveBeenCalledWith("10");
  });

  it("lista as contas mais retuitadas, com o nome quando falta o usuário", () => {
    renderSide();
    expect(screen.getByText("@ana")).toBeInTheDocument();
    expect(screen.getByText("1.200")).toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByText("conta indisponível")).toBeInTheDocument();
  });

  it("omite o quadro de contas quando não há nenhuma", () => {
    renderSide({ cluster: buildCluster({ community: 1, summary, top_accounts: [] }) });
    expect(screen.queryByText("Contas mais retuitadas")).not.toBeInTheDocument();
  });

  it("mostra os limites da síntese", () => {
    renderSide();
    expect(screen.getByText("Limites do modelo.")).toBeInTheDocument();
  });

  it("omite os quadros do modelo quando a síntese não foi gerada", () => {
    renderSide({ cluster: buildCluster({ community: 1, summary: null }) });
    expect(screen.queryByText("O que não dá para afirmar")).not.toBeInTheDocument();
    expect(screen.queryByText(/Inclinação provável/)).not.toBeInTheDocument();
  });
});

describe("GroupSynthesis", () => {
  it("divide a síntese em um parágrafo por linha em branco", () => {
    renderWithProviders(<GroupSynthesis cluster={cluster} labels={labels} onCite={vi.fn()} />);
    expect(screen.getByText(/Primeiro parágrafo/)).toBeInTheDocument();
    expect(screen.getByText("Segundo parágrafo.")).toBeInTheDocument();
  });

  it("leva ao tweet ao clicar numa citação da síntese", async () => {
    const onCite = vi.fn();
    const { user } = renderWithProviders(<GroupSynthesis cluster={cluster} labels={labels} onCite={onCite} />);
    await user.click(screen.getByRole("link", { name: "1" }));
    expect(onCite).toHaveBeenCalledWith("10");
  });

  it("avisa quando a síntese ainda não foi gerada", () => {
    renderWithProviders(<GroupSynthesis cluster={buildCluster({ summary: null })} labels={labels} onCite={vi.fn()} />);
    expect(screen.getByText("A síntese desta bolha ainda não foi gerada.")).toBeInTheDocument();
  });
});
