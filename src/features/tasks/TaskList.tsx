import { useEffect } from "react";
import { TASKS_PER_PAGE } from "../../domain/constants";
import type { Task } from "../../domain/types";
import { Pagination } from "../../components/ui/Pagination";
import { TaskItem } from "./TaskItem";

type TaskListProps = {
  tasks: Task[];
  page: number;
  onPageChange: (page: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  emptyMessage: string;
  label: string;
};

export function TaskList({
  tasks,
  page,
  onPageChange,
  onEdit,
  onDelete,
  emptyMessage,
  label,
}: TaskListProps) {
  const totalPages = Math.max(1, Math.ceil(tasks.length / TASKS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageTasks = tasks.slice((safePage - 1) * TASKS_PER_PAGE, safePage * TASKS_PER_PAGE);

  useEffect(() => {
    if (page !== safePage) onPageChange(safePage);
  }, [onPageChange, page, safePage]);

  if (tasks.length === 0) {
    return (
      <div className="empty-state compact-empty">
        <span className="empty-paw pixel-asset" aria-hidden="true" />
        <div><strong>ALL CLEAR</strong><p>{emptyMessage}</p></div>
      </div>
    );
  }

  return (
    <>
      <ul className="task-list" aria-label={label}>
        {pageTasks.map((task) => (
          <TaskItem task={task} onEdit={onEdit} onDelete={onDelete} key={task.id} />
        ))}
      </ul>
      <Pagination page={safePage} totalPages={totalPages} onPageChange={onPageChange} label={label} />
    </>
  );
}
