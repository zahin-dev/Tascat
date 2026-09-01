# Tascat データモデル・詳細設計

## 1. 永続 state

```ts
type PersistedAppState = {
  schemaVersion: 1;
  tasks: Task[];
  foodCount: number;
  pomodoro: PomodoroState;
};
```

`foodCount` は 0 以上の安全な整数に制限する。UI 一時状態は保存しない。

## 2. Task

```ts
type Priority = "high" | "medium" | "low";
type Category = "work" | "private" | "other";
type Recurrence = "none" | "daily" | "weekly" | "monthly";

type Task = {
  id: string;
  title: string;
  memo: string;
  dueDate: string | null;          // YYYY-MM-DD (local calendar date)
  dueTime: string | null;          // HH:mm, dueDate が null なら null
  priority: Priority | null;
  category: Category | null;
  recurrence: Recurrence;
  recurrenceAnchorDay: number | null;
  seriesId: string | null;
  generatedFromId: string | null;
  nextOccurrenceId: string | null;
  subtasks: Subtask[];
  completed: boolean;
  completedAt: string | null;       // ISO 8601 instant
  rewardClaimed: boolean;
  createdAt: string;                // ISO 8601 instant
  updatedAt: string;                // ISO 8601 instant
};
```

### 不変条件

- `title.trim().length` は 1〜120
- `memo.length <= 2000`
- `dueDate === null` の時、`dueTime === null`
- `recurrence !== "none"` の時、`dueDate` と `seriesId` が存在する
- `recurrence === "monthly"` の時、`recurrenceAnchorDay` は 1〜31
- `completed === false` の時、`completedAt === null`
- `completed === true` の時、`completedAt` が存在する
- `rewardClaimed` は false → true の単方向。完了解除や削除で false に戻さない
- `nextOccurrenceId` は一度設定したら完了解除で null に戻さない
- `generatedFromId` は直前の発生タスクを指す

`seriesId` は繰り返し系列の識別子であり、最初のタスク生成時に UUID を割り当て、次回分へ引き継ぐ。`nextOccurrenceId` は同一生成元からの重複作成を防ぐ一次ガード、`generatedFromId` は破損・移行時にも既存生成を発見する二次ガードとして使う。

## 3. Subtask

```ts
type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};
```

- タイトルは 1〜120 文字
- 期限、時刻、優先度、カテゴリ、メモ、報酬を持たない
- 親タスク完了条件は `subtasks.every((item) => item.completed)`

## 4. PomodoroState

```ts
type PomodoroMode = "focus" | "break";
type TimerStatus = "idle" | "running" | "paused";

type PomodoroState = {
  mode: PomodoroMode;
  status: TimerStatus;
  remainingMs: number;
  endsAt: string | null;
  lastCompletedMode: PomodoroMode | null;
};
```

- focus の初期値は 1,500,000ms、break は 300,000ms
- running では `endsAt` が必須。表示残量は `max(0, endsAt - now)`
- paused / idle では `endsAt === null`、`remainingMs` が表示値
- 0 到達時は反対 mode、idle、反対 mode の全時間へ切り替え、`lastCompletedMode` に終了 mode を記録
- 自動開始しない

## 5. 日付計算

日付だけの値を UTC instant として解釈しない。`YYYY-MM-DD` を数値へ分解し、ローカルカレンダー上で生成・加算・再フォーマットする。

### 毎日

現在日付に calendar day を 1 加える。

### 毎週

現在日付に calendar day を 7 加える。

### 毎月

1. 現在年月の翌月を求める
2. 系列が保持する `recurrenceAnchorDay` と翌月末日の小さい方を採用
3. 生成タスクにも同じ anchor day を引き継ぐ

これにより 31 日系列が短い月を経ても 31 日へ戻る。

## 6. 完了・報酬・繰り返し transaction

```text
completeTask(taskId)
  ├─ task がない / 既に completed → no-op
  ├─ 未完了 subtask あり → blocked result（state 不変）
  └─ complete
       ├─ completed=true, completedAt=now
       ├─ rewardClaimed=false → foodCount+1, rewardClaimed=true
       └─ recurrenceあり
            ├─ nextOccurrenceIdあり → 生成しない
            ├─ generatedFromId=task.id の既存 task あり
            │    └─ その ID を nextOccurrenceId に補修、生成しない
            └─ 次回 task を 1 件生成し、その ID を記録
```

次回タスクは内容、優先度、カテゴリ、サブタスクのタイトル、recurrence metadata を引き継ぐ。ただし、完了・報酬状態は false、サブタスク完了状態も false、メモは同じ内容とする。`createdAt` と `updatedAt` は生成時刻に更新する。

完了解除は `completed=false` と `completedAt=null` だけを変更し、`rewardClaimed`、`nextOccurrenceId`、`foodCount`、生成済みタスクを変更しない。

## 7. 編集規則

- 完了済みタスクも編集可能
- 繰り返し設定を編集しても既に生成済みの次回分は遡及変更しない
- `nextOccurrenceId` がない未生成タスクでは、次回生成時に編集後の値を使用する
- recurrence を monthly に変更した時点で、現在の dueDate の日を anchor とする
- recurrence を none に変更しても既存系列や生成済みタスクは削除しない。対象タスクの系列 metadata だけを null にする。ただし `nextOccurrenceId` は監査用に保持して重複を防ぐ
- タスク削除は task 配列から対象だけを除き、ごはんや他タスクを変更しない

## 8. 並び替え

- 登録順: `createdAt` 昇順。同値なら `id` の辞書順
- 優先度順: high=0, medium=1, low=2, null=3。同順位は登録順
- sort 前に配列を複製し、永続 state の並びを破壊しない

## 9. 保存データ検証

読み込み時に以下を検証する。

- root object、schemaVersion、tasks array、foodCount、pomodoro
- ID の非空文字列と task ID の一意性
- 列挙値、文字長、日付・時刻形式、有限数
- subtasks の配列、ID、タイトル、boolean
- 参照 ID は存在しなくてもクラッシュさせず null 扱いまたは保守的 no-op

危険な部分読み込みは行わない。snapshot 全体が不正なら初期状態へ戻す。

