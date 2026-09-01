import { MEMO_MAX_LENGTH, TITLE_MAX_LENGTH } from "./constants";
import { addCalendarDays, addCalendarMonth, isDateKey, isTimeKey, parseDateKey } from "./date";
import type {
  AppState,
  Category,
  Priority,
  Recurrence,
  Subtask,
  Task,
  TaskDraft,
  TaskSort,
} from "./types";

export type TaskValidationErrors = Partial<
  Record<"title" | "memo" | "dueDate" | "dueTime" | "subtasks", string>
>;

export function normalizeDraft(draft: TaskDraft): TaskDraft {
  const dueDate = draft.dueDate && isDateKey(draft.dueDate) ? draft.dueDate : draft.dueDate;
  return {
    ...draft,
    title: draft.title.trim(),
    memo: draft.memo.trim(),
    dueDate,
    dueTime: dueDate ? draft.dueTime : null,
    subtasks: draft.subtasks.map((subtask) => ({
      ...subtask,
      title: subtask.title.trim(),
    })),
  };
}

export function validateTaskDraft(draft: TaskDraft): TaskValidationErrors {
  const normalized = normalizeDraft(draft);
  const errors: TaskValidationErrors = {};

  if (!normalized.title) errors.title = "タスク名を入力してください。";
  else if (normalized.title.length > TITLE_MAX_LENGTH) {
    errors.title = `タスク名は${TITLE_MAX_LENGTH}文字以内で入力してください。`;
  }

  if (normalized.memo.length > MEMO_MAX_LENGTH) {
    errors.memo = `メモは${MEMO_MAX_LENGTH.toString()}文字以内で入力してください。`;
  }

  if (normalized.dueDate && !isDateKey(normalized.dueDate)) {
    errors.dueDate = "有効な日付を選択してください。";
  }

  if (normalized.dueTime && !isTimeKey(normalized.dueTime)) {
    errors.dueTime = "有効な時刻を選択してください。";
  }

  if (normalized.recurrence !== "none" && !normalized.dueDate) {
    errors.dueDate = "繰り返しには期限が必要です。";
  }

  if (
    normalized.subtasks.some(
      (subtask) => !subtask.title || subtask.title.length > TITLE_MAX_LENGTH,
    )
  ) {
    errors.subtasks = `サブタスク名は1〜${TITLE_MAX_LENGTH.toString()}文字で入力してください。`;
  }

  return errors;
}

