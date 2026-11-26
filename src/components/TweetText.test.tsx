import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Segment } from "../lib/entities";
import { TweetText } from "./TweetText";

describe("TweetText", () => {
  it("mostra o texto puro sem transformá-lo em link", () => {
    render(<TweetText segments={[{ kind: "text", text: "bom dia" }]} />);
    expect(screen.getByText("bom dia")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it("renderiza hashtag como link para o destino do segmento", () => {
    const segments: Segment[] = [{ kind: "hashtag", text: "#eleicoes", href: "https://x.com/hashtag/eleicoes" }];
    render(<TweetText segments={segments} />);
    expect(screen.getByRole("link", { name: "#eleicoes" })).toHaveAttribute("href", "https://x.com/hashtag/eleicoes");
  });
  it("abre os links em nova aba sem expor o referenciador", () => {
    render(<TweetText segments={[{ kind: "mention", text: "@fulano", href: "https://x.com/fulano" }]} />);
    const link = screen.getByRole("link", { name: "@fulano" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
  it("mantém a ordem entre texto e links", () => {
    const segments: Segment[] = [
      { kind: "text", text: "veja " },
      { kind: "url", text: "exemplo.com", href: "https://exemplo.com" },
      { kind: "text", text: " agora" },
    ];
    const { container } = render(<TweetText segments={segments} />);
    expect(container).toHaveTextContent("veja exemplo.com agora");
  });
  it("não renderiza nada visível sem segmentos", () => {
    const { container } = render(<TweetText segments={[]} />);
    expect(container.querySelector("p")).toBeEmptyDOMElement();
  });
});
