import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/render";
import { ErrorBox, Skeleton } from "./States";

describe("ErrorBox", () => {
  it("anuncia o erro como alerta", () => {
    renderWithProviders(<ErrorBox error={new Error("falhou")} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
  it("mostra o título fixo e a mensagem do erro", () => {
    renderWithProviders(<ErrorBox error={new Error("/index.json não encontrado")} />);
    expect(screen.getByText("Não consegui carregar os dados.")).toBeInTheDocument();
    expect(screen.getByText("/index.json não encontrado")).toBeInTheDocument();
  });
});

describe("Skeleton", () => {
  it("fica oculto para leitores de tela", () => {
    const { container } = renderWithProviders(<Skeleton />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("aplica a classe recebida", () => {
    const { container } = renderWithProviders(<Skeleton className="h-10" />);
    expect(container.firstElementChild).toHaveClass("h-10");
  });
});
