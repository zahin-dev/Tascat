import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  addCalendarMonth,
  getMonthGrid,
  isDateKey,
  moveMonth,
} from "./date";

describe("calendar date utilities", () => {
  it("adds daily and weekly dates across month and year boundaries", () => {
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addCalendarDays("2026-08-28", 7)).toBe("2026-09-04");
  });

  it("clamps monthly dates while preserving the supplied anchor", () => {
    const february = addCalendarMonth("2027-01-31", 31);
    expect(february).toBe("2027-02-28");
    expect(addCalendarMonth(february, 31)).toBe("2027-03-31");
    expect(addCalendarMonth("2028-01-31", 31)).toBe("2028-02-29");
  });

  it("validates actual calendar dates", () => {
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2027-02-29")).toBe(false);
    expect(isDateKey("2026-13-01")).toBe(false);
  });

  it("creates predictable month grids and month navigation", () => {
    const grid = getMonthGrid(2026, 8);
    expect(grid.length % 7).toBe(0);
    expect(grid.filter(Boolean)).toHaveLength(31);
    expect(moveMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });
});

