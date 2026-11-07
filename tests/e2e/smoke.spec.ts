import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "New note" })).toBeVisible();
  await expect(page.getByLabel("Note title")).toBeVisible();
});

test("notes are saved on this device", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Note title").fill("Weekend ideas");
  await page.getByLabel("Note content").fill("Visit the flower market");
  await page.reload();

  await expect(page.getByLabel("Note title")).toHaveValue("Weekend ideas");
  await expect(page.getByLabel("Note content")).toHaveValue("Visit the flower market");
  await expect(page.getByText("Saved on this device")).toBeVisible();
});

test("notes can be searched and deleted", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Note title").fill("Meeting ideas");
  await page.getByLabel("Note content").fill("Bring the notebook");
  await page.getByRole("button", { name: "New note" }).click();
  await page.getByLabel("Note title").fill("Book list");

  await page.getByLabel("Search notes").fill("meeting");
  await expect(page.getByRole("button", { name: /Meeting ideas/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Book list/ })).toHaveCount(0);
  await page.getByRole("button", { name: /Meeting ideas/ }).click();
  await page.getByRole("button", { name: "Delete note" }).click();
  await page.getByLabel("Search notes").fill("");

  await expect(page.getByLabel("Note title")).toHaveValue("Book list");
  await expect(page.getByRole("button", { name: /Book list/ })).toBeVisible();
});

test("keyboard shortcuts create a note and focus search", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+n");
  await expect(page.getByLabel("Note title")).toHaveValue("");
  await expect(page.locator(".note-count")).toHaveText("2");

  await page.keyboard.press("Control+k");
  await expect(page.getByLabel("Search notes")).toBeFocused();
});

test("health endpoint is ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({ status: "ok" });
});
