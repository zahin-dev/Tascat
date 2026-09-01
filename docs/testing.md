# Tascat テスト戦略

## 1. 方針

テストは、表示実装ではなくTascatの不変条件を守ることを中心に設計する。純粋なdomain関数をUnit、reducerとUIの協調をIntegration、利用者の主要操作とbrowser差をE2Eで確認する。

## 2. Unit Test

`src/domain` と `src/storage` を対象に次を検証する。

- taskの作成・編集・削除と入力上限
- 空title、無効日付、時刻と期限の整合性
- 未完了subtaskがある親taskの完了拒否
- 初回完了だけのごはん付与
- `rewardClaimed` を保持した完了解除と再完了
- daily / weekly / monthly recurrence
- 月末、うるう年、存在しない翌月日付のclamp
- 次回taskの重複生成防止
- 登録順 / 優先度順のstable sort
- Pomodoroの開始・一時停止・再開・reset・終了予定時刻計算
- localStorage snapshotのversion・shape検証と破損拒否

## 3. Integration Test

`AppProvider` と画面componentを実ブラウザに近いjsdom環境で結合し、次を検証する。

- task作成 → subtask完了 → 親task完了 → ごはん付与
- 完了解除 → 再完了でごはんが増えない
- task編集と削除確認
- calendar選択日からのtask追加
- storageからの復元と全データ削除
- PomodoroのUI状態遷移

## 4. E2E

| ID | シナリオ | 期待結果 |
| --- | --- | --- |
| E2E-1 | 新規task作成 | 未完了一覧に表示 |
| E2E-2 | 未完了subtaskありで親完了 | 完了せず自然な説明を表示 |
| E2E-3 | 全subtask後に親完了 | 完了済みへ移動 |
| E2E-4 | 親taskの初回完了 | ごはんが1増加 |
| E2E-5 | 完了解除 → 再完了 | ごはんは増えない |
| E2E-6 | ごはんを与える | 1減少、Eat後にIdle |
| E2E-7 | ごはん0 | buttonがdisabled、負数にならない |
| E2E-8 | daily task完了 | 翌日分を1件生成 |
| E2E-9 | 解除 → 再完了 | 翌日分を重複生成しない |
| E2E-10 | calendar日付から追加 | 選択日を期限として保存 |
| E2E-11 | task編集 | 入力項目を更新 |
| E2E-12 | task削除 | 確認後だけ削除 |
| E2E-13 | Pomodoro操作 | 開始・一時停止・再開・reset |

追加でlocalStorage再読込、全データ削除、dialogのEscape / focus return、ブランド・runtime assetのHTTP応答を確認する。

## 5. Accessibility / Viewport

- Home / Calendar / Pomodoro / Settingsでaxeを実行
- serious / critical violation 0を品質ゲートとする
- 1920×1080: ブランドと通常layoutの目視smoke
- 1280×720: page全体の横・縦overflowなし
- 320px: 横overflowなし、縦方向Reflow、操作不能なし
- Aichanは4x / 5x / 6xの整数倍率で描画
- `prefers-reduced-motion` でもEat状態が完了する

## 6. Browser Matrix

| Browser | 範囲 |
| --- | --- |
| Chromium | 全主要フロー、axe、layout、asset |
| Firefox | 起動・navigation・主要Home smoke |
| WebKit | 起動・navigation・主要Home smoke |

WindowsのFirefox headlessではsoftware renderingに依存する環境差があるため、ローカルでは表示モード、CIではheadlessを使用する設定を持つ。

## 7. 実行コマンド

```bash
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run test:e2e
npm run build
```

生成される `coverage/`、`playwright-report/`、`test-results/`、`dist/` は公開sourceに含めず、`.gitignore` で除外する。

## 8. 完了判定

- TypeScript error 0
- ESLint warning / error 0
- Unit / Integration成功
- Chromium E2E成功
- Firefox / WebKit smoke成功
- axe serious / critical 0
- production build成功
- 1タスク1食、繰り返し重複防止、localStorage互換を維持
- VercelのVite buildとSPA fallbackが成立
