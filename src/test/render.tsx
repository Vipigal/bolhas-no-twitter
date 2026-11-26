import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "../App";

export interface RenderWithProvidersOptions {
  route?: string;
  path?: string;
}

export interface RenderWithProvidersResult extends RenderResult {
  user: UserEvent;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/", path }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const content = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  );
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>{content}</ThemeProvider>
    </MemoryRouter>,
  );
  return { ...result, user: userEvent.setup() };
}
