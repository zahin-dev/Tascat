import { createInitialPomodoro, durationForMode } from "./constants";
import type { PomodoroState } from "./types";

export function startPomodoro(state: PomodoroState, nowMs: number): PomodoroState {
  if (state.status === "running") return state;
  return {
    ...state,
    status: "running",
    endsAt: new Date(nowMs + state.remainingMs).toISOString(),
    lastCompletedMode: null,
  };
}

export function pausePomodoro(state: PomodoroState, nowMs: number): PomodoroState {
  if (state.status !== "running" || !state.endsAt) return state;
  return {
    ...state,
    status: "paused",
    remainingMs: Math.max(0, Date.parse(state.endsAt) - nowMs),
    endsAt: null,
  };
}

export function tickPomodoro(state: PomodoroState, nowMs: number): PomodoroState {
  if (state.status !== "running" || !state.endsAt) return state;
  const remainingMs = Math.max(0, Date.parse(state.endsAt) - nowMs);
  if (remainingMs > 0) return { ...state, remainingMs };

  const completedMode = state.mode;
  const nextMode = completedMode === "focus" ? "break" : "focus";
  return {
    mode: nextMode,
    status: "idle",
    remainingMs: durationForMode(nextMode),
    endsAt: null,
    lastCompletedMode: completedMode,
  };
}

export function resetPomodoro(state: PomodoroState): PomodoroState {
  return {
    ...state,
    status: "idle",
    remainingMs: durationForMode(state.mode),
    endsAt: null,
    lastCompletedMode: null,
  };
}

export function hydratePomodoro(state: PomodoroState, nowMs: number): PomodoroState {
  if (state.status !== "running") return state;
  if (!state.endsAt || !Number.isFinite(Date.parse(state.endsAt))) return createInitialPomodoro();
  return tickPomodoro(state, nowMs);
}

export function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

