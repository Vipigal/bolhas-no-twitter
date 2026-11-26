import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../test/render";
import { buildCluster, buildGroupLabel, buildGroupMap } from "../test/fixtures";
import { GraphStage } from "./GraphStage";

const clusters = [
  buildCluster({ community: 1, group: 1, label: "Grupo 1", frac_nodes: 0.6 }),
  buildCluster({ community: 2, group: 2, label: "Grupo 2", frac_nodes: 0.3 }),
];

const map = buildGroupMap({
  groups: [
    buildGroupLabel({ community: 1, group: 1 }),
    buildGroupLabel({ community: 2, group: 2 }),
    buildGroupLabel({ community: 9, group: 3 }),
  ],
  grid: { n: 2, cells: [1, 2, -1, 9] },
});

function renderStage(selected = 1) {
  const onSelect = vi.fn();
  const view = renderWithProviders(
    <GraphStage slug="evento" map={map} clusters={clusters} selected={selected} onSelect={onSelect} />,
  );
  const image = screen.getByRole("img", { name: /Grafo do evento/ });
  image.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100);
  return { ...view, image, onSelect };
}

describe("GraphStage", () => {
  it("mostra o grafo com o grupo aberto em destaque", () => {
    const { image } = renderStage(2);
    expect(image).toHaveAttribute("src", "/evento/grafo-escuro-g2.webp");
  });

  it("usa a imagem clara no tema claro", () => {
    window.localStorage.setItem("leitor:theme", "light");
    const { image } = renderStage(1);
    expect(image).toHaveAttribute("src", "/evento/grafo-claro-g1.webp");
  });

  it("cai para a imagem sem destaque quando a do grupo não carrega", () => {
    const { image } = renderStage(1);
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", "/evento/grafo-escuro.webp");
  });

  it("mostra um rótulo por grupo conhecido, com a fração de pessoas", () => {
    renderStage();
    expect(screen.getByRole("button", { name: "Grupo 1 · 60%" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grupo 2 · 30%" })).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("marca como pressionado só o rótulo do grupo aberto", () => {
    renderStage(2);
    expect(screen.getByRole("button", { name: /Grupo 2/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Grupo 1/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("seleciona o grupo ao clicar no rótulo", async () => {
    const { user, onSelect } = renderStage(1);
    await user.click(screen.getByRole("button", { name: /Grupo 2/ }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("seleciona o grupo sob o ponto clicado na imagem", () => {
    const { image, onSelect } = renderStage(1);
    fireEvent.click(image, { clientX: 75, clientY: 25 });
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it("não seleciona ao clicar fora de qualquer grupo", () => {
    const { image, onSelect } = renderStage(1);
    fireEvent.click(image, { clientX: 25, clientY: 75 });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("não seleciona um grupo ausente da lista de bolhas", () => {
    const { image, onSelect } = renderStage(1);
    fireEvent.click(image, { clientX: 75, clientY: 75 });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("mostra o cursor de clique só enquanto o ponteiro está sobre um grupo", () => {
    const { image } = renderStage(1);
    fireEvent.mouseMove(image, { clientX: 25, clientY: 25 });
    expect(image).toHaveClass("cursor-pointer");
    fireEvent.mouseLeave(image);
    expect(image).not.toHaveClass("cursor-pointer");
  });
});
