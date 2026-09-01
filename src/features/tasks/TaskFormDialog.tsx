import { useRef, useState, type FormEvent } from "react";
import { defaultTaskDraft, taskToDraft, useApp } from "../../app/AppProvider";
import { MEMO_MAX_LENGTH, TITLE_MAX_LENGTH } from "../../domain/constants";
import { addCalendarDays, todayKey } from "../../domain/date";
import {
  hasValidationErrors,
  normalizeDraft,
  validateTaskDraft,
  type TaskValidationErrors,
} from "../../domain/tasks";
import type { Category, Priority, Recurrence, Subtask, Task, TaskDraft } from "../../domain/types";
import { PixelButton } from "../../components/ui/PixelButton";
import { PixelDialog } from "../../components/ui/PixelDialog";

type TaskFormDialogProps = {
  open: boolean;
  task: Task | null;
  initialDueDate?: string | null;
  onClose: () => void;
};

const priorityLabels: Record<Priority, string> = { high: "高", medium: "中", low: "低" };
const categoryLabels: Record<Category, string> = {
  work: "仕事",
  private: "プライベート",
  other: "その他",
};
const recurrenceLabels: Record<Recurrence, string> = {
  none: "なし",
  daily: "毎日",
  weekly: "毎週",
  monthly: "毎月",
};

export function TaskFormDialog(props: TaskFormDialogProps) {
  if (!props.open) return null;
  return <TaskFormDialogContent {...props} />;
}

