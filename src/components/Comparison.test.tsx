import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../test/render";
import { buildAuthor, buildCluster, buildSlot, buildTweet } from "../test/fixtures";
import { Comparison } from "./Comparison";

const a = buildCluster({ community: 1, group: 1, label: "Grupo 1", shared_with: { "2": 0.4 } });
const b = buildCluster({ community: 2, group: 2, label: "Grupo 2", shared_with: { "1": 0.3 } });

function slotOf(community: number, id: string, text: string, overrides = {}) {
  return buildSlot({
    community,
    tweet_id: id,
    tweet: buildTweet({ id, text }),
    ...overrides,
  });
}

const slots = [
  slotOf(1, "10", "só do primeiro https://t.co/abc123", { rank: 1, rt_cluster: 7 }),
  slotOf(1, "20", "nas duas", { rank: 2, rt_cluster: 5 }),
  slotOf(2, "20", "nas duas", { rank: 1, rt_cluster: 3 }),
  slotOf(2, "30", "só do segundo", { rank: 2, rt_cluster: 4 }),
];

function renderComparison(items = slots) {
  return renderWithProviders(<Comparison slots={items} a={a} b={b} showTags />);
}

function column(title: string) {
  const heading = screen.getByRole("heading", { name: title });
  const box = heading.parentElement;
  if (!box) throw new Error("coluna sem container");
  return within(box);
}

describe("Comparison", () => {
  it("titula a comparação com os dois grupos", () => {
    renderComparison();
    expect(screen.getByRole("heading", { level: 3, name: "Grupo 1 e Grupo 2" })).toBeInTheDocument();
  });

  it("avisa que há quase nada em comum quando os grupos são isolados", () => {
    const isolated = buildCluster({ community: 2, label: "Grupo 2", shared_with: { "1": 0.01 } });
    renderWithProviders(<Comparison slots={slots} a={buildCluster({ community: 1, label: "Grupo 1", shared_with: { "2": 0.02 } })} b={isolated} showTags />);
    expect(screen.getByRole("heading", { name: "Grupo 1 e Grupo 2: quase nada em comum" })).toBeInTheDocument();
  });

  it("conta quantos tweets lidos aparecem nas duas bolhas", () => {
    renderComparison();
    expect(screen.getByText(/1 dos tweets lidos de cada bolha \(2 e 2\) aparecem nas duas/)).toBeInTheDocument();
  });

  it("lista na coluna do primeiro grupo só o que ele retuitou, sem o link encurtado", () => {
    renderComparison();
    const only = column("Só no Grupo 1");
    expect(only.getByText("só do primeiro")).toBeInTheDocument();
    expect(only.getByText("7 pessoas do Grupo 1")).toBeInTheDocument();
    expect(only.queryByText("nas duas")).not.toBeInTheDocument();
  });

  it("lista na coluna do segundo grupo só o que ele retuitou", () => {
    renderComparison();
    const only = column("Só no Grupo 2");
    expect(only.getByText("só do segundo")).toBeInTheDocument();
    expect(only.getByText("4 pessoas do Grupo 2")).toBeInTheDocument();
  });

  it("mostra na coluna das duas o tweet comum com a contagem de cada lado", () => {
    renderComparison();
    const both = column("Nas duas");
    expect(both.getByText("nas duas")).toBeInTheDocument();
    expect(both.getByText("5 pessoas do Grupo 1 e 3 do Grupo 2")).toBeInTheDocument();
  });

  it("explica quando nenhum tweet aparece nas duas bolhas", () => {
    renderComparison([slots[0], slots[3]]);
    expect(screen.getByText("Nenhum dos tweets mais retuitados aparece nas duas bolhas.")).toBeInTheDocument();
  });

  it("identifica o autor do tweet e avisa quando ele está indisponível", () => {
    const items = [
      slotOf(1, "10", "com autor", { author: buildAuthor({ name: "Maria", username: "maria" }) }),
      slotOf(2, "30", "sem autor", { author: null }),
    ];
    renderComparison(items);
    expect(screen.getByText("Maria")).toBeInTheDocument();
    expect(screen.getByText("@maria")).toBeInTheDocument();
    expect(screen.getByText("Autor indisponível")).toBeInTheDocument();
  });

  it("rola até a comparação com animação suave", () => {
    renderComparison();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("rola sem animação quando o visitante prefere movimento reduzido", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    renderComparison();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });
});
