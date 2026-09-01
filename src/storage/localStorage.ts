import { SCHEMA_VERSION, STORAGE_KEY, TITLE_MAX_LENGTH } from "../domain/constants";
import { isDateKey, isTimeKey } from "../domain/date";
import { hydratePomodoro } from "../domain/pomodoro";
import { isCategory, isPriority, isRecurrence, isSubtask } from "../domain/tasks";
import type { PersistedAppState, PomodoroState, Task } from "../domain/types";

type LoadResult =
  | { status: "empty" }
  | { status: "ok"; state: PersistedAppState }
  | { status: "corrupt" };

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") return false;
  const task = value as Partial<Task>;
  const dueDateValid = task.dueDate === null || isDateKey(task.dueDate);
  const dueTimeValid = task.dueTime === null || isTimeKey(task.dueTime);
  const priorityValid = task.priority === null || isPriority(task.priority);
  const categoryValid = task.category === null || isCategory(task.category);

  return (
    typeof task.id === "string" &&
    task.id.length > 0 &&
    typeof task.title === "string" &&
    task.title.trim().length > 0 &&
    task.title.length <= TITLE_MAX_LENGTH &&
    typeof task.memo === "string" &&
    task.memo.length <= 2000 &&
    dueDateValid &&
    dueTimeValid &&
    (task.dueDate !== null || task.dueTime === null) &&
    priorityValid &&
    categoryValid &&
    isRecurrence(task.recurrence) &&
    (task.recurrenceAnchorDay === null ||
      (typeof task.recurrenceAnchorDay === "number" &&
        task.recurrenceAnchorDay >= 1 &&
        task.recurrenceAnchorDay <= 31)) &&
    isNullableString(task.seriesId) &&
    isNullableString(task.generatedFromId) &&
    isNullableString(task.nextOccurrenceId) &&
    Array.isArray(task.subtasks) &&
    task.subtasks.every(isSubtask) &&
    typeof task.completed === "boolean" &&
    (task.completedAt === null || isIsoDate(task.completedAt)) &&
    typeof task.rewardClaimed === "boolean" &&
    isIsoDate(task.createdAt) &&
    isIsoDate(task.updatedAt)
  );
}

function isPomodoro(value: unknown): value is PomodoroState {
  if (!value || typeof value !== "object") return false;
  const timer = value as Partial<PomodoroState>;
  return (
    (timer.mode === "focus" || timer.mode === "break") &&
    (timer.status === "idle" || timer.status === "running" || timer.status === "paused") &&
    typeof timer.remainingMs === "number" &&
    Number.isFinite(timer.remainingMs) &&
    timer.remainingMs >= 0 &&
    (timer.endsAt === null || isIsoDate(timer.endsAt)) &&
    (timer.lastCompletedMode === null ||
      timer.lastCompletedMode === "focus" ||
      timer.lastCompletedMode === "break")
  );
}

export function decodePersistedState(value: string, nowMs = Date.now()): PersistedAppState | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const state = parsed as Partial<PersistedAppState>;
    if (
      state.schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(state.tasks) ||
      !state.tasks.every(isTask) ||
      typeof state.foodCount !== "number" ||
      !Number.isSafeInteger(state.foodCount) ||
      state.foodCount < 0 ||
      !isPomodoro(state.pomodoro)
    ) {
      return null;
    }

    const ids = new Set(state.tasks.map((task) => task.id));
    if (ids.size !== state.tasks.length) return null;

    return {
      schemaVersion: SCHEMA_VERSION,
      tasks: state.tasks,
      foodCount: state.foodCount,
      pomodoro: hydratePomodoro(state.pomodoro, nowMs),
    };
  } catch {
    return null;
  }
}

export function loadPersistedState(storage: Storage = window.localStorage): LoadResult {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { status: "empty" };
    const state = decodePersistedState(raw);
    return state ? { status: "ok", state } : { status: "corrupt" };
  } catch {
    return { status: "corrupt" };
  }
}

export function savePersistedState(
  state: PersistedAppState,
  storage: Storage = window.localStorage,
): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearPersistedState(storage: Storage = window.localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // The reducer still clears in-memory data; persistence feedback is handled by the provider.
  }
}

