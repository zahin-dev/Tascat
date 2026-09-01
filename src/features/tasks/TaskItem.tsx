import { useState } from "react";
import { useApp } from "../../app/AppProvider";
import { formatDateForDisplay } from "../../domain/date";
import type { Category, Priority, Recurrence, Task } from "../../domain/types";
import { PixelButton } from "../../components/ui/PixelButton";

type TaskItemProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

const priorityLabels: Record<Priority, string> = { high: "↑ 高", medium: "– 中", low: "↓ 低" };
const categoryLabels: Record<Category, string> = { work: "仕事", private: "プライベート", other: "その他" };
const recurrenceLabels: Record<Exclude<Recurrence, "none">, string> = {
  daily: "毎日",
  weekly: "毎週",
  monthly: "毎月",
};

export function TaskItem({ task, onEdit, onDelete }: TaskItemProps) {
  const { state, commands } = useApp();
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;
  const blocked = state.notice?.kind === "blocked" && state.notice.taskId === task.id;

  return (
    <li className={`task-item ${task.completed ? "is-completed" : ""}`} data-task-id={task.id}>
      <span className="task-card-notch" aria-hidden="true" />
      <div className="task-main-row">
        <label className="task-check-label">
          <input
            className="pixel-checkbox"
            type="checkbox"
            checked={task.completed}
            onChange={(event) => commands.setTaskCompleted(task.id, event.target.checked)}
          />
          <span className="sr-only">{task.completed ? `${task.title}を未完了に戻す` : `${task.title}を完了する`}</span>
        </label>
        <div className="task-content">
          <p className="task-title">{task.title}</p>
          <div className="task-meta">
            {task.priority && <span className={`tag priority-tag priority-${task.priority}`}>優先度 {priorityLabels[task.priority]}</span>}
            {task.category && <span className="tag category-tag">分類 {categoryLabels[task.category]}</span>}
            {task.dueDate && (
              <span className="tag">期限 {formatDateForDisplay(task.dueDate)}{task.dueTime ? ` ${task.dueTime}` : ""}</span>
            )}
            {task.recurrence !== "none" && <span className="tag">↻ {recurrenceLabels[task.recurrence]}</span>}
          </div>
          {task.memo && <p className="task-memo">{task.memo}</p>}
        </div>
        <div className="task-actions">
          <PixelButton variant="quiet" onClick={() => onEdit(task)}>編集</PixelButton>
          <PixelButton variant="quiet" onClick={() => onDelete(task)}>削除</PixelButton>
        </div>
      </div>

      {task.subtasks.length > 0 && (
        <div className="subtask-area">
          <button
            className="subtask-toggle"
            type="button"
            aria-expanded={subtasksOpen}
            onClick={() => setSubtasksOpen((current) => !current)}
          >
            <span aria-hidden="true">{subtasksOpen ? "−" : "+"}</span>
            サブタスク {completedSubtasks}/{task.subtasks.length}
          </button>
          {subtasksOpen && (
            <ul className="subtask-list">
              {task.subtasks.map((subtask) => (
                <li key={subtask.id}>
                  <label>
                    <input
                      className="pixel-checkbox pixel-checkbox-small"
                      type="checkbox"
                      checked={subtask.completed}
                      disabled={task.completed}
                      onChange={(event) =>
                        commands.setSubtaskCompleted(task.id, subtask.id, event.target.checked)
                      }
                    />
                    <span>{subtask.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {blocked && <p className="task-blocked" role="status">▣ すべてのサブタスクを完了してください。</p>}
    </li>
  );
}
