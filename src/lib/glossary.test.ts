import { describe, expect, it } from "vitest";
import { AXIS_TEXT, CONFIDENCE_TEXT, VERIFIED_TYPE_TEXT } from "./glossary";

describe("glossário", () => {
  it.each([
    ["confiança", CONFIDENCE_TEXT],
    ["inclinação", AXIS_TEXT],
    ["tipo de verificado", VERIFIED_TYPE_TEXT],
  ])("todo termo de %s tem texto não vazio", (_nome, termos) => {
    expect(Object.values(termos).every((texto) => texto.trim() !== "")).toBe(true);
  });

  it("cobre todas as inclinações do domínio", () => {
    expect(Object.keys(AXIS_TEXT).sort()).toEqual(["direita", "esquerda", "outro"]);
  });

  it("cobre todos os níveis de confiança do domínio", () => {
    expect(Object.keys(CONFIDENCE_TEXT).sort()).toEqual(["alta", "baixa", "media"]);
  });
});
