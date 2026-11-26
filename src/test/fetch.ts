import { vi } from "vitest";

export function stubFetchJson(routes: Record<string, unknown>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url in routes
        ? new Response(JSON.stringify(routes[url]), { status: 200, headers: { "content-type": "application/json" } })
        : new Response("", { status: 404 }),
    ),
  );
}
