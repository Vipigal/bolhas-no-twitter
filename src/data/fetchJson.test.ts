import { describe, expect, it, vi } from "vitest";
import { ExportNotFoundError, fetchJson } from "./fetchJson";

function stubFetch(body: unknown, init: { ok?: boolean; type?: string | null } = {}) {
  const { ok = true, type = "application/json" } = init;
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    headers: new Headers(type === null ? {} : { "content-type": type }),
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchJson", () => {
  it("devolve o JSON da resposta ok", async () => {
    stubFetch({ a: 1 });
    await expect(fetchJson("/x.json")).resolves.toEqual({ a: 1 });
  });

  it("pede o caminho recebido", async () => {
    const fetchMock = stubFetch({});
    await fetchJson("/ev/tweets.json");
    expect(fetchMock).toHaveBeenCalledWith("/ev/tweets.json");
  });

  it("lança ExportNotFoundError com o path quando a resposta não é ok", async () => {
    stubFetch({}, { ok: false });
    await expect(fetchJson("/falta.json")).rejects.toMatchObject({
      name: "ExportNotFoundError",
      path: "/falta.json",
    });
  });

  it("lança ExportNotFoundError quando o status é 200 mas o conteúdo é HTML", async () => {
    stubFetch({}, { type: "text/html" });
    await expect(fetchJson("/spa.json")).rejects.toBeInstanceOf(ExportNotFoundError);
  });

  it("lança ExportNotFoundError quando a resposta não informa content-type", async () => {
    stubFetch({}, { type: null });
    await expect(fetchJson("/sem-tipo.json")).rejects.toBeInstanceOf(ExportNotFoundError);
  });

  it("cita o caminho ausente na mensagem do erro", () => {
    expect(new ExportNotFoundError("/ev/grafo.json").message).toContain("data/export/ev/grafo.json");
  });
});
