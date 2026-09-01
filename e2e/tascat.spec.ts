import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function resetApp(page: Page) {
  await page.goto("/#/home");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function addTask(
  page: Page,
  title: string,
  options: { subtask?: string; recurrence?: "daily" | "weekly" | "monthly" } = {},
) {
  await page.getByRole("button", { name: "＋ タスク追加" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/タスク名/).fill(title);
  if (options.subtask) {
    await dialog.getByLabel("新しいサブタスク").fill(options.subtask);
    await dialog.getByRole("button", { name: "追加" }).first().click();
  }
  if (options.recurrence) await dialog.getByLabel("繰り返し").selectOption(options.recurrence);
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toBeHidden();
}

test.beforeEach(async ({ page }) => resetApp(page));

test("@smoke E2E-1/11/12: task create, edit, and confirmed delete", async ({ page }) => {
  await addTask(page, "レポートを書く");
  const item = page.locator(".task-item").filter({ hasText: "レポートを書く" });
  await expect(item).toBeVisible();

  await item.getByRole("button", { name: "編集" }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByLabel(/タスク名/).fill("レポートを提出する");
  await editDialog.getByLabel(/メモ/).fill("最終確認をしてから提出");
  await editDialog.getByLabel(/優先度/).selectOption("high");
  await editDialog.getByLabel(/カテゴリ/).selectOption("work");
  await editDialog.getByRole("button", { name: "今日" }).click();
  await editDialog.getByRole("button", { name: "保存" }).click();
  const edited = page.locator(".task-item").filter({ hasText: "レポートを提出する" });
  await expect(edited).toContainText("優先度 ↑ 高");
  await expect(edited).toContainText("仕事");

  await edited.getByRole("button", { name: "削除" }).click();
  const confirm = page.getByRole("dialog");
  await expect(confirm).toContainText("獲得済みまたは使用済みのごはんは変わりません");
  await confirm.getByRole("button", { name: "削除する" }).click();
  await expect(edited).toHaveCount(0);
});

test("E2E-2/3/4/5/6/7: subtask gate, one meal, reopen, and cat eating", async ({ page }) => {
  await addTask(page, "課題を終える", { subtask: "設問に答える" });
  const parent = page.getByRole("checkbox", { name: "課題を終えるを完了する" });
  await parent.click();
  await expect(page.locator(".task-blocked")).toContainText("すべてのサブタスクを完了してください。");
  await expect(page.getByTestId("food-count")).toHaveText("0");

  await page.getByRole("button", { name: /サブタスク 0\/1/ }).click();
  await page.getByRole("checkbox", { name: "設問に答える" }).check();
  await parent.click();
  await expect(page.getByTestId("food-count")).toHaveText("1");

  await page.getByRole("button", { name: "完了済み（1）" }).click();
  await page.getByRole("checkbox", { name: "課題を終えるを未完了に戻す" }).click();
  await page.getByRole("checkbox", { name: "課題を終えるを完了する" }).click();
  await expect(page.getByTestId("food-count")).toHaveText("1");

  await page.getByRole("button", { name: "ごはんをあげる" }).click();
  await expect(page.getByTestId("food-count")).toHaveText("0");
  await expect(page.locator('[data-cat-animation="eat"]')).toBeVisible();
  await expect(page.locator('[data-cat-animation="idle"]')).toBeVisible({ timeout: 2_000 });
  await expect(page.getByRole("button", { name: "ごはんがありません" })).toBeDisabled();
});

test("E2E-8/9: recurring completion generates one next occurrence", async ({ page }) => {
  await addTask(page, "毎日の読書", { recurrence: "daily" });
  await page.getByRole("checkbox", { name: "毎日の読書を完了する" }).click();
  await expect(page.getByRole("checkbox", { name: "毎日の読書を完了する" })).toBeVisible();
  await page.getByRole("button", { name: "完了済み（1）" }).click();
  await page.getByRole("checkbox", { name: "毎日の読書を未完了に戻す" }).click();

  const activeItems = page.locator(".active-task-region .task-item");
  await expect(activeItems).toHaveCount(2);
  await activeItems.first().getByRole("checkbox").click();

  await expect.poll(async () => page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem("tascat.app-state.v1") ?? "{}") as {
      tasks?: Array<{ generatedFromId: string | null }>;
    };
    return {
      total: value.tasks?.length ?? 0,
      generated: value.tasks?.filter((task) => task.generatedFromId !== null).length ?? 0,
    };
  })).toEqual({ total: 2, generated: 1 });
});

