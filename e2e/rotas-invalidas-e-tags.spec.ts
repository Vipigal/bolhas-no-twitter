import { expect, test } from "./fixtures";

test("slug inválido volta para a home", async ({ page }) => {
  await page.goto("/evento-que-nao-existe");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1, name: "Um mesmo fato, duas realidades" })).toBeVisible();
});

test("community inválida abre a primeira bolha", async ({ page }) => {
  await page.goto("/mobilizacao-0709/99");

  await expect(page.getByRole("heading", { level: 2, name: "Grupo 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Grupo 1 · / })).toHaveAttribute("aria-pressed", "true");
});

test("?tags=0 oculta a inclinação", async ({ page }) => {
  await page.goto("/mobilizacao-0709");
  await expect(page.getByText("Esquerda", { exact: true })).toBeVisible();

  await page.goto("/mobilizacao-0709?tags=0");
  await expect(page.getByRole("heading", { level: 2, name: "Grupo 1" })).toBeVisible();
  await expect(page.getByText("Esquerda", { exact: true })).toHaveCount(0);
});

test("?tags=0 se mantém ao navegar para outro grupo", async ({ page }) => {
  await page.goto("/mobilizacao-0709/1");
  await expect(page.getByText("Direita", { exact: true })).toBeVisible();

  await page.goto("/mobilizacao-0709?tags=0");
  await page.getByRole("button", { name: /^Grupo 2 · / }).click();

  await expect(page).toHaveURL("/mobilizacao-0709/1?tags=0");
  await expect(page.getByRole("heading", { level: 2, name: "Grupo 2" })).toBeVisible();
  await expect(page.getByText("Direita", { exact: true })).toHaveCount(0);
});
