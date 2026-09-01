import type { PomodoroMode, PomodoroState } from "./types";

export const APP_VERSION = "1.0.0";
export const STORAGE_KEY = "tascat.app-state.v1";
export const SCHEMA_VERSION = 1 as const;
export const TASKS_PER_PAGE = 2;
export const TITLE_MAX_LENGTH = 120;
export const MEMO_MAX_LENGTH = 2000;
export const FOCUS_DURATION_MS = 25 * 60 * 1000;
export const BREAK_DURATION_MS = 5 * 60 * 1000;

export function durationForMode(mode: PomodoroMode): number {
  return mode === "focus" ? FOCUS_DURATION_MS : BREAK_DURATION_MS;
}

export function createInitialPomodoro(): PomodoroState {
  return {
    mode: "focus",
    status: "idle",
    remainingMs: FOCUS_DURATION_MS,
    endsAt: null,
    lastCompletedMode: null,
  };
}