function TaskFormDialogContent({ task, initialDueDate = null, onClose }: TaskFormDialogProps) {
  const { commands } = useApp();
  const [draft, setDraft] = useState<TaskDraft>(() =>
    task ? taskToDraft(task) : defaultTaskDraft(initialDueDate),
  );
  const [errors, setErrors] = useState<TaskValidationErrors>({});
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = "task-form-title";

  const patchDraft = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const setQuickDate = (days: number) => {
    patchDraft("dueDate", addCalendarDays(todayKey(), days));
    window.requestAnimationFrame(() => dateRef.current?.focus());
  };

  const updateRecurrence = (recurrence: Recurrence) => {
    setDraft((current) => ({
      ...current,
      recurrence,
      dueDate: recurrence !== "none" && !current.dueDate ? todayKey() : current.dueDate,
    }));
    setErrors((current) => ({ ...current, dueDate: undefined }));
  };

  const addSubtask = () => {
    const title = subtaskTitle.trim();
    if (!title || title.length > TITLE_MAX_LENGTH) {
      setErrors((current) => ({
        ...current,
        subtasks: `サブタスク名は1〜${TITLE_MAX_LENGTH.toString()}文字で入力してください。`,
      }));
      return;
    }
    const subtask: Subtask = { id: crypto.randomUUID(), title, completed: false };
    patchDraft("subtasks", [...draft.subtasks, subtask]);
    setSubtaskTitle("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeDraft(draft);
    const nextErrors = validateTaskDraft(normalized);
    setErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) {
      window.requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    if (task) commands.editTask(task.id, normalized);
    else commands.addTask(normalized);
    onClose();
  };

  return (
    <PixelDialog open titleId={titleId} onClose={onClose} size="large">
      <form ref={formRef} className="task-form" onSubmit={submit} noValidate>
        <div className="dialog-header">
          <span className="dialog-kicker">{task ? "EDIT TASK" : "NEW TASK"}</span>
          <h2 id={titleId}>{task ? "タスクを編集" : "タスクを追加"}</h2>
        </div>

        {hasValidationErrors(errors) && (
          <p className="form-error-summary" role="alert">
            入力内容を確認してください。
          </p>
        )}

        <div className="dialog-body task-form-body">
        <section className="form-block" aria-labelledby="form-basic-heading">
          <div className="form-block-title">
            <span aria-hidden="true">A</span>
            <h3 id="form-basic-heading">基本情報</h3>
          </div>
        <div className="field-group">
          <label htmlFor="task-title">タスク名 <span aria-hidden="true">*</span></label>
          <input
            ref={titleRef}
            data-autofocus
            id="task-title"
            className="pixel-input"
            value={draft.title}
            maxLength={TITLE_MAX_LENGTH + 1}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "task-title-error" : undefined}
            onChange={(event) => patchDraft("title", event.target.value)}
          />
          <div className="field-meta">
            {errors.title ? <span className="field-error" id="task-title-error">{errors.title}</span> : <span />}
            <span>{draft.title.length}/{TITLE_MAX_LENGTH}</span>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="task-memo">メモ <span className="optional">任意</span></label>
          <textarea
            id="task-memo"
            className="pixel-input pixel-textarea"
            rows={3}
            value={draft.memo}
            maxLength={MEMO_MAX_LENGTH + 1}
            aria-invalid={Boolean(errors.memo)}
            aria-describedby={errors.memo ? "task-memo-error" : undefined}
            onChange={(event) => patchDraft("memo", event.target.value)}
          />
          <div className="field-meta">
            {errors.memo ? <span className="field-error" id="task-memo-error">{errors.memo}</span> : <span />}
            <span>{draft.memo.length}/{MEMO_MAX_LENGTH}</span>
          </div>
        </div>
        </section>

        <section className="form-block" aria-labelledby="form-date-heading">
          <div className="form-block-title">
            <span aria-hidden="true">B</span>
            <h3 id="form-date-heading">期限</h3>
          </div>
        <fieldset className="field-section">
          <legend className="sr-only">期限 <span className="optional">任意</span></legend>
          <div className="quick-actions">
            <PixelButton onClick={() => setQuickDate(0)}>今日</PixelButton>
            <PixelButton onClick={() => setQuickDate(1)}>明日</PixelButton>
            <PixelButton onClick={() => dateRef.current?.focus()}>日付</PixelButton>
            <PixelButton
              variant="quiet"
              onClick={() => setDraft((current) => ({ ...current, dueDate: null, dueTime: null, recurrence: "none" }))}
            >
              期限なし
            </PixelButton>
          </div>
          <div className="field-grid field-grid-date">
            <div className="field-group">
              <label htmlFor="task-date">日付</label>
              <input
                ref={dateRef}
                id="task-date"
                className="pixel-input"
                type="date"
                value={draft.dueDate ?? ""}
                aria-invalid={Boolean(errors.dueDate)}
                aria-describedby={errors.dueDate ? "task-date-error" : undefined}
                onChange={(event) => patchDraft("dueDate", event.target.value || null)}
              />
              {errors.dueDate && <span className="field-error" id="task-date-error">{errors.dueDate}</span>}
            </div>
            <div className="field-group">
              <label htmlFor="task-time">時刻 <span className="optional">任意</span></label>
              <input
                id="task-time"
                className="pixel-input"
                type="time"
                disabled={!draft.dueDate}
                value={draft.dueTime ?? ""}
                aria-invalid={Boolean(errors.dueTime)}
                onChange={(event) => patchDraft("dueTime", event.target.value || null)}
              />
            </div>
          </div>
        </fieldset>
        </section>

        <section className="form-block" aria-labelledby="form-attributes-heading">
          <div className="form-block-title">
            <span aria-hidden="true">C</span>
            <h3 id="form-attributes-heading">属性</h3>
          </div>
        <div className="field-grid field-grid-three">
          <div className="field-group">
            <label htmlFor="task-recurrence">繰り返し</label>
            <select
              id="task-recurrence"
              className="pixel-input pixel-select"
              value={draft.recurrence}
              onChange={(event) => updateRecurrence(event.target.value as Recurrence)}
            >
              {Object.entries(recurrenceLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="task-priority">優先度 <span className="optional">任意</span></label>
            <select
              id="task-priority"
              className="pixel-input pixel-select"
              value={draft.priority ?? ""}
              onChange={(event) => patchDraft("priority", (event.target.value || null) as Priority | null)}
            >
              <option value="">未指定</option>
              {Object.entries(priorityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="task-category">カテゴリ <span className="optional">任意</span></label>
            <select
              id="task-category"
              className="pixel-input pixel-select"
              value={draft.category ?? ""}
              onChange={(event) => patchDraft("category", (event.target.value || null) as Category | null)}
            >
              <option value="">未指定</option>
              {Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </div>
        </div>
        </section>

        <section className="form-block" aria-labelledby="form-subtasks-heading">
          <div className="form-block-title">
            <span aria-hidden="true">D</span>
            <h3 id="form-subtasks-heading">サブタスク</h3>
          </div>
        <fieldset className="field-section subtask-editor">
          <legend className="sr-only">サブタスク <span className="optional">任意</span></legend>
          <div className="subtask-add-row">
            <label className="sr-only" htmlFor="new-subtask">新しいサブタスク</label>
            <input
              id="new-subtask"
              className="pixel-input"
              placeholder="サブタスク名"
              value={subtaskTitle}
              maxLength={TITLE_MAX_LENGTH + 1}
              aria-invalid={Boolean(errors.subtasks)}
              onChange={(event) => setSubtaskTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSubtask();
                }
              }}
            />
            <PixelButton onClick={addSubtask}>追加</PixelButton>
          </div>
          {errors.subtasks && <span className="field-error">{errors.subtasks}</span>}
          {draft.subtasks.length > 0 && (
            <ul className="subtask-edit-list">
              {draft.subtasks.map((subtask) => (
                <li key={subtask.id}>
                  <input
                    className="pixel-input"
                    aria-label="サブタスク名"
                    value={subtask.title}
                    maxLength={TITLE_MAX_LENGTH + 1}
                    onChange={(event) =>
                      patchDraft(
                        "subtasks",
                        draft.subtasks.map((item) =>
                          item.id === subtask.id ? { ...item, title: event.target.value } : item,
                        ),
                      )
                    }
                  />
                  <PixelButton
                    variant="quiet"
                    aria-label={`${subtask.title || "無題のサブタスク"}を削除`}
                    onClick={() => patchDraft("subtasks", draft.subtasks.filter((item) => item.id !== subtask.id))}
                  >
                    削除
                  </PixelButton>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
        </section>
        </div>

        <div className="dialog-footer">
          <PixelButton onClick={onClose}>キャンセル</PixelButton>
          <PixelButton variant="primary" type="submit">{task ? "保存" : "追加"}</PixelButton>
        </div>
      </form>
    </PixelDialog>
  );
}
