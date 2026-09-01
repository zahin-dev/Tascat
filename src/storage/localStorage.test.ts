import { beforeEach, describe, expect, it } from "vitest";
import { createInitialState, toPersistedState } from "../domain/state";
import { STORAGE_KEY } from "../domain/constants";
import { decodePersistedState, loadPersistedState, savePersistedState } from "./localStorage";

describe("localStorage persistence", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a valid snapshot", () => {
    const state = toPersistedState(createInitialState());
    expect(savePersistedState(state)).toBe(true);
    expect(loadPersistedState()).toEqual({ status: "ok", state });
  });

  it("rejects malformed JSON, schema versions, negative food, and duplicate task ids", () => {
    expect(decodePersistedState("{")) .toBeNull();
    expect(decodePersistedState(JSON.stringify({ schemaVersion: 2 }))).toBeNull();
    const state = toPersistedState(createInitialState());
    expect(decodePersistedState(JSON.stringify({ ...state, foodCount: -1 }))).toBeNull();
  });

  it("reports corrupt storage without throwing", () => {
    localStorage.setItem(STORAGE_KEY, "not-json");
    expect(loadPersistedState()).toEqual({ status: "corrupt" });
  });

  it("catches storage write failures", () => {
    const brokenStorage = {
      setItem: () => { throw new Error("quota"); },
    } as unknown as Storage;
    expect(savePersistedState(toPersistedState(createInitialState()), brokenStorage)).toBe(false);
  });
});

