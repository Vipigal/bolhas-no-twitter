import { expect, test } from "./fixtures";

test("abre um evento pela home e mostra a maior bolha aberta", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: /7 set 2022/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /23 out 2022/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /30 out 2022/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /8 jan 2023/ })).toBeVisible();

  await page.getByRole("button", { name: /7 set 2022/ }).click();
  await page.getByRole("link", { name: "Ver as bolhas deste dia" }).click();

  await expect(page).toHaveURL("/mobilizacao-0709");
  await expect(page.getByRole("heading", { level: 2, name: "Grupo 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Grupo 1 · / })).toHaveAttribute("aria-pressed", "true");
});
