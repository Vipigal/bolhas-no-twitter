import { expect, test } from "./fixtures";

test("compara dois grupos pelo painel", async ({ page }) => {
  await page.goto("/mobilizacao-0709");

  await page.getByRole("button", { name: "Grupo 2", exact: true }).click();

  await expect(page).toHaveURL("/mobilizacao-0709/0?comparar=1");
  await expect(page.getByRole("heading", { name: "Só no Grupo 1" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Só no Grupo 2" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nas duas" })).toBeVisible();
});
