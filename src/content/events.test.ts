import { describe, expect, it } from "vitest";
import { EVENT_STORIES, OMITTED_MEDIA, TIMELINE_MARKS, storyFor } from "./events";

describe("storyFor", () => {
  it("devolve a história curada do evento pelo slug", () => {
    const story = storyFor({ slug: "eleicoes", name: "Qualquer nome", event_date: "2022-10-30" });
    expect(story).toBe(EVENT_STORIES.eleicoes);
    expect(story.dateShort).toBe("30 out 2022");
  });
  it("cai no nome e na data do export quando o slug não tem texto curado", () => {
    const story = storyFor({ slug: "novo-evento", name: "Evento novo", event_date: "2023-02-01" });
    expect(story.title).toBe("Evento novo");
    expect(story.short).toBe("Evento novo");
    expect(story.about).toBe("Evento novo");
    expect(story.dateShort).toBe("2023-02-01");
    expect(story.full).toBe("2023-02-01");
  });
  it("usa texto vazio e nenhuma fonte quando o slug não tem texto curado", () => {
    const story = storyFor({ slug: "novo-evento", name: "Evento novo", event_date: "2023-02-01" });
    expect(story.text).toBe("");
    expect(story.note).toBeNull();
    expect(story.sources).toEqual([]);
  });
  it("usa data vazia quando o evento sem texto curado não tem data", () => {
    const story = storyFor({ slug: "novo-evento", name: "Evento novo", event_date: null });
    expect(story.dateShort).toBe("");
    expect(story.full).toBe("");
  });
});

describe("EVENT_STORIES", () => {
  it("cobre os quatro eventos do export", () => {
    expect(Object.keys(EVENT_STORIES).sort()).toEqual([
      "eleicoes",
      "invasao-3-poderes",
      "mobilizacao-0709",
      "roberto-jefferson",
    ]);
  });
  it("traz ao menos uma fonte com link http em cada evento", () => {
    for (const story of Object.values(EVENT_STORIES)) {
      expect(story.sources.length).toBeGreaterThan(0);
      for (const source of story.sources) expect(source.url).toMatch(/^https?:\/\//);
    }
  });
});

describe("TIMELINE_MARKS", () => {
  it("marca o primeiro turno e a posse com datas ISO", () => {
    expect(TIMELINE_MARKS).toEqual([
      { date: "2022-10-02", label: "1º turno" },
      { date: "2023-01-01", label: "posse" },
    ]);
  });
});

describe("OMITTED_MEDIA", () => {
  it("explica a omissão da imagem pelo id do tweet", () => {
    expect(OMITTED_MEDIA["1612226342019338240"]).toMatch(/^Imagem omitida/);
  });
});
