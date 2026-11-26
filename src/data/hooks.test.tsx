import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildEvent, buildGroupMap, buildIndex } from "../test/fixtures";

function jsonResponse(body: unknown) {
  return {
    ok: true,
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve(body),
  };
}

function stubJson(body: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body)));
}

function stubMissing() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, headers: new Headers() }));
}

function stubByPath(bodies: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) => Promise.resolve(jsonResponse(bodies[path]))),
  );
}

beforeEach(() => {
  vi.resetModules();
});

describe("useIndex", () => {
  it("começa em loading e termina em ready com o índice", async () => {
    const index = buildIndex();
    stubJson(index);
    const { useIndex } = await import("./hooks");
    const { result } = renderHook(() => useIndex());
    expect(result.current).toEqual({ status: "loading" });
    await waitFor(() => expect(result.current).toEqual({ status: "ready", data: index }));
  });

  it("falha com ExportNotFoundError quando o index.json não existe", async () => {
    stubMissing();
    const { useIndex } = await import("./hooks");
    const { result } = renderHook(() => useIndex());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current).toMatchObject({ error: { name: "ExportNotFoundError" } });
  });
});

describe("useEvent", () => {
  it("termina em ready com meta e slots do evento", async () => {
    stubJson([]);
    const meta = buildEvent({ slug: "a" });
    const { useEvent } = await import("./hooks");
    const { result } = renderHook(() => useEvent(meta));
    await waitFor(() => expect(result.current).toEqual({ status: "ready", data: { meta, slots: [] } }));
  });

  it("vai de loading a error quando os tweets não existem", async () => {
    stubMissing();
    const { useEvent } = await import("./hooks");
    const { result } = renderHook(() => useEvent(buildEvent({ slug: "a" })));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("devolve loading no mesmo render em que a chave muda", async () => {
    stubByPath({ "/a/tweets.json": [], "/b/tweets.json": [] });
    const metaA = buildEvent({ slug: "a" });
    const metaB = buildEvent({ slug: "b" });
    const { useEvent } = await import("./hooks");
    const { result, rerender } = renderHook(({ meta }) => useEvent(meta), { initialProps: { meta: metaA } });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    rerender({ meta: metaB });
    expect(result.current).toEqual({ status: "loading" });
    await waitFor(() => expect(result.current).toMatchObject({ status: "ready", data: { meta: metaB } }));
  });

  it("descarta a resposta antiga quando a chave muda antes de ela chegar", async () => {
    let releaseA: (value: unknown) => void = () => {};
    const slowBody = new Promise((resolve) => {
      releaseA = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) =>
        Promise.resolve({
          ...jsonResponse([]),
          json: () => (path === "/a/tweets.json" ? slowBody : Promise.resolve([])),
        }),
      ),
    );
    const metaA = buildEvent({ slug: "a" });
    const metaB = buildEvent({ slug: "b" });
    const { useEvent } = await import("./hooks");
    const { result, rerender } = renderHook(({ meta }) => useEvent(meta), { initialProps: { meta: metaA } });
    rerender({ meta: metaB });
    await waitFor(() => expect(result.current).toMatchObject({ status: "ready", data: { meta: metaB } }));
    await act(async () => {
      releaseA([]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current).toMatchObject({ status: "ready", data: { meta: metaB } });
  });
});

describe("useGroupMap", () => {
  it("termina em ready com o mapa de grupos do evento", async () => {
    const groupMap = buildGroupMap();
    stubByPath({ "/a/grafo.json": groupMap });
    const { useGroupMap } = await import("./hooks");
    const { result } = renderHook(() => useGroupMap("a"));
    await waitFor(() => expect(result.current).toEqual({ status: "ready", data: groupMap }));
  });

  it("vai de loading a error quando o grafo não existe", async () => {
    stubMissing();
    const { useGroupMap } = await import("./hooks");
    const { result } = renderHook(() => useGroupMap("a"));
    await waitFor(() => expect(result.current.status).toBe("error"));
  });
});
