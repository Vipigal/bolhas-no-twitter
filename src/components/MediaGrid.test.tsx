import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { buildMedia } from "../test/fixtures";
import { MediaGrid } from "./MediaGrid";

const TWEET_URL = "https://x.com/i/web/status/1";

describe("MediaGrid", () => {
  it("não renderiza nada sem mídia", () => {
    const { container } = render(<MediaGrid media={[]} tweetUrl={TWEET_URL} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("mostra a foto com o texto alternativo", () => {
    render(<MediaGrid media={[buildMedia({ alt_text: "uma praça cheia" })]} tweetUrl={TWEET_URL} />);
    expect(screen.getByRole("img", { name: "uma praça cheia" })).toHaveAttribute("src", "https://example.test/foto.jpg");
  });
  it("mostra no máximo quatro mídias", () => {
    const media = [1, 2, 3, 4, 5].map((n) => buildMedia({ media_key: `m${n}`, alt_text: `foto ${n}` }));
    render(<MediaGrid media={media} tweetUrl={TWEET_URL} />);
    expect(screen.getAllByRole("img")).toHaveLength(4);
    expect(screen.queryByRole("img", { name: "foto 5" })).not.toBeInTheDocument();
  });
  it("usa a miniatura do vídeo como link para o tweet", () => {
    const video = buildMedia({ type: "video", url: null, preview_image_url: "https://example.test/mini.jpg", alt_text: "debate" });
    render(<MediaGrid media={[video]} tweetUrl={TWEET_URL} />);
    expect(screen.getByRole("link", { name: "debate" })).toHaveAttribute("href", TWEET_URL);
    expect(screen.getByRole("img", { name: "debate" })).toHaveAttribute("src", "https://example.test/mini.jpg");
  });
  it("identifica o GIF animado", () => {
    const gif = buildMedia({ type: "animated_gif", url: null, preview_image_url: "https://example.test/g.jpg" });
    render(<MediaGrid media={[gif]} tweetUrl={TWEET_URL} />);
    expect(screen.getByText("GIF")).toBeInTheDocument();
  });
  it("não identifica como GIF um vídeo comum", () => {
    const video = buildMedia({ type: "video", url: null, preview_image_url: "https://example.test/mini.jpg" });
    render(<MediaGrid media={[video]} tweetUrl={TWEET_URL} />);
    expect(screen.queryByText("GIF")).not.toBeInTheDocument();
  });
  it("oferece abrir no X quando a mídia não tem endereço de imagem", () => {
    render(<MediaGrid media={[buildMedia({ url: null, preview_image_url: null })]} tweetUrl={TWEET_URL} />);
    expect(screen.getByRole("link", { name: "mídia indisponível · abrir no X" })).toHaveAttribute("href", TWEET_URL);
  });
  it("oferece abrir no X quando a imagem falha ao carregar", () => {
    render(<MediaGrid media={[buildMedia({ alt_text: "praça" })]} tweetUrl={TWEET_URL} />);
    fireEvent.error(screen.getByRole("img", { name: "praça" }));
    expect(screen.getByRole("link", { name: "mídia indisponível · abrir no X" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
