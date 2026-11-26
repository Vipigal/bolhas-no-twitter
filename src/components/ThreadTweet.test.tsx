import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Slot, Tweet } from "../types";
import { axisColors } from "../lib/palette";
import { buildAuthor, buildMedia, buildSlot, buildTweet } from "../test/fixtures";
import { ThreadAvatar, ThreadTweet } from "./ThreadTweet";

const colors = axisColors(null);

function tweetSlot(overrides: Partial<Slot> = {}, tweet: Partial<Tweet> = {}): Slot & { tweet: Tweet } {
  const built = buildSlot({ tweet: buildTweet(tweet), ...overrides });
  return { ...built, tweet: built.tweet as Tweet };
}

describe("ThreadTweet", () => {
  it("mostra o nome e o usuário do autor", () => {
    const author = buildAuthor({ name: "Maria Silva", username: "maria" });
    render(<ThreadTweet slot={tweetSlot({ author })} label="1" colors={colors} />);
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText(/@maria/)).toBeInTheDocument();
  });
  it("avisa que o autor está indisponível quando não há autor", () => {
    render(<ThreadTweet slot={tweetSlot({ author: null })} label="1" colors={colors} />);
    expect(screen.getByText("Autor indisponível")).toBeInTheDocument();
  });
  it("mostra o texto do tweet", () => {
    render(<ThreadTweet slot={tweetSlot({}, { text: "texto do tweet" })} label="1" colors={colors} />);
    expect(screen.getByText("texto do tweet")).toBeInTheDocument();
  });
  it("liga a data ao tweet no X", () => {
    render(<ThreadTweet slot={tweetSlot({}, { url: "https://x.com/i/web/status/9" })} label="1" colors={colors} />);
    expect(screen.getByRole("link", { name: /2023/ })).toHaveAttribute("href", "https://x.com/i/web/status/9");
  });
  it("mostra o selo de conta verificada", () => {
    const author = buildAuthor({ verified: true, verified_type: "government" });
    render(<ThreadTweet slot={tweetSlot({ author })} label="1" colors={colors} />);
    expect(screen.getByLabelText("conta verificada")).toBeInTheDocument();
  });
  it("explica o tipo de verificação no selo", () => {
    const author = buildAuthor({ verified: true, verified_type: "business" });
    render(<ThreadTweet slot={tweetSlot({ author })} label="1" colors={colors} />);
    expect(screen.getByTitle("verificado (organização)")).toBeInTheDocument();
  });
  it("não mostra selo para conta não verificada", () => {
    render(<ThreadTweet slot={tweetSlot({ author: buildAuthor({ verified: false }) })} label="1" colors={colors} />);
    expect(screen.queryByLabelText("conta verificada")).not.toBeInTheDocument();
  });
  it("mostra as métricas do tweet com rótulo acessível", () => {
    const metrics = { ...buildTweet().metrics, like_count: 3389, retweet_count: 28348 };
    render(<ThreadTweet slot={tweetSlot({}, { metrics })} label="1" colors={colors} />);
    expect(screen.getByLabelText("3.389 curtidas")).toHaveTextContent("3,4 mil");
    expect(screen.getByLabelText("28.348 retweets")).toHaveTextContent("28,3 mil");
  });
  it("mostra traço nas métricas ausentes", () => {
    render(<ThreadTweet slot={tweetSlot()} label="1" colors={colors} />);
    expect(screen.getByLabelText("— respostas")).toHaveTextContent("—");
  });
  it("mostra a mídia do tweet", () => {
    const media = [buildMedia({ alt_text: "foto do ato" })];
    render(<ThreadTweet slot={tweetSlot({}, { media })} label="1" colors={colors} />);
    expect(screen.getByRole("img", { name: "foto do ato" })).toBeInTheDocument();
  });
  it("troca a mídia pelo aviso quando o tweet tem imagem omitida", () => {
    const media = [buildMedia({ alt_text: "rostos" })];
    render(<ThreadTweet slot={tweetSlot({}, { id: "1612226342019338240", media })} label="1" colors={colors} />);
    expect(screen.getByText("Imagem omitida: reúne rostos de pessoas para identificá-las.")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "rostos" })).not.toBeInTheDocument();
  });
  it("mostra na faixa quantas pessoas e que fração da bolha retuitaram", () => {
    render(<ThreadTweet slot={tweetSlot({ origin: "characteristic", rt_cluster: 1200, purity: 0.75 })} label="1" colors={colors} />);
    expect(screen.getByText("1.200 pessoas desta bolha retuitaram · 75% de quem retuitou é desta bolha")).toBeInTheDocument();
  });
  it("omite a pureza da faixa quando ela não existe", () => {
    render(<ThreadTweet slot={tweetSlot({ origin: "characteristic", rt_cluster: 5, purity: null })} label="1" colors={colors} />);
    expect(screen.getByText("5 pessoas desta bolha retuitaram")).toBeInTheDocument();
  });
  it("cita o rótulo na faixa dos tweets amplificados", () => {
    render(<ThreadTweet slot={tweetSlot({ origin: "amplified", rt_cluster: 5 })} label="3" colors={colors} />);
    expect(screen.getByText("#3 nesta bolha: 5 pessoas desta bolha retuitaram")).toBeInTheDocument();
  });
});

describe("ThreadAvatar", () => {
  it("mostra as iniciais do autor sem foto de perfil", () => {
    render(<ThreadAvatar slot={buildSlot({ author: buildAuthor({ name: "Maria Silva", profile_image_url: null }) })} />);
    expect(screen.getByText("MS")).toBeInTheDocument();
  });
  it("mostra interrogação quando o autor está indisponível", () => {
    render(<ThreadAvatar slot={buildSlot({ author: null })} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
