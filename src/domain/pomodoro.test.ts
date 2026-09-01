import { describe, expect, it } from "vitest";
import { BREAK_DURATION_MS, FOCUS_DURATION_MS, createInitialPomodoro } from "./constants";
import {
  formatRemainingTime,
  hydratePomodoro,
  pausePomodoro,
  resetPomodoro,
  startPomodoro,
  tickPomodoro,
} from "./pomodoro";

describe("pomodoro calculations", () => {
  it("starts, pauses, resumes, and resets from absolute time", () => {
    const initial = createInitialPomodoro();
    const running = startPomodoro(initial, 1_000);
    expect(Date.parse(running.endsAt ?? "")).toBe(1_000 + FOCUS_DURATION_MS);
    const paused = pausePomodoro(running, 61_000);
    expect(paused.status).toBe("paused");
    expect(paused.remainingMs).toBe(FOCUS_DURATION_MS - 60_000);
    const resumed = startPomodoro(paused, 100_000);
    expect(resumed.status).toBe("running");
    expect(resetPomodoro(resumed)).toMatchObject({ status: "idle", remainingMs: FOCUS_DURATION_MS, endsAt: null });
  });

  it("moves to break without auto-starting when focus ends", () => {
    const running = startPomodoro(createInitialPomodoro(), 0);
    const ended = tickPomodoro(running, FOCUS_DURATION_MS + 1);
    expect(ended).toMatchObject({
      mode: "break",
      status: "idle",
      remainingMs: BREAK_DURATION_MS,
      lastCompletedMode: "focus",
    });
  });

  it("hydrates a running timer after a reload and never displays negatives", () => {
    const running = startPomodoro(createInitialPomodoro(), 0);
    expect(hydratePomodoro(running, 10_000).remainingMs).toBe(FOCUS_DURATION_MS - 10_000);
    expect(formatRemainingTime(-100)).toBe("00:00");
    expect(formatRemainingTime(65_000)).toBe("01:05");
  });
});

