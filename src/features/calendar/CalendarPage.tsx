import { useMemo, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { formatDateKey, getMonthGrid, moveMonth, todayKey } from "../../domain/date";
import { sortTasks } from "../../domain/tasks";
import type { Task } from "../../domain/types";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PixelButton } from "../../components/ui/PixelButton";
import { TaskFormDialog } from "../tasks/TaskFormDialog";
import { TaskList } from "../tasks/TaskList";

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

export function CalendarPage() {
  const { state, commands } = useApp();
  const now = new Date();
  const today = todayKey(now);
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [selectedDate, setSelectedDate] = useState(today);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const grid = useMemo(() => getMonthGrid(month.year, month.month), [month]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, { active: number; completed: number }>();
    for (const task of state.tasks) {
      if (!task.dueDate) continue;
      const counts = map.get(task.dueDate) ?? { active: 0, completed: 0 };
      if (task.completed) counts.completed += 1;
      else counts.active += 1;
      map.set(task.dueDate, counts);
    }
    return map;
  }, [state.tasks]);

  const selectedTasks = useMemo(
    () => sortTasks(state.tasks.filter((task) => task.dueDate === selectedDate), "created"),
    [selectedDate, state.tasks],
  );

  const changeMonth = (delta: number) => {
    const next = moveMonth(month.year, month.month, delta);
    setMonth(next);
    setSelectedDate(formatDateKey({ year: next.year, month: next.month, day: 1 }));
    setPage(1);
  };

  const selectedAsDate = new Date(`${selectedDate}T12:00:00`);
  const selectedDateLabel = `${selectedAsDate.getFullYear()}年${selectedAsDate.getMonth() + 1}月${selectedAsDate.getDate()}日`;

  return (
    <section className="page calendar-page" aria-labelledby="calendar-heading">
      <header className="page-header">
        <div className="page-title-lockup">
          <span className="section-paw pixel-asset" aria-hidden="true" />
          <div><p className="eyebrow">CALENDAR</p><h1 id="calendar-heading">カレンダー</h1></div>
        </div>
      </header>

      <div className="calendar-layout">
        <section className="calendar-panel pixel-panel" aria-label={`${month.year}年${month.month}月`}>
          <div className="calendar-toolbar">
            <PixelButton variant="quiet" aria-label="前の月" onClick={() => changeMonth(-1)}>← 前月</PixelButton>
            <h2>{month.year}年 {month.month}月</h2>
            <PixelButton variant="quiet" aria-label="次の月" onClick={() => changeMonth(1)}>次月 →</PixelButton>
          </div>
          <div className="calendar-grid calendar-weekdays" aria-hidden="true">
            {weekdays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid" role="group" aria-label={`${month.year}年${month.month}月の日付`}>
            {grid.map((day, index) => {
              if (day === null) return <span className="calendar-empty" aria-hidden="true" key={`empty-${index.toString()}`} />;
              const dateKey = formatDateKey({ year: month.year, month: month.month, day });
              const counts = tasksByDate.get(dateKey) ?? { active: 0, completed: 0 };
              const selected = selectedDate === dateKey;
              const isToday = today === dateKey;
              return (
                <button
                  type="button"
                  className={`calendar-day ${selected ? "is-selected" : ""} ${isToday ? "is-today" : ""}`}
                  aria-pressed={selected}
                  aria-label={`${month.month}月${day}日、未完了${counts.active}件、完了${counts.completed}件${isToday ? "、今日" : ""}`}
                  onClick={() => { setSelectedDate(dateKey); setPage(1); }}
                  key={dateKey}
                >
                  <span className="calendar-day-number">{day}</span>
                  {isToday && <span className="today-label">今日</span>}
                  {(counts.active > 0 || counts.completed > 0) ? (
                    <span className="calendar-counts">
                      {counts.active > 0 ? <span className="calendar-marker marker-active">□ {counts.active}</span> : null}
                      {counts.completed > 0 ? (
                        <span className="calendar-marker marker-completed">
                          <span className="mini-check pixel-asset" aria-hidden="true" /> {counts.completed}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="day-panel pixel-panel" aria-labelledby="selected-day-heading">
          <div className="day-panel-header">
            <div><p className="eyebrow">SELECTED DAY</p><h2 id="selected-day-heading">{selectedDateLabel}</h2></div>
            <PixelButton variant="primary" onClick={() => { setEditingTask(null); setFormOpen(true); }}>
              ＋ この日に追加
            </PixelButton>
          </div>
          <div className="day-task-region">
            <TaskList
              tasks={selectedTasks}
              page={page}
              onPageChange={setPage}
              onEdit={(task) => { setEditingTask(task); setFormOpen(true); }}
              onDelete={setDeleteTask}
              emptyMessage="この日のタスクはありません。"
              label={`${selectedDateLabel}のタスク`}
            />
          </div>
        </section>
      </div>

      <TaskFormDialog
        open={formOpen}
        task={editingTask}
        initialDueDate={editingTask ? null : selectedDate}
        onClose={() => { setFormOpen(false); setEditingTask(null); }}
      />
      <ConfirmDialog
        open={deleteTask !== null}
        title="タスクを削除しますか？"
        description="このタスクを削除します。獲得済みまたは使用済みのごはんは変わりません。削除後は元に戻せません。"
        confirmLabel="削除する"
        onClose={() => setDeleteTask(null)}
        onConfirm={() => { if (deleteTask) commands.deleteTask(deleteTask.id); }}
      />
    </section>
  );
}