test("localStorage keeps completed tasks and food across reload", async ({ page }) => {
  await addTask(page, "再読み込み後も残るタスク");
  await page.getByRole("checkbox", { name: "再読み込み後も残るタスクを完了する" }).click();
  await expect(page.getByTestId("food-count")).toHaveText("1");

  await page.reload();
  await expect(page.getByTestId("food-count")).toHaveText("1");
  await page.getByRole("button", { name: "完了済み（1）" }).click();
  await expect(page.getByText("再読み込み後も残るタスク", { exact: true })).toBeVisible();
});

test("E2E-10: calendar date pre-fills a new task", async ({ page }) => {
  await page.getByRole("link", { name: "カレンダー" }).click();
  const targetDay = page.getByRole("button", { name: /15日、未完了0件、完了0件/ }).first();
  await targetDay.click();
  const selectedLabel = await targetDay.getAttribute("aria-label");
  await page.getByRole("button", { name: "＋ この日に追加" }).click();
  const dialog = page.getByRole("dialog");
  const dateValue = await dialog.getByLabel("日付").inputValue();
  expect(Number(dateValue.slice(-2))).toBe(15);
  await dialog.getByLabel(/タスク名/).fill("カレンダーから作成");
  await dialog.locator('button[type="submit"]').click();
  await expect(page.locator(".day-panel")).toContainText("カレンダーから作成");
  expect(selectedLabel).toContain("15日");
});

test("E2E-13: pomodoro start, pause, resume, and reset", async ({ page }) => {
  await page.getByRole("link", { name: "ポモドーロ" }).click();
  await expect(page.getByRole("timer")).toHaveText("25:00");
  await page.getByRole("button", { name: "開始" }).click();
  await expect(page.getByText("進行中")).toBeVisible();
  await page.waitForTimeout(1_100);
  await page.getByRole("button", { name: "一時停止" }).click();
  const paused = await page.getByRole("timer").textContent();
  await expect(page.getByText("一時停止中")).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.getByRole("timer")).toHaveText(paused ?? "");
  await page.getByRole("button", { name: "再開" }).click();
  await expect(page.getByText("進行中")).toBeVisible();
  await page.getByRole("button", { name: "リセット" }).click();
  await expect(page.getByRole("timer")).toHaveText("25:00");
});

test("dialog keyboard behavior and settings data reset", async ({ page }) => {
  await addTask(page, "削除前のタスク");
  const addButton = page.getByRole("button", { name: "＋ タスク追加" });
  await addButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(addButton).toBeFocused();

  await page.getByRole("link", { name: /設定/ }).click();
  await page.getByRole("button", { name: "全データを削除" }).click();
  const confirm = page.getByRole("dialog");
  await page.keyboard.press("Escape");
  await expect(confirm).toBeHidden();
  await page.getByRole("button", { name: "全データを削除" }).click();
  await confirm.getByRole("button", { name: "すべて削除する" }).click();
  await expect.poll(async () => page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem("tascat.app-state.v1") ?? "{}") as {
      tasks?: unknown[];
      foodCount?: number;
    };
    return { tasks: value.tasks?.length ?? -1, foodCount: value.foodCount };
  })).toEqual({ tasks: 0, foodCount: 0 });
});

