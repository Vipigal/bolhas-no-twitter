import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Slot } from "../types";
import { axisColors } from "../lib/palette";
import { buildSlot, buildTweet } from "../test/fixtures";
import { TweetThread } from "./TweetThread";

const colors = axisColors(null);

function slotAt(rank: number, overrides: Partial<Slot> = {}): Slot {
  const id = String(1000 + rank);
  return buildSlot({ rank, tweet: buildTweet({ id, text: `tweet ${rank}` }), ...overrides });
}

function slotsUpTo(total: number): Slot[] {
  return Array.from({ length: total }, (_, i) => slotAt(i + 1));
}

function renderThread(slots: Slot[], props: Partial<Parameters<typeof TweetThread>[0]> = {}) {
  return render(
    <TweetThread slots={slots} community={1} origin="amplified" onOrigin={vi.fn()} colors={colors} focus={null} {...props} />,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("TweetThread", () => {
  it("lista os tweets da bolha na ordem do ranking", () => {
    renderThread([slotAt(2), slotAt(1), slotAt(3)]);
    const texts = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(texts[0]).toContain("tweet 1");
    expect(texts[1]).toContain("tweet 2");
    expect(texts[2]).toContain("tweet 3");
  });
  it("ignora tweets de outra bolha", () => {
    renderThread([slotAt(1), slotAt(2, { community: 2 })]);
    expect(screen.queryByText("tweet 2")).not.toBeInTheDocument();
  });
  it("mostra só os tweets da origem escolhida", () => {
    renderThread([slotAt(1), slotAt(1, { origin: "characteristic", tweet: buildTweet({ id: "2", text: "característico" }) })], {
      origin: "characteristic",
    });
    expect(screen.getByText("característico")).toBeInTheDocument();
    expect(screen.queryByText("tweet 1")).not.toBeInTheDocument();
  });
  it("avisa quando a bolha não tem tweets na lista", () => {
    renderThread([]);
    expect(screen.getByText("Esta bolha não tem tweets nesta lista.")).toBeInTheDocument();
  });
  it("junta posições indisponíveis seguidas num aviso só", () => {
    const missing = (rank: number) => slotAt(rank, { status: "not_found", tweet: null, author: null });
    renderThread([slotAt(1), missing(2), missing(3), slotAt(4)]);
    expect(screen.getByText("As posições 2 e 3 foram apagadas ou vêm de contas suspensas.")).toBeInTheDocument();
  });
  it("marca a aba da origem atual como selecionada", () => {
    renderThread(slotsUpTo(1), { origin: "characteristic" });
    expect(screen.getByRole("tab", { name: "Característicos" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Mais retuitados" })).toHaveAttribute("aria-selected", "false");
  });
  it("avisa a origem escolhida ao clicar na aba", async () => {
    const onOrigin = vi.fn();
    renderThread(slotsUpTo(1), { onOrigin });
    await userEvent.click(screen.getByRole("tab", { name: "Característicos" }));
    expect(onOrigin).toHaveBeenCalledWith("characteristic");
  });
  it("explica a ordenação da origem atual", () => {
    renderThread(slotsUpTo(1), { origin: "amplified" });
    expect(screen.getByText("Do mais retuitado para o menos, entre as pessoas desta bolha.")).toBeInTheDocument();
  });
});

describe("TweetThread, paginação", () => {
  it("mostra os 20 primeiros tweets", () => {
    renderThread(slotsUpTo(45));
    expect(screen.getByText("tweet 20")).toBeInTheDocument();
    expect(screen.queryByText("tweet 21")).not.toBeInTheDocument();
  });
  it("não oferece mostrar mais quando todos cabem na página", () => {
    renderThread(slotsUpTo(20));
    expect(screen.queryByRole("button", { name: /Mostrar mais/ })).not.toBeInTheDocument();
  });
  it("oferece mostrar mais 20 enquanto restam tweets", () => {
    renderThread(slotsUpTo(45));
    expect(screen.getByRole("button", { name: "Mostrar mais 20" })).toBeInTheDocument();
  });
  it("revela os próximos 20 tweets ao clicar em mostrar mais", async () => {
    renderThread(slotsUpTo(45));
    await userEvent.click(screen.getByRole("button", { name: "Mostrar mais 20" }));
    expect(screen.getByText("tweet 40")).toBeInTheDocument();
    expect(screen.queryByText("tweet 41")).not.toBeInTheDocument();
  });
  it("oferece só o que resta na última página", async () => {
    renderThread(slotsUpTo(45));
    await userEvent.click(screen.getByRole("button", { name: "Mostrar mais 20" }));
    await userEvent.click(screen.getByRole("button", { name: "Mostrar mais 5" }));
    expect(screen.getByText("tweet 45")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mostrar mais/ })).not.toBeInTheDocument();
  });
  it("volta para a primeira página ao trocar de bolha", async () => {
    const { rerender } = renderThread(slotsUpTo(45));
    await userEvent.click(screen.getByRole("button", { name: "Mostrar mais 20" }));
    const other = slotsUpTo(45).map((s) => ({ ...s, community: 2 }));
    rerender(<TweetThread slots={other} community={2} origin="amplified" onOrigin={vi.fn()} colors={colors} focus={null} />);
    expect(screen.queryByText("tweet 21")).not.toBeInTheDocument();
  });
});

describe("TweetThread, foco numa citação", () => {
  const focusOn = (rank: number) => ({ tweetId: String(1000 + rank), seq: 1 });
  const tweetItem = (rank: number) => screen.getByText(`tweet ${rank}`).closest("li") as HTMLElement;

  it("centraliza o tweet citado na tela", () => {
    renderThread(slotsUpTo(5), { focus: focusOn(3) });
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "center" });
  });
  it("destaca o tweet citado", () => {
    renderThread(slotsUpTo(5), { focus: focusOn(3) });
    expect(tweetItem(3)).toHaveClass("cite-flash");
  });
  it("não destaca os outros tweets", () => {
    renderThread(slotsUpTo(5), { focus: focusOn(3) });
    expect(tweetItem(2)).not.toHaveClass("cite-flash");
  });
  it("mantém o destaque antes de 1,6 segundo", () => {
    vi.useFakeTimers();
    renderThread(slotsUpTo(5), { focus: focusOn(3) });
    act(() => void vi.advanceTimersByTime(1599));
    expect(tweetItem(3)).toHaveClass("cite-flash");
  });
  it("tira o destaque depois de 1,6 segundo", () => {
    vi.useFakeTimers();
    renderThread(slotsUpTo(5), { focus: focusOn(3) });
    act(() => void vi.advanceTimersByTime(1600));
    expect(tweetItem(3)).not.toHaveClass("cite-flash");
  });
  it("centraliza de novo enquanto a página assenta", () => {
    vi.useFakeTimers();
    renderThread(slotsUpTo(5), { focus: focusOn(3) });
    act(() => void vi.advanceTimersByTime(1200));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(4);
  });
  it("abre mais tweets para alcançar uma citação fora da primeira página", () => {
    renderThread(slotsUpTo(45), { focus: focusOn(30) });
    expect(tweetItem(30)).toHaveClass("cite-flash");
  });
  it("não rola nem destaca quando o tweet citado não está na lista", () => {
    renderThread(slotsUpTo(5), { focus: { tweetId: "999999", seq: 1 } });
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
