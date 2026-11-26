import { describe, expect, it } from "vitest";
import { axisColors, groupColor, shownAxis } from "./palette";

describe("groupColor", () => {
  it("usa o tom do grupo pela ordem, começando em 1", () => {
    expect(groupColor(1)).toBe("var(--group-1)");
    expect(groupColor(5)).toBe("var(--group-5)");
  });

  it("volta ao primeiro tom depois do quinto grupo", () => {
    expect(groupColor(6)).toBe("var(--group-1)");
  });
});

describe("axisColors", () => {
  it("devolve as cores neutras sem inclinação", () => {
    expect(axisColors(null)).toEqual({ ink: "var(--ink)", tint: "var(--soft)", line: "var(--line-strong)" });
  });

  it("devolve as cores da direita", () => {
    expect(axisColors("direita")).toEqual({ ink: "var(--right-ink)", tint: "var(--right-tint)", line: "var(--right-line)" });
  });

  it("devolve as cores da esquerda", () => {
    expect(axisColors("esquerda")).toEqual({ ink: "var(--left-ink)", tint: "var(--left-tint)", line: "var(--left-line)" });
  });

  it("devolve as cores de outro", () => {
    expect(axisColors("outro")).toEqual({ ink: "var(--other-ink)", tint: "var(--other-tint)", line: "var(--other-line)" });
  });
});

describe("shownAxis", () => {
  it("mostra a inclinação curada quando as tags estão visíveis", () => {
    expect(shownAxis({ curation: { eixo: "direita" } }, true)).toBe("direita");
  });

  it("não mostra inclinação com as tags ocultas", () => {
    expect(shownAxis({ curation: { eixo: "direita" } }, false)).toBeNull();
  });

  it("não mostra inclinação sem curadoria", () => {
    expect(shownAxis({ curation: null }, true)).toBeNull();
  });
});
