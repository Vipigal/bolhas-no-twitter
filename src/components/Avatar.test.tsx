import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("mostra a imagem quando há endereço", () => {
    const { container } = render(<Avatar src="https://example.test/a.jpg" name="Maria Silva" color="#123456" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "https://example.test/a.jpg");
    expect(screen.queryByText("MS")).not.toBeInTheDocument();
  });
  it("mostra as iniciais quando não há imagem", () => {
    render(<Avatar src={null} name="Maria Silva" color="#123456" />);
    expect(screen.getByText("MS")).toBeInTheDocument();
  });
  it("troca a imagem pelas iniciais quando ela falha ao carregar", () => {
    const { container } = render(<Avatar src="https://example.test/a.jpg" name="Maria Silva" color="#123456" />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("MS")).toBeInTheDocument();
  });
  it("usa só as duas primeiras palavras do nome", () => {
    render(<Avatar src={null} name="ana beatriz de souza" color="#123456" />);
    expect(screen.getByText("AB")).toBeInTheDocument();
  });
  it("mostra interrogação quando não há nome", () => {
    render(<Avatar src={null} name={null} color="#123456" />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });
  it("pinta o fundo das iniciais com a cor do grupo", () => {
    render(<Avatar src={null} name="Maria" color="rgb(18, 52, 86)" />);
    expect(screen.getByText("M")).toHaveStyle({ backgroundColor: "rgb(18, 52, 86)" });
  });
  it("aplica o tamanho recebido", () => {
    render(<Avatar src={null} name="Maria" color="#123456" size={64} />);
    expect(screen.getByText("M")).toHaveStyle({ width: "64px", height: "64px" });
  });
});
