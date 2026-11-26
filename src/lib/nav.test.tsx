import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useKeptSearch, useNav, useShowTags } from "./nav";

function wrapperAt(route: string) {
  return ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;
}

function renderNav(route: string) {
  return renderHook(
    () => ({ go: useNav(), location: useLocation() }),
    { wrapper: wrapperAt(route) },
  );
}

describe("useShowTags", () => {
  it("mostra as tags por padrão", () => {
    const { result } = renderHook(() => useShowTags(), { wrapper: wrapperAt("/ev") });
    expect(result.current).toBe(true);
  });

  it("oculta as tags com ?tags=0", () => {
    const { result } = renderHook(() => useShowTags(), { wrapper: wrapperAt("/ev?tags=0") });
    expect(result.current).toBe(false);
  });

  it("mostra as tags com outro valor de tags", () => {
    const { result } = renderHook(() => useShowTags(), { wrapper: wrapperAt("/ev?tags=1") });
    expect(result.current).toBe(true);
  });
});

describe("useKeptSearch", () => {
  it("guarda ?tags=0", () => {
    const { result } = renderHook(() => useKeptSearch(), { wrapper: wrapperAt("/ev?tags=0") });
    expect(result.current).toBe("?tags=0");
  });

  it("não guarda nada sem tags=0", () => {
    const { result } = renderHook(() => useKeptSearch(), { wrapper: wrapperAt("/ev") });
    expect(result.current).toBe("");
  });

  it("descarta parâmetros que não são tags", () => {
    const { result } = renderHook(() => useKeptSearch(), { wrapper: wrapperAt("/ev?comparar=2") });
    expect(result.current).toBe("");
  });
});

describe("useNav", () => {
  it("navega sem query quando não há nada a preservar", () => {
    const { result } = renderNav("/ev");
    act(() => result.current.go("/ev/2"));
    expect(result.current.location.pathname + result.current.location.search).toBe("/ev/2");
  });

  it("preserva ?tags=0 ao navegar", () => {
    const { result } = renderNav("/ev?tags=0");
    act(() => result.current.go("/ev/2"));
    expect(result.current.location.pathname + result.current.location.search).toBe("/ev/2?tags=0");
  });

  it("acrescenta parâmetros extras", () => {
    const { result } = renderNav("/ev");
    act(() => result.current.go("/ev/2", { comparar: "3" }));
    expect(result.current.location.search).toBe("?comparar=3");
  });

  it("mantém ?tags=0 junto dos parâmetros extras", () => {
    const { result } = renderNav("/ev?tags=0");
    act(() => result.current.go("/ev/2", { comparar: "3" }));
    expect(result.current.location.search).toBe("?tags=0&comparar=3");
  });
});
