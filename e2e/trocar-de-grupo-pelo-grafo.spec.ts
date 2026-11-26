import { expect, test } from "./fixtures";

test("troca de grupo pelo rótulo do grafo e atualiza o painel", async ({ page }) => {
  await page.goto("/mobilizacao-0709");
  await expect(page.getByRole("heading", { level: 2, name: "Grupo 1" })).toBeVisible();

  await page.getByRole("button", { name: /^Grupo 2 · / }).click();

  await expect(page).toHaveURL("/mobilizacao-0709/1");
  await expect(page.getByRole("heading", { level: 2, name: "Grupo 2" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Grupo 2 · / })).toHaveAttribute("aria-pressed", "true");
});