export function hasValidationErrors(errors: TaskValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

type TaskIdentity = {
  id: string;
  seriesId: string | null;
  nowIso: string;
};

export function createTask(draft: TaskDraft, identity: TaskIdentity): Task {
  const normalized = normalizeDraft(draft);
  const dateParts = normalized.dueDate ? parseDateKey(normalized.dueDate) : null;
  return {
    id: identity.id,
    title: normalized.title,
    memo: normalized.memo,
    dueDate: normalized.dueDate,
    dueTime: normalized.dueTime,
    priority: normalized.priority,
    category: normalized.category,
    recurrence: normalized.recurrence,
    recurrenceAnchorDay:
      normalized.recurrence === "monthly" && dateParts ? dateParts.day : null,
    seriesId: normalized.recurrence === "none" ? null : identity.seriesId,
    generatedFromId: null,
    nextOccurrenceId: null,
    subtasks: normalized.subtasks,
    completed: false,
    completedAt: null,
    rewardClaimed: false,
    createdAt: identity.nowIso,
    updatedAt: identity.nowIso,
  };
}

export function editTask(
  task: Task,
  draft: TaskDraft,
  nowIso: string,
  newSeriesId: string | null,
): Task {
  const normalized = normalizeDraft(draft);
  const dateParts = normalized.dueDate ? parseDateKey(normalized.dueDate) : null;
  const recurrenceChanged = normalized.recurrence !== task.recurrence;
  const seriesId =
    normalized.recurrence === "none" ? null : task.seriesId ?? newSeriesId;

  return {
    ...task,
    title: normalized.title,
    memo: normalized.memo,
    dueDate: normalized.dueDate,
    dueTime: normalized.dueTime,
    priority: normalized.priority,
    category: normalized.category,
    recurrence: normalized.recurrence,
    recurrenceAnchorDay:
      normalized.recurrence === "monthly" && dateParts
        ? recurrenceChanged || task.recurrenceAnchorDay === null
          ? dateParts.day
          : task.recurrenceAnchorDay
        : null,
    seriesId,
    subtasks: normalized.subtasks,
    updatedAt: nowIso,
  };
}

export function canCompleteTask(task: Task): boolean {
  return task.subtasks.every((subtask) => subtask.completed);
}

export function nextOccurrenceDate(task: Task): string | null {
  if (task.recurrence === "none" || !task.dueDate) return null;
  if (task.recurrence === "daily") return addCalendarDays(task.dueDate, 1);
  if (task.recurrence === "weekly") return addCalendarDays(task.dueDate, 7);
  return addCalendarMonth(
    task.dueDate,
    task.recurrenceAnchorDay ?? parseDateKey(task.dueDate)?.day ?? 1,
  );
}

export type CompleteTaskInput = {
  taskId: string;
  completed: boolean;
  nowIso: string;
  nextTaskId: string;
};

export function setTaskCompletion(state: AppState, input: CompleteTaskInput): AppState {
  const taskIndex = state.tasks.findIndex((task) => task.id === input.taskId);
  if (taskIndex < 0) {
    return {
      ...state,
      notice: { kind: "error", message: "タスクが見つかりませんでした。" },
    };
  }

  const task = state.tasks[taskIndex];
  if (!task || task.completed === input.completed) return state;

  if (!input.completed) {
    const reopened = { ...task, completed: false, completedAt: null, updatedAt: input.nowIso };
    const tasks = [...state.tasks];
    tasks[taskIndex] = reopened;
    return {
      ...state,
      tasks,
      notice: { kind: "info", message: "タスクを未完了に戻しました。", taskId: task.id },
    };
  }

  if (!canCompleteTask(task)) {
    return {
      ...state,
      notice: {
        kind: "blocked",
        message: "すべてのサブタスクを完了してください。",
        taskId: task.id,
      },
    };
  }

  const rewardGranted = !task.rewardClaimed;
  let completedTask: Task = {
    ...task,
    completed: true,
    completedAt: input.nowIso,
    rewardClaimed: true,
    updatedAt: input.nowIso,
  };
  const tasks = [...state.tasks];

  const nextDate = nextOccurrenceDate(task);
  if (nextDate) {
    const linkedTask = task.nextOccurrenceId
      ? state.tasks.find((candidate) => candidate.id === task.nextOccurrenceId)
      : state.tasks.find((candidate) => candidate.generatedFromId === task.id);

    if (linkedTask) {
      completedTask = { ...completedTask, nextOccurrenceId: linkedTask.id };
    } else {
      const nextTask: Task = {
        ...task,
        id: input.nextTaskId,
        dueDate: nextDate,
        generatedFromId: task.id,
        nextOccurrenceId: null,
        subtasks: task.subtasks.map((subtask, index) => ({
          id: `${input.nextTaskId}:sub:${index.toString()}`,
          title: subtask.title,
          completed: false,
        })),
        completed: false,
        completedAt: null,
        rewardClaimed: false,
        createdAt: input.nowIso,
        updatedAt: input.nowIso,
      };
      completedTask = { ...completedTask, nextOccurrenceId: nextTask.id };
      tasks.push(nextTask);
    }
  }

  tasks[taskIndex] = completedTask;
  return {
    ...state,
    tasks,
    foodCount: rewardGranted ? state.foodCount + 1 : state.foodCount,
    notice: {
      kind: "success",
      message: rewardGranted
        ? "タスク完了。ごはんを1食獲得しました。"
        : "タスクを完了しました。",
      taskId: task.id,
    },
  };
}

const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  return [...tasks].sort((a, b) => {
    if (sort === "priority") {
      const aRank = a.priority ? priorityRank[a.priority] : 3;
      const bRank = b.priority ? priorityRank[b.priority] : 3;
      if (aRank !== bRank) return aRank - bRank;
    }
    const created = a.createdAt.localeCompare(b.createdAt);
    return created === 0 ? a.id.localeCompare(b.id) : created;
  });
}

export function updateSubtask(
  task: Task,
  subtaskId: string,
  completed: boolean,
  nowIso: string,
): Task {
  if (!task.subtasks.some((subtask) => subtask.id === subtaskId)) return task;
  return {
    ...task,
    subtasks: task.subtasks.map((subtask) =>
      subtask.id === subtaskId ? { ...subtask, completed } : subtask,
    ),
    updatedAt: nowIso,
  };
}

export function isPriority(value: unknown): value is Priority {
  return value === "high" || value === "medium" || value === "low";
}

export function isCategory(value: unknown): value is Category {
  return value === "work" || value === "private" || value === "other";
}

export function isRecurrence(value: unknown): value is Recurrence {
  return value === "none" || value === "daily" || value === "weekly" || value === "monthly";
}

export function isSubtask(value: unknown): value is Subtask {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Subtask>;
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    item.title.length <= TITLE_MAX_LENGTH &&
    typeof item.completed === "boolean"
  );
}
