import { describe, expect, it } from "vitest";
import { createInitialState } from "./state";
import {
  createTask,
  editTask,
  setTaskCompletion,
  sortTasks,
  validateTaskDraft,
} from "./tasks";
import type { AppState, Task, TaskDraft } from "./types";

const NOW = "2026-08-31T00:00:00.000Z";

function draft(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
    title: "読書",
    memo: "",
    dueDate: null,
    dueTime: null,
    priority: null,
    category: null,
    recurrence: "none",
    subtasks: [],
    ...overrides,
  };
}

function task(overrides: Partial<Task> = {}): Task {
  return {
    ...createTask(draft(), { id: "task-1", seriesId: null, nowIso: NOW }),
    ...overrides,
  };
}

function withTask(value: Task): AppState {
  return { ...createInitialState(), tasks: [value] };
}

describe("task validation and editing", () => {
  it("rejects empty and overlong fields", () => {
    expect(validateTaskDraft(draft({ title: "   " })).title).toBeTruthy();
    expect(validateTaskDraft(draft({ title: "a".repeat(121) })).title).toBeTruthy();
    expect(validateTaskDraft(draft({ memo: "a".repeat(2001) })).memo).toBeTruthy();
  });

  it("requires a date for recurring tasks and clears time without a date", () => {
    expect(validateTaskDraft(draft({ recurrence: "daily" })).dueDate).toBeTruthy();
    const created = createTask(draft({ dueTime: "09:00" }), {
      id: "task-1",
      seriesId: null,
      nowIso: NOW,
    });
    expect(created.dueTime).toBeNull();
  });

  it("edits every user field without resetting earned reward", () => {
    const current = { ...task(), rewardClaimed: true };
    const edited = editTask(
      current,
      draft({
        title: "更新",
        memo: "メモ",
        dueDate: "2026-09-30",
        dueTime: "08:30",
        recurrence: "monthly",
        priority: "high",
        category: "work",
      }),
      "2026-08-31T01:00:00.000Z",
      "series-1",
    );
    expect(edited).toMatchObject({
      title: "更新",
      memo: "メモ",
      dueDate: "2026-09-30",
      dueTime: "08:30",
      recurrence: "monthly",
      recurrenceAnchorDay: 30,
      seriesId: "series-1",
      priority: "high",
      category: "work",
      rewardClaimed: true,
    });
  });
});

describe("completion and one-task-one-meal invariant", () => {
  it("blocks a parent while any subtask is incomplete", () => {
    const current = task({
      subtasks: [{ id: "sub-1", title: "下書き", completed: false }],
    });
    const result = setTaskCompletion(withTask(current), {
      taskId: current.id,
      completed: true,
      nowIso: NOW,
      nextTaskId: "next-1",
    });
    expect(result.tasks[0]?.completed).toBe(false);
    expect(result.foodCount).toBe(0);
    expect(result.notice?.kind).toBe("blocked");
  });

  it("grants exactly one meal across reopen and recompletion", () => {
    const current = task();
    const completed = setTaskCompletion(withTask(current), {
      taskId: current.id,
      completed: true,
      nowIso: NOW,
      nextTaskId: "next-1",
    });
    expect(completed.foodCount).toBe(1);
    expect(completed.tasks[0]?.rewardClaimed).toBe(true);

    const reopened = setTaskCompletion(completed, {
      taskId: current.id,
      completed: false,
      nowIso: NOW,
      nextTaskId: "unused",
    });
    const recompleted = setTaskCompletion(reopened, {
      taskId: current.id,
      completed: true,
      nowIso: NOW,
      nextTaskId: "unused-2",
    });
    expect(recompleted.foodCount).toBe(1);
    expect(recompleted.tasks[0]?.completed).toBe(true);
  });
});

describe("recurrence generation", () => {
  it("generates a daily occurrence once and keeps it through reopen", () => {
    const recurring = createTask(draft({ dueDate: "2026-09-01", recurrence: "daily" }), {
      id: "task-1",
      seriesId: "series-1",
      nowIso: NOW,
    });
    const first = setTaskCompletion(withTask(recurring), {
      taskId: recurring.id,
      completed: true,
      nowIso: NOW,
      nextTaskId: "task-2",
    });
    expect(first.tasks).toHaveLength(2);
    expect(first.tasks[1]).toMatchObject({ dueDate: "2026-09-02", generatedFromId: "task-1" });

    const reopened = setTaskCompletion(first, {
      taskId: recurring.id,
      completed: false,
      nowIso: NOW,
      nextTaskId: "unused",
    });
    const second = setTaskCompletion(reopened, {
      taskId: recurring.id,
      completed: true,
      nowIso: NOW,
      nextTaskId: "task-duplicate",
    });
    expect(second.tasks).toHaveLength(2);
    expect(second.tasks.some((item) => item.id === "task-duplicate")).toBe(false);
  });

  it("uses generatedFromId as a second duplicate guard", () => {
    const recurring = createTask(draft({ dueDate: "2026-09-01", recurrence: "weekly" }), {
      id: "task-1",
      seriesId: "series-1",
      nowIso: NOW,
    });
    const existing = { ...recurring, id: "task-2", dueDate: "2026-09-08", generatedFromId: "task-1" };
    const result = setTaskCompletion({ ...createInitialState(), tasks: [recurring, existing] }, {
      taskId: recurring.id,
      completed: true,
      nowIso: NOW,
      nextTaskId: "task-duplicate",
    });
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0]?.nextOccurrenceId).toBe("task-2");
  });

  it("preserves a monthly anchor through a shorter month", () => {
    const january = createTask(draft({ dueDate: "2027-01-31", recurrence: "monthly" }), {
      id: "jan",
      seriesId: "series-1",
      nowIso: NOW,
    });
    const februaryState = setTaskCompletion(withTask(january), {
      taskId: "jan",
      completed: true,
      nowIso: NOW,
      nextTaskId: "feb",
    });
    expect(februaryState.tasks[1]?.dueDate).toBe("2027-02-28");
    const marchState = setTaskCompletion(februaryState, {
      taskId: "feb",
      completed: true,
      nowIso: NOW,
      nextTaskId: "mar",
    });
    expect(marchState.tasks[2]?.dueDate).toBe("2027-03-31");
  });
});

describe("sorting", () => {
  it("sorts priorities with a stable creation fallback", () => {
    const tasks = [
      { ...task(), id: "low", priority: "low" as const, createdAt: "2026-01-01T00:00:00.000Z" },
      { ...task(), id: "none", priority: null, createdAt: "2025-01-01T00:00:00.000Z" },
      { ...task(), id: "high", priority: "high" as const, createdAt: "2026-02-01T00:00:00.000Z" },
      { ...task(), id: "medium", priority: "medium" as const, createdAt: "2026-03-01T00:00:00.000Z" },
    ];
    expect(sortTasks(tasks, "priority").map((item) => item.id)).toEqual(["high", "medium", "low", "none"]);
    expect(sortTasks(tasks, "created")[0]?.id).toBe("none");
  });
});
