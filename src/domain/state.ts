import { SCHEMA_VERSION, createInitialPomodoro } from "./constants";
import { editTask, setTaskCompletion, updateSubtask } from "./tasks";
import { pausePomodoro, resetPomodoro, startPomodoro, tickPomodoro } from "./pomodoro";
import type { AppState, PersistedAppState, Task, TaskDraft } from "./types";

export function createInitialState(storageIssue: AppState["storageIssue"] = null): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    tasks: [],
    foodCount: 0,
    pomodoro: createInitialPomodoro(),
    notice: null,
    storageIssue,
  };
}

export function toPersistedState(state: AppState): PersistedAppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    tasks: state.tasks,
    foodCount: state.foodCount,
    pomodoro: state.pomodoro,
  };
}

export type AppAction =
  | { type: "task/add"; task: Task }
  | { type: "task/edit"; taskId: string; draft: TaskDraft; nowIso: string; seriesId: string }
  | { type: "task/delete"; taskId: string }
  | {
      type: "task/subtask";
      taskId: string;
      subtaskId: string;
      completed: boolean;
      nowIso: string;
    }
  | {
      type: "task/completion";
      taskId: string;
      completed: boolean;
      nowIso: string;
      nextTaskId: string;
    }
  | { type: "food/consume" }
  | { type: "pomodoro/start"; nowMs: number }
  | { type: "pomodoro/pause"; nowMs: number }
  | { type: "pomodoro/tick"; nowMs: number }
  | { type: "pomodoro/reset" }
  | { type: "notice/clear" }
  | { type: "storage/failed" }
  | { type: "storage/hydrate"; state: PersistedAppState }
  | { type: "reset" };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "task/add":
      return {
        ...state,
        tasks: [...state.tasks, action.task],
        notice: { kind: "success", message: "タスクを追加しました。", taskId: action.task.id },
      };
    case "task/edit": {
      const index = state.tasks.findIndex((task) => task.id === action.taskId);
      const current = state.tasks[index];
      if (index < 0 || !current) {
        return { ...state, notice: { kind: "error", message: "タスクが見つかりませんでした。" } };
      }
      const tasks = [...state.tasks];
      tasks[index] = editTask(current, action.draft, action.nowIso, action.seriesId);
      return {
        ...state,
        tasks,
        notice: { kind: "success", message: "タスクを更新しました。", taskId: action.taskId },
      };
    }
    case "task/delete":
      if (!state.tasks.some((task) => task.id === action.taskId)) {
        return { ...state, notice: { kind: "error", message: "タスクが見つかりませんでした。" } };
      }
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.taskId),
        notice: { kind: "info", message: "タスクを削除しました。" },
      };
    case "task/subtask": {
      const index = state.tasks.findIndex((task) => task.id === action.taskId);
      const current = state.tasks[index];
      if (index < 0 || !current) return state;
      const updated = updateSubtask(current, action.subtaskId, action.completed, action.nowIso);
      if (updated === current) return state;
      const tasks = [...state.tasks];
      tasks[index] = updated;
      return { ...state, tasks, notice: null };
    }
    case "task/completion":
      return setTaskCompletion(state, {
        taskId: action.taskId,
        completed: action.completed,
        nowIso: action.nowIso,
        nextTaskId: action.nextTaskId,
      });
    case "food/consume":
      if (state.foodCount <= 0) return state;
      return {
        ...state,
        foodCount: state.foodCount - 1,
        notice: { kind: "info", message: "猫にごはんをあげました。" },
      };
    case "pomodoro/start":
      return { ...state, pomodoro: startPomodoro(state.pomodoro, action.nowMs), notice: null };
    case "pomodoro/pause":
      return { ...state, pomodoro: pausePomodoro(state.pomodoro, action.nowMs) };
    case "pomodoro/tick":
      return { ...state, pomodoro: tickPomodoro(state.pomodoro, action.nowMs) };
    case "pomodoro/reset":
      return { ...state, pomodoro: resetPomodoro(state.pomodoro) };
    case "notice/clear":
      return { ...state, notice: null };
    case "storage/failed":
      return state.storageIssue === "write-failed"
        ? state
        : { ...state, storageIssue: "write-failed" };
    case "storage/hydrate":
      return { ...action.state, notice: null, storageIssue: null };
    case "reset":
      return {
        ...createInitialState(),
        notice: { kind: "success", message: "この端末のTascatデータをすべて削除しました。" },
      };
  }
}

