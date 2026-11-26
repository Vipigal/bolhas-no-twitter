import { expect, test } from "./fixtures";

test("o tema claro continua depois de recarregar a página", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "usar tema claro" }).click();
  await expect(page.getByRole("button", { name: "usar tema escuro" })).toBeVisible();

  await page.reload();

  await expect(page.getByRole("button", { name: "usar tema escuro" })).toBeVisible();
  await expect(page.getByRole("button", { name: "usar tema claro" })).toHaveCount(0);
});
