import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { buildEvent } from "../test/fixtures";
import { Timeline } from "./Timeline";

const events = [
  buildEvent({ slug: "primeiro", event_date: "2022-09-07" }),
  buildEvent({ slug: "segundo", event_date: "2022-10-07" }),
  buildEvent({ slug: "terceiro", event_date: "2023-01-08" }),
];

describe("Timeline", () => {
  it("não renderiza nada quando nenhum evento tem data", () => {
    const { container } = render(
      <Timeline events={[buildEvent({ event_date: null })]} selected={0} onSelect={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
  it("cria um botão por evento datado", () => {
    render(<Timeline events={events} selected={0} onSelect={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
  it("não cria botão para evento sem data", () => {
    const withUndated = [...events, buildEvent({ slug: "sem-data", event_date: null })];
    render(<Timeline events={withUndated} selected={0} onSelect={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });
  it("mostra o dia e o mês de cada evento", () => {
    render(<Timeline events={events} selected={0} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "2022-09-07" })).toHaveTextContent("7/9");
    expect(screen.getByRole("button", { name: "2023-01-08" })).toHaveTextContent("8/1");
  });
  it("marca como pressionado só o evento selecionado", () => {
    render(<Timeline events={events} selected={1} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "2022-10-07" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "2022-09-07" })).toHaveAttribute("aria-pressed", "false");
  });
  it("avisa o índice do evento clicado", async () => {
    const onSelect = vi.fn();
    render(<Timeline events={events} selected={0} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "2023-01-08" }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });
  it("informa os dias do primeiro ao último evento", () => {
    render(<Timeline events={events} selected={0} onSelect={vi.fn()} />);
    expect(screen.getByText("Distâncias proporcionais ao tempo: 123 dias do primeiro ao último evento.")).toBeInTheDocument();
  });
  it("mostra as marcas de referência do calendário", () => {
    render(<Timeline events={events} selected={0} onSelect={vi.fn()} />);
    expect(screen.getByText("1º turno")).toBeInTheDocument();
    expect(screen.getByText("posse")).toBeInTheDocument();
  });
  it("descreve o evento conhecido pela data completa no rótulo acessível", () => {
    render(<Timeline events={[buildEvent({ slug: "mobilizacao-0709", event_date: "2022-09-07" })]} selected={0} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Quarta-feira, 7 de setembro de 2022" })).toBeInTheDocument();
  });
});