test("accessibility, 1920/1280 layout, mobile reflow, and pixel sprite", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/#/home");
  const brandMark = page.locator(".brand-mark");
  await expect(brandMark).toBeVisible();
  await expect(brandMark).toHaveAttribute("src", "/brand/tascat-icon.svg");
  const manifestResponse = await page.request.get("/site.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json() as {
    icons: Array<{ src: string; sizes: string }>;
  };
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({ src: "/brand/tascat-icon-192.png", sizes: "192x192" }),
    expect.objectContaining({ src: "/brand/tascat-icon-512.png", sizes: "512x512" }),
  ]));
  expect((await page.request.get("/favicon.ico")).ok()).toBe(true);
  expect((await page.request.get("/assets/processed/cat/aichan-idle-eat.png")).ok()).toBe(true);
  const desktopVisual = await page.evaluate(() => {
    const catHeight = document.querySelector(".cat-panel")?.getBoundingClientRect().height ?? 0;
    const taskHeight = document.querySelector(".task-panel")?.getBoundingClientRect().height ?? 0;
    const total = catHeight + taskHeight;
    const sprite = document.querySelector(".cat-sprite-viewport")?.getBoundingClientRect();
    return {
      rootFont: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      catRatio: total === 0 ? 0 : catHeight / total,
      sprite: sprite?.width ?? 0,
      x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    };
  });
  expect(desktopVisual.rootFont).toBe(17.5);
  expect(desktopVisual.catRatio).toBeCloseTo(0.65, 2);
  expect(desktopVisual.sprite).toBe(192);
  expect({ x: desktopVisual.x, y: desktopVisual.y }).toEqual({ x: 0, y: 0 });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/home");
  for (let index = 1; index <= 5; index += 1) {
    await addTask(page, `表示確認タスク${index.toString()}`);
  }
  await expect(page.locator(".active-task-region .task-item")).toHaveCount(2);
  await expect(page.getByText("1 / 3")).toBeVisible();
  await expect(page.getByTestId("cat-room")).toBeVisible();
  await expect(page.locator(".room-pet-bed")).toHaveCSS("background-image", /pet-bed\.png/);
  await expect(page.locator(".room-pet-tower")).toHaveCSS("background-image", /pet-tower\.png/);
  await expect(page.locator(".forest-tree-large")).toHaveCSS("background-image", /tree-large\.png/);
  const roomBackground = await page.getByTestId("cat-room").evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(roomBackground).not.toContain("repeating-linear-gradient");
  await expect(page.locator(".food-count")).toHaveAttribute("aria-label", "ごはんの所持数 0食");
  const desktopOverflow = await page.evaluate(() => ({
    x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
  }));
  expect(desktopOverflow).toEqual({ x: 0, y: 0 });

  const sprite = page.locator(".cat-sprite");
  const spriteData = await sprite.evaluate((element) => {
    const viewport = element.parentElement?.getBoundingClientRect();
    return {
      backgroundImage: getComputedStyle(element).backgroundImage,
      imageRendering: getComputedStyle(element).imageRendering,
      width: viewport?.width,
      height: viewport?.height,
    };
  });
  expect(spriteData.backgroundImage).toContain("aichan-idle-eat.png");
  expect(["pixelated", "crisp-edges"]).toContain(spriteData.imageRendering);
  expect(spriteData.width).toBe(160);
  expect(spriteData.height).toBe(160);

  const addButton = page.getByRole("button", { name: "＋ タスク追加" });
  await addButton.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(addButton).toBeFocused();
  const focusStyle = await addButton.evaluate((element) => ({
    style: getComputedStyle(element).outlineStyle,
    width: Number.parseFloat(getComputedStyle(element).outlineWidth),
  }));
  expect(focusStyle.style).toBe("solid");
  expect(focusStyle.width).toBeGreaterThanOrEqual(2);

  for (const route of ["home", "calendar", "pomodoro", "settings"]) {
    if (route !== "home") await page.goto(`/#/${route}`);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const severe = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(severe, `${route} must have no serious or critical axe violations`).toEqual([]);
  }

  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/#/home");
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(mobileOverflow).toBe(0);
});
