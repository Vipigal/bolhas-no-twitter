import { describe, expect, it } from "vitest";
import { AXIS_TEXT, CONFIDENCE_TEXT, VERIFIED_TYPE_TEXT } from "./glossary";

describe("glossário", () => {
  it("acentua a confiança média", () => {
    expect(CONFIDENCE_TEXT.media).toBe("média");
  });

  it("capitaliza o nome de cada inclinação", () => {
    expect(AXIS_TEXT).toEqual({ direita: "Direita", esquerda: "Esquerda", outro: "Outro" });
  });

  it("descreve o selo de organização", () => {
    expect(VERIFIED_TYPE_TEXT.business).toBe("verificado (organização)");
  });

  it("descreve o selo sem tipo como verificado", () => {
    expect(VERIFIED_TYPE_TEXT.none).toBe("verificado");
  });
});
