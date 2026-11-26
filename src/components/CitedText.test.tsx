import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CitedText } from "./CitedText";

const labels = new Map([
  ["111", "1"],
  ["222", "C2"],
]);

describe("CitedText", () => {
  it("mostra o texto sem citações como está", () => {
    render(<CitedText text="Sem citação aqui." labels={labels} onCite={vi.fn()} />);
    expect(screen.getByText("Sem citação aqui.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it("troca a citação pelo rótulo do tweet", () => {
    render(<CitedText text="Fala sobre urnas [111]." labels={labels} onCite={vi.fn()} />);
    expect(screen.getByRole("link", { name: "1" })).toBeInTheDocument();
  });
  it("aponta o link da citação para o tweet no X", () => {
    render(<CitedText text="[111]" labels={labels} onCite={vi.fn()} />);
    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("href", "https://x.com/i/web/status/111");
  });
  it("avisa o id do tweet ao clicar na citação", async () => {
    const onCite = vi.fn();
    render(<CitedText text="[222]" labels={labels} onCite={onCite} />);
    await userEvent.click(screen.getByRole("link", { name: "C2" }));
    expect(onCite).toHaveBeenCalledWith("222");
  });
  it("cria um link por id quando a citação junta vários tweets", () => {
    render(<CitedText text="[111, 222]" labels={labels} onCite={vi.fn()} />);
    expect(screen.getAllByRole("link").map((l) => l.textContent)).toEqual(["1", "C2"]);
  });
  it("marca com interrogação o tweet que não está nos rótulos", () => {
    render(<CitedText text="[999]" labels={labels} onCite={vi.fn()} />);
    expect(screen.getByText("?")).toHaveAttribute("title", "tweet indisponível ou fora dos tweets lidos desta bolha");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
