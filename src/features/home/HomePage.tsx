import { useMemo, useState } from "react";
import { useApp } from "../../app/AppProvider";
import { sortTasks } from "../../domain/tasks";
import type { Task, TaskSort } from "../../domain/types";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PixelButton } from "../../components/ui/PixelButton";
import { CatArea } from "../cat/CatArea";
import { TaskFormDialog } from "../tasks/TaskFormDialog";
import { TaskList } from "../tasks/TaskList";

export function HomePage() {
  const { state, commands } = useApp();
  const [sort, setSort] = useState<TaskSort>("created");
  const [activePage, setActivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const activeTasks = useMemo(
    () => sortTasks(state.tasks.filter((task) => !task.completed), sort),
    [sort, state.tasks],
  );
  const completedTasks = useMemo(
    () => sortTasks(state.tasks.filter((task) => task.completed), sort),
    [sort, state.tasks],
  );

  const openCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  return (
    <div className="home-page">
      <CatArea />
      <section className="task-panel" aria-labelledby="tasks-heading">
        <div className="task-panel-header">
          <div className="section-title-lockup">
            <span className="section-paw pixel-asset" aria-hidden="true" />
            <div>
            <p className="eyebrow">YOUR TASKS</p>
            <h2 id="tasks-heading">タスク <span className="count-badge">{activeTasks.length}</span></h2>
            </div>
          </div>
          <div className="task-toolbar">
            <label htmlFor="task-sort">並び替え</label>
            <select
              id="task-sort"
              className="pixel-input pixel-select"
              value={sort}
              onChange={(event) => setSort(event.target.value as TaskSort)}
            >
              <option value="created">登録順</option>
              <option value="priority">優先度が高い順</option>
            </select>
            <PixelButton variant="primary" onClick={openCreate}>＋ タスク追加</PixelButton>
          </div>
        </div>

        <div className="active-task-region">
          <TaskList
            tasks={activeTasks}
            page={activePage}
            onPageChange={setActivePage}
            onEdit={openEdit}
            onDelete={setDeleteTask}
            emptyMessage="未完了のタスクはありません。"
            label="未完了のタスク"
          />
        </div>

        <div className="completed-section">
          <button
            className="completed-toggle"
            type="button"
            aria-expanded={completedOpen}
            onClick={() => setCompletedOpen((current) => !current)}
          >
            <span aria-hidden="true">{completedOpen ? "−" : "+"}</span>
            完了済み（{completedTasks.length}）
          </button>
          {completedOpen && (
            <div className="completed-content">
              <TaskList
                tasks={completedTasks}
                page={completedPage}
                onPageChange={setCompletedPage}
                onEdit={openEdit}
                onDelete={setDeleteTask}
                emptyMessage="完了済みのタスクはありません。"
                label="完了済みのタスク"
              />
            </div>
          )}
        </div>
      </section>

      <TaskFormDialog
        open={formOpen}
        task={editingTask}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
      />
      <ConfirmDialog
        open={deleteTask !== null}
        title="タスクを削除しますか？"
        description="このタスクを削除します。獲得済みまたは使用済みのごはんは変わりません。削除後は元に戻せません。"
        confirmLabel="削除する"
        onClose={() => setDeleteTask(null)}
        onConfirm={() => {
          if (deleteTask) commands.deleteTask(deleteTask.id);
        }}
      />
    </div>
  );
}
