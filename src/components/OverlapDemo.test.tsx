import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CrowdDemo, LinkDemo, PairDemo } from "./OverlapDemo";

describe("PairDemo", () => {
  it("mostra os círculos de Ana e Bruno separados", () => {
    render(<PairDemo overlap={false} />);
    expect(screen.getByRole("img", { name: /separados/ })).toBeInTheDocument();
    expect(screen.queryByText(/ligação de 0,67/)).not.toBeInTheDocument();
  });

  it("mostra os círculos sobrepostos e a conta da ligação", () => {
    render(<PairDemo overlap />);
    expect(screen.getByRole("img", { name: /sobrepostos/ })).toBeInTheDocument();
    expect(screen.getByText("2 em comum ÷ 3 no total = ligação de 0,67")).toBeInTheDocument();
  });
});

describe("LinkDemo", () => {
  it("descreve a ligação de 0,67 entre Ana e Bruno", () => {
    render(<LinkDemo />);
    expect(screen.getByRole("img", { name: /dois pontos ligados por uma linha de 0,67/ })).toBeInTheDocument();
  });

  it.each(["Ana", "Bruno", "Fê", "Edu", "Carla", "Davi"])("nomeia %s na rede", (nome) => {
    render(<LinkDemo />);
    expect(screen.getAllByText(nome)[0]).toBeInTheDocument();
  });
});

describe("CrowdDemo", () => {
  it("mostra a rede de pontos sem agrupar", () => {
    render(<CrowdDemo grouped={false} />);
    expect(screen.getByRole("img", { name: "Uma rede de pontos ligados por linhas" })).toBeInTheDocument();
  });

  it("mostra os pontos coloridos em três grupos", () => {
    render(<CrowdDemo grouped />);
    expect(screen.getByRole("img", { name: "Pontos coloridos em três grupos" })).toBeInTheDocument();
  });
});
