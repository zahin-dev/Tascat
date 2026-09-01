export const PRIORITIES = ["high", "medium", "low"] as const;
export const CATEGORIES = ["work", "private", "other"] as const;
export const RECURRENCES = ["none", "daily", "weekly", "monthly"] as const;

export type Priority = (typeof PRIORITIES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Recurrence = (typeof RECURRENCES)[number];

export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  memo: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: Priority | null;
  category: Category | null;
  recurrence: Recurrence;
  recurrenceAnchorDay: number | null;
  seriesId: string | null;
  generatedFromId: string | null;
  nextOccurrenceId: string | null;
  subtasks: Subtask[];
  completed: boolean;
  completedAt: string | null;
  rewardClaimed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TaskDraft = {
  title: string;
  memo: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: Priority | null;
  category: Category | null;
  recurrence: Recurrence;
  subtasks: Subtask[];
};

export type PomodoroMode = "focus" | "break";
export type TimerStatus = "idle" | "running" | "paused";

export type PomodoroState = {
  mode: PomodoroMode;
  status: TimerStatus;
  remainingMs: number;
  endsAt: string | null;
  lastCompletedMode: PomodoroMode | null;
};

export type PersistedAppState = {
  schemaVersion: 1;
  tasks: Task[];
  foodCount: number;
  pomodoro: PomodoroState;
};

export type AppNotice = {
  kind: "success" | "info" | "blocked" | "error";
  message: string;
  taskId?: string;
};

export type AppState = PersistedAppState & {
  notice: AppNotice | null;
  storageIssue: "corrupt" | "write-failed" | null;
};

export type TaskSort = "created" | "priority";

