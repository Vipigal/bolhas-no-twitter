import { describe, expect, it } from "vitest";
import type { Slot, SlotOrigin } from "../types";
import { buildSlot, buildTweet } from "../test/fixtures";
import { comparePair } from "./compare";

const tweet = buildTweet({ id: "t", url: "" });

function slot(community: number, rank: number, tweetId: string, rt: number, origin: SlotOrigin = "amplified", hydrated = true): Slot {
  return buildSlot({
    community,
    group: community,
    rank,
    origin,
    tweet_id: tweetId,
    rt_cluster: rt,
    rt_graph: rt,
    rt_event: rt,
    purity: 1,
    status: hydrated ? "hydrated" : "not_found",
    tweet: hydrated ? tweet : null,
    author_id: null,
    author: null,
    author_status: null,
  });
}

const slots = [
  slot(0, 1, "x", 90),
  slot(0, 2, "lula", 80),
  slot(0, 3, "gone", 70, "amplified", false),
  slot(0, 4, "y", 60),
  slot(0, 1, "cauda", 5, "characteristic"),
  slot(2, 1, "lula", 95),
  slot(2, 2, "z", 50),
  slot(2, 3, "cauda", 40),
  slot(1, 1, "outro", 99),
];

describe("comparePair", () => {
  const out = comparePair(slots, 0, 2, 2);

  it("lista os tweets que aparecem entre os lidos das duas bolhas, com quantos retuitaram em cada", () => {
    expect(out.both.map((t) => [t.tweet_id, t.rtA, t.rtB])).toEqual([["lula", 80, 95]]);
  });

  it("lista os mais retuitados de cada bolha que não aparecem na outra", () => {
    expect(out.onlyA.map((s) => s.tweet_id)).toEqual(["x", "y"]);
    expect(out.onlyB.map((s) => s.tweet_id)).toEqual(["z"]);
  });

  it("conta os tweets lidos em comum e os de cada bolha", () => {
    expect(out.counts).toEqual({ common: 2, a: 5, b: 3 });
  });
});
