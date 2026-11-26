import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildEvent, buildGroupMap, buildIndex, buildSlot } from "../test/fixtures";

function stubFetchWith(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ "content-type": "application/json" }),
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function stubFetchFailing() {
  const fetchMock = vi.fn().mockResolvedValue({ ok: false, headers: new Headers() });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.resetModules();
});

describe("loadIndex", () => {
  it("pede /index.json", async () => {
    const fetchMock = stubFetchWith(buildIndex());
    const { loadIndex } = await import("./loadIndex");
    await loadIndex();
    expect(fetchMock).toHaveBeenCalledWith("/index.json");
  });

  it("baixa uma vez só nas chamadas seguintes", async () => {
    const fetchMock = stubFetchWith(buildIndex());
    const { loadIndex } = await import("./loadIndex");
    await loadIndex();
    await loadIndex();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tenta de novo depois de uma falha", async () => {
    stubFetchFailing();
    const { loadIndex } = await import("./loadIndex");
    await expect(loadIndex()).rejects.toThrow();
    const fetchMock = stubFetchWith(buildIndex());
    await loadIndex();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("loadEvent", () => {
  it("pede o arquivo de tweets do evento e devolve meta e slots", async () => {
    const slots = [buildSlot()];
    const fetchMock = stubFetchWith(slots);
    const meta = buildEvent({ slug: "ev" });
    const { loadEvent } = await import("./loadEvent");
    await expect(loadEvent(meta)).resolves.toEqual({ meta, slots });
    expect(fetchMock).toHaveBeenCalledWith("/ev/tweets.json");
  });

  it("não baixa de novo ao voltar ao mesmo evento", async () => {
    const fetchMock = stubFetchWith([]);
    const meta = buildEvent({ slug: "ev" });
    const { loadEvent } = await import("./loadEvent");
    await loadEvent(meta);
    await loadEvent(meta);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tenta de novo depois de uma falha", async () => {
    stubFetchFailing();
    const meta = buildEvent({ slug: "ev" });
    const { loadEvent } = await import("./loadEvent");
    await expect(loadEvent(meta)).rejects.toThrow();
    const fetchMock = stubFetchWith([]);
    await loadEvent(meta);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("loadGroupMap", () => {
  it("pede o grafo.json do evento", async () => {
    const groupMap = buildGroupMap();
    const fetchMock = stubFetchWith(groupMap);
    const { loadGroupMap } = await import("./loadGroupMap");
    await expect(loadGroupMap("ev")).resolves.toEqual(groupMap);
    expect(fetchMock).toHaveBeenCalledWith("/ev/grafo.json");
  });

  it("não baixa de novo ao voltar ao mesmo evento", async () => {
    const fetchMock = stubFetchWith(buildGroupMap());
    const { loadGroupMap } = await import("./loadGroupMap");
    await loadGroupMap("ev");
    await loadGroupMap("ev");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tenta de novo depois de uma falha", async () => {
    stubFetchFailing();
    const { loadGroupMap } = await import("./loadGroupMap");
    await expect(loadGroupMap("ev")).rejects.toThrow();
    const fetchMock = stubFetchWith(buildGroupMap());
    await loadGroupMap("ev");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
