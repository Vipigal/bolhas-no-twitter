import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { applyTheme, browserStorage, DEFAULT_THEME, readTheme, THEME_KEY, useTheme, writeTheme } from "./theme";

const throwing = () => {
  throw new Error("SecurityError");
};

describe("readTheme", () => {
  it("cai no escuro sem armazenamento", () => {
    expect(readTheme(() => undefined)).toBe("dark");
  });

  it("cai no escuro com valor salvo inválido", () => {
    expect(readTheme(() => ({ getItem: () => "sepia" }))).toBe("dark");
  });

  it("cai no escuro se o acesso ao armazenamento lançar", () => {
    expect(readTheme(throwing)).toBe("dark");
  });

  it("respeita a escolha salva", () => {
    expect(readTheme(() => ({ getItem: () => "light" }))).toBe("light");
  });

  it("lê do localStorage do navegador a escolha gravada nele", () => {
    window.localStorage.setItem(THEME_KEY, "light");
    expect(readTheme(browserStorage)).toBe("light");
  });
});

describe("writeTheme", () => {
  it("grava a escolha no armazenamento", () => {
    const store = { setItem: vi.fn() };
    writeTheme(() => store, "light");
    expect(store.setItem).toHaveBeenCalledWith(THEME_KEY, "light");
  });

  it("não quebra se o acesso ao armazenamento lançar", () => {
    expect(() => writeTheme(throwing, "light")).not.toThrow();
  });

  it("não quebra sem armazenamento", () => {
    expect(() => writeTheme(() => undefined, "light")).not.toThrow();
  });
});

describe("applyTheme", () => {
  it("aplica o tema no atributo data-theme da raiz", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("useTheme fora do provedor", () => {
  it("usa o tema padrão", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe(DEFAULT_THEME);
  });

  it("ignora o pedido de alternar", () => {
    const { result } = renderHook(() => useTheme());
    expect(() => result.current.toggle()).not.toThrow();
  });
});
