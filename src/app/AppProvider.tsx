import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { todayKey } from "../domain/date";
import { createInitialState, appReducer, toPersistedState } from "../domain/state";
import { createTask } from "../domain/tasks";
import type { AppState, PersistedAppState, TaskDraft } from "../domain/types";
import {
  clearPersistedState,
  decodePersistedState,
  loadPersistedState,
  savePersistedState,
} from "../storage/localStorage";
import { STORAGE_KEY } from "../domain/constants";

type AppCommands = {
  addTask: (draft: TaskDraft) => string;
  editTask: (taskId: string, draft: TaskDraft) => void;
  deleteTask: (taskId: string) => void;
  setSubtaskCompleted: (taskId: string, subtaskId: string, completed: boolean) => void;
  setTaskCompleted: (taskId: string, completed: boolean) => void;
  consumeFood: () => boolean;
  startPomodoro: () => void;
  pausePomodoro: () => void;
  tickPomodoro: () => void;
  resetPomodoro: () => void;
  resetAllData: () => void;
  clearNotice: () => void;
};

type AppContextValue = {
  state: AppState;
  commands: AppCommands;
};

const AppContext = createContext<AppContextValue | null>(null);

function makeId(): string {
  return crypto.randomUUID();
}

function initializeState(): AppState {
  const result = loadPersistedState();
  if (result.status === "ok") return { ...result.state, notice: null, storageIssue: null };
  return createInitialState(result.status === "corrupt" ? "corrupt" : null);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, initializeState);
  const persistedState = useMemo<PersistedAppState>(
    () => ({
      schemaVersion: 1,
      tasks: state.tasks,
      foodCount: state.foodCount,
      pomodoro: state.pomodoro,
    }),
    [state.foodCount, state.pomodoro, state.tasks],
  );

  useEffect(() => {
    if (!savePersistedState(persistedState)) dispatch({ type: "storage/failed" });
  }, [persistedState]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (event.newValue === null) {
        dispatch({ type: "storage/hydrate", state: toPersistedState(createInitialState()) });
        return;
      }
      const decoded = decodePersistedState(event.newValue);
      if (decoded) dispatch({ type: "storage/hydrate", state: decoded });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addTask = useCallback((draft: TaskDraft) => {
    const id = makeId();
    dispatch({
      type: "task/add",
      task: createTask(draft, {
        id,
        seriesId: draft.recurrence === "none" ? null : makeId(),
        nowIso: new Date().toISOString(),
      }),
    });
    return id;
  }, []);

  const editTaskCommand = useCallback((taskId: string, draft: TaskDraft) => {
    dispatch({
      type: "task/edit",
      taskId,
      draft,
      nowIso: new Date().toISOString(),
      seriesId: makeId(),
    });
  }, []);

  const commands = useMemo<AppCommands>(
    () => ({
      addTask,
      editTask: editTaskCommand,
      deleteTask: (taskId) => dispatch({ type: "task/delete", taskId }),
      setSubtaskCompleted: (taskId, subtaskId, completed) =>
        dispatch({
          type: "task/subtask",
          taskId,
          subtaskId,
          completed,
          nowIso: new Date().toISOString(),
        }),
      setTaskCompleted: (taskId, completed) =>
        dispatch({
          type: "task/completion",
          taskId,
          completed,
          nowIso: new Date().toISOString(),
          nextTaskId: makeId(),
        }),
      consumeFood: () => {
        if (state.foodCount <= 0) return false;
        dispatch({ type: "food/consume" });
        return true;
      },
      startPomodoro: () => dispatch({ type: "pomodoro/start", nowMs: Date.now() }),
      pausePomodoro: () => dispatch({ type: "pomodoro/pause", nowMs: Date.now() }),
      tickPomodoro: () => dispatch({ type: "pomodoro/tick", nowMs: Date.now() }),
      resetPomodoro: () => dispatch({ type: "pomodoro/reset" }),
      resetAllData: () => {
        clearPersistedState();
        dispatch({ type: "reset" });
      },
      clearNotice: () => dispatch({ type: "notice/clear" }),
    }),
    [addTask, editTaskCommand, state.foodCount],
  );

  const value = useMemo(() => ({ state, commands }), [commands, state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used within AppProvider");
  return value;
}

export function defaultTaskDraft(dueDate: string | null = null): TaskDraft {
  return {
    title: "",
    memo: "",
    dueDate,
    dueTime: null,
    priority: null,
    category: null,
    recurrence: "none",
    subtasks: [],
  };
}

export function todayTaskDraft(): TaskDraft {
  return defaultTaskDraft(todayKey());
}

export function taskToDraft(task: PersistedAppState["tasks"][number]): TaskDraft {
  return {
    title: task.title,
    memo: task.memo,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    priority: task.priority,
    category: task.category,
    recurrence: task.recurrence,
    subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
  };
}
