import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { applyTheme, browserStorage, DEFAULT_THEME, readTheme, THEME_KEY, useTheme, writeTheme } from "./theme";

describe("tema", () => {
  it("padrão escuro sem armazenamento, com valor inválido ou se o acesso lançar", () => {
    expect(readTheme(() => undefined)).toBe("dark");
    expect(readTheme(() => ({ getItem: () => "sepia" }))).toBe("dark");
    expect(
      readTheme(() => {
        throw new Error("SecurityError");
      }),
    ).toBe("dark");
  });
  it("respeita a escolha salva e não quebra ao gravar sem armazenamento", () => {
    expect(readTheme(() => ({ getItem: () => "light" }))).toBe("light");
    expect(() =>
      writeTheme(() => {
        throw new Error("SecurityError");
      }, "light"),
    ).not.toThrow();
  });

  it("grava a escolha no armazenamento", () => {
    const store = { setItem: vi.fn() };
    writeTheme(() => store, "light");
    expect(store.setItem).toHaveBeenCalledWith(THEME_KEY, "light");
  });
  it("não grava quando não há armazenamento", () => {
    expect(() => writeTheme(() => undefined, "light")).not.toThrow();
  });
  it("lê do localStorage do navegador a escolha gravada nele", () => {
    window.localStorage.setItem(THEME_KEY, "light");
    expect(readTheme(browserStorage)).toBe("light");
  });
  it("aplica o tema no atributo data-theme da raiz", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
  it("fora do provedor, usa o tema padrão e alternar não faz nada", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe(DEFAULT_THEME);
    expect(() => result.current.toggle()).not.toThrow();
  });
});
