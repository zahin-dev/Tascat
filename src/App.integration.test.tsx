import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

describe("core task to cat reward flow", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "#/home";
  });

  it("creates a task, enforces subtasks, grants one meal, and does not reward recompletion", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "＋ タスク追加" }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(/タスク名/), "レポートを書く");
    await user.type(within(dialog).getByLabelText("新しいサブタスク"), "下書きを作る");
    await user.click(within(dialog).getAllByRole("button", { name: "追加" })[0]!);
    await user.click(dialog.querySelector<HTMLButtonElement>('button[type="submit"]')!);

    const parentCheckbox = screen.getByRole("checkbox", { name: "レポートを書くを完了する" });
    await user.click(parentCheckbox);
    expect(screen.getByText(/すべてのサブタスクを完了してください。/)).toBeInTheDocument();
    expect(screen.getByTestId("food-count")).toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: /サブタスク 0\/1/ }));
    await user.click(screen.getByRole("checkbox", { name: "下書きを作る" }));
    await user.click(parentCheckbox);
    expect(screen.getByTestId("food-count")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "完了済み（1）" }));
    const reopen = screen.getByRole("checkbox", { name: "レポートを書くを未完了に戻す" });
    await user.click(reopen);
    const recomplete = screen.getByRole("checkbox", { name: "レポートを書くを完了する" });
    await user.click(recomplete);
    expect(screen.getByTestId("food-count")).toHaveTextContent("1");
  });
});
