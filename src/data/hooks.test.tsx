import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildEvent, buildGroupMap, buildIndex } from "../test/fixtures";
import { useEvent, useGroupMap, useIndex } from "./hooks";

function stubJson(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve(body),
    }),
  );
}

function stubMissing() {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, headers: new Headers() }));
}

function stubBySlug(bodies: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) =>
      Promise.resolve({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve(bodies[path]),
      }),
    ),
  );
}

describe("useIndex", () => {
  it("falha com ExportNotFoundError quando o index.json não existe", async () => {
    stubMissing();
    const { result } = renderHook(() => useIndex());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current).toMatchObject({ error: { name: "ExportNotFoundError" } });
  });

  it("começa em loading e termina em ready com o índice", async () => {
    const index = buildIndex();
    stubJson(index);
    const { result } = renderHook(() => useIndex());
    expect(result.current).toEqual({ status: "loading" });
    await waitFor(() => expect(result.current).toEqual({ status: "ready", data: index }));
  });
});

describe("useEvent", () => {
  it("termina em ready com meta e slots do evento", async () => {
    stubJson([]);
    const meta = buildEvent({ slug: "pronto" });
    const { result } = renderHook(() => useEvent(meta));
    await waitFor(() => expect(result.current).toEqual({ status: "ready", data: { meta, slots: [] } }));
  });

  it("vai de loading a error quando os tweets não existem", async () => {
    stubMissing();
    const { result } = renderHook(() => useEvent(buildEvent({ slug: "quebrado" })));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("devolve loading no mesmo render em que a chave muda", async () => {
    stubBySlug({ "/a/tweets.json": [], "/b/tweets.json": [] });
    const metaA = buildEvent({ slug: "a" });
    const metaB = buildEvent({ slug: "b" });
    const { result, rerender } = renderHook(({ meta }) => useEvent(meta), { initialProps: { meta: metaA } });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    rerender({ meta: metaB });
    expect(result.current).toEqual({ status: "loading" });
    await waitFor(() => expect(result.current).toMatchObject({ status: "ready", data: { meta: metaB } }));
  });

  it("descarta a resposta antiga quando a chave muda antes de ela chegar", async () => {
    let releaseA: (value: unknown) => void = () => {};
    const slow = new Promise((resolve) => {
      releaseA = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) =>
        Promise.resolve({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: () => (path === "/lenta/tweets.json" ? slow : Promise.resolve([])),
        }),
      ),
    );
    const metaA = buildEvent({ slug: "lenta" });
    const metaB = buildEvent({ slug: "rapida" });
    const { result, rerender } = renderHook(({ meta }) => useEvent(meta), { initialProps: { meta: metaA } });
    rerender({ meta: metaB });
    await waitFor(() => expect(result.current).toMatchObject({ status: "ready", data: { meta: metaB } }));
    releaseA([]);
    await Promise.resolve();
    expect(result.current).toMatchObject({ status: "ready", data: { meta: metaB } });
  });
});

describe("useGroupMap", () => {
  it("termina em ready com o mapa de grupos do evento", async () => {
    const groupMap = buildGroupMap();
    stubBySlug({ "/grupos-ok/grafo.json": groupMap });
    const { result } = renderHook(() => useGroupMap("grupos-ok"));
    await waitFor(() => expect(result.current).toEqual({ status: "ready", data: groupMap }));
  });

  it("vai de loading a error quando o grafo não existe", async () => {
    stubMissing();
    const { result } = renderHook(() => useGroupMap("grupos-falta"));
    await waitFor(() => expect(result.current.status).toBe("error"));
  });
});
