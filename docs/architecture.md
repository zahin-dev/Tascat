# Tascat 基本設計・アーキテクチャ

## 1. 技術選定

| 領域 | 採用 | 理由 |
| --- | --- | --- |
| UI | React 19.2 | 4 画面の共通状態、モーダル、タイマー、アニメーションを宣言的に構成できる |
| 言語 | TypeScript 6.0 | 現行 lint エコシステムの対応範囲内にある安定版。ドメイン不変条件を型で明示できる |
| ビルド | Vite 8.2 | サーバー処理のない SPA に対して小さく高速。Vercel の静的配信に適合する |
| スタイル | Tailwind CSS 4.3 + CSS Design Tokens | レスポンシブと状態スタイルを保守しつつ、既製テーマではないピクセル UI を一貫して作れる |
| 書体 / Asset | Conti Neue 2P + processed PNG | 日本語 Pixel Typography と、切り出し座標を記録した UI / Cat Room 表現 |
| 状態管理 | React `useReducer` + Context | 状態遷移を 1 箇所で原子的に処理でき、規模に対して外部 state library は不要 |
| 永続化 | localStorage | 個人 1 人・端末内限定・小規模データ・同期不要という明示要件に最も単純に合う。IndexedDB の非同期層と schema 管理は過剰 |
| Unit / Integration | Vitest 4.1 + Testing Library | Vite と同じ変換基盤で純粋関数と UI フローを検証できる |
| E2E / a11y | Playwright 1.62 + axe-core | Chromium、Firefox、WebKit とアクセシビリティ規則を同一フローで確認できる |
| 配信 | Vercel Static | バックエンドや環境変数なしで `dist` を配信できる |

Node.js は `>=22.22.2` をサポート対象とする。パッケージは導入時の lockfile で固定する。

## 2. 採用しないもの

- Next.js: SSR、Server Components、Route Handler が不要で、純粋な端末内 SPA には責務が大きい
- React Router: 4 つの固定画面だけなので、ハッシュ URL と小さな route hook で十分
- Zustand / Redux: reducer と Context で全遷移を原子的に管理できる規模
- React Hook Form / Zod: 1 種類のフォームと保存 snapshot のために別の抽象層を増やさず、型付き validator を共有する
- IndexedDB: データ量、検索、blob、複数 store、transaction の必要がない
- UI コンポーネントキット: ピクセル UI を独自 token で作り、ネイティブ要素のアクセシビリティを直接維持する

## 3. 実行構成

```text
Browser
  ├─ Hash navigation (#/home, #/calendar, #/pomodoro, #/settings)
  ├─ React view/components
  ├─ AppProvider (useReducer)
  │    ├─ task domain transitions
  │    ├─ reward / food transitions
  │    └─ pomodoro transitions
  └─ Persistence adapter
       └─ localStorage: tascat.app-state.v1
```

ネットワーク、サーバー、データベースは存在しない。静的アセットと JS/CSS は Vercel から配信され、利用データはブラウザ外へ出ない。

## 4. 状態管理

### 4.1 分割方針

- 永続ドメイン状態: tasks、foodCount、pomodoro、schemaVersion
- 非永続 UI 状態: 現在画面、モーダル開閉、フォーム入力、選択日、ページ番号、完了領域開閉、猫の一時的な表示状態
- 猫の食事中ロックは `CatArea` の局所状態とし、ごはん消費 action の成功結果を受けて開始する

`AppProvider` は永続ドメイン状態だけを公開する。フォームやページ表示状態を巨大な global state へ入れない。

### 4.2 原子的な遷移

親タスク完了 action は 1 reducer 呼び出し内で次を行う。

1. 対象存在、未完了、全サブタスク完了を検証
2. `completed` と `completedAt` を更新
3. `rewardClaimed === false` の時だけ `foodCount + 1` と `rewardClaimed = true`
4. 繰り返しで次回未生成なら、次回タスク生成と生成済み ID 記録

別々の state 更新にしないことで、再描画やダブルクリックが中間状態を観測できないようにする。

ごはん消費 action は `foodCount > 0` の時だけ 1 減らし、成功 boolean を呼び出し元へ返す代わりに、直前 state と dispatch 後の競合を避ける専用 command hook で食事中ロックを先に確保する。

## 5. 永続化

- key: `tascat.app-state.v1`
- 形式: `PersistedAppState` 1 件の JSON snapshot
- 初期化: parse → schemaVersion 確認 → 構造・列挙値・日時・ID の検証 → 正規化
- 保存: reducer state の確定後に effect で同期保存
- 失敗: 例外を捕捉し、UI は継続。非技術的な保存エラー banner を表示
- 破損: 初期状態で起動し、データを読み込めなかった説明を表示
- リセット: 確認後に key を削除し、同一 action で初期状態へ戻す

localStorage は複数タブ同期を製品機能として扱わない。同時編集時の高度な競合解決は対象外だが、`storage` event 受信時には最新 snapshot を検証して取り込み、同一端末で明らかな表示不一致を残さない。

## 6. ルーティング

- `#/home`
- `#/calendar`
- `#/pomodoro`
- `#/settings`

不明な hash は home へ正規化する。リンクを用いるため、新規依存なしでセマンティックなナビゲーション、戻る・進む、再読み込み後の画面復元ができる。

## 7. コンポーネント構成

```text
App
├─ AppShell
│  ├─ Sidebar / MobileNav
│  └─ RouteView
├─ HomePage
│  ├─ CatArea
│  │  ├─ CatSprite
│  │  ├─ FoodCounter
│  │  └─ PixelButton
│  ├─ TaskList
│  │  ├─ TaskItem
│  │  └─ Pagination
│  └─ CompletedTaskSection
├─ CalendarPage
│  ├─ MonthCalendar
│  └─ DayTaskPanel
├─ PomodoroPage
│  └─ PomodoroTimer
├─ SettingsPage
├─ TaskFormDialog
│  └─ SubtaskEditor
├─ ConfirmDialog
└─ common
   ├─ PixelButton
   ├─ PixelPanel
   ├─ PixelIcon
   └─ StatusMessage
```

ドメイン処理は `src/domain`、永続化は `src/storage`、共有 UI は `src/components/ui`、機能 UI は `src/features` に置く。単純な小部品は親機能ファイル内にまとめ、意味のない 1 ファイル 1 コンポーネント化を避ける。

## 8. Pixel Asset Pipeline

```text
assets-source/aichan/*.png
assets-source/mega/*.png
assets-source/petmobile/*.png
  └─ scripts/process-pixel-assets.mjs
       ├─ integer crop
       ├─ Aichan Idle / Eat minimum sheet
       ├─ forest UI palette quantization
       ├─ furniture / environment forest blend
       ├─ PetMobile forest / warm wood quantization
       └─ public/assets/processed/**/*.png
```

- 第三者の元ZIP・元シートは公開リポジトリとproduction配信から除外し、`assets-source/` を `.gitignore` で管理する
- 使用する22点だけを加工済みruntime PNGとして配信する
- Aichanの全animation sheetは配信せず、Stand Idle 5frames / Eat 4framesだけを164×64 sheetへcropする
- 座標・加工・出力先・利用componentは `docs/assets.md` に固定する
- `npm run assets:build` は再生成用で、通常 build は生成済み PNG を配信する
- Conti Neue 2P は `public/assets/fonts` からローカル配信し、OFL 1.1 を `licenses/` に保持する
- オリジナルlogo・faviconは `scripts/generate-brand-assets.mjs` と `npm run brand:build` で第三者sourceなしに再生成できる

## 9. エラー処理

- 入力エラーはフィールド近傍に日本語で表示し、最初のエラーへ focus
- 対象タスク不存在は操作を無視し「タスクが見つかりませんでした」と status message に表示
- サブタスク未完了はエラー画面にせず、対象 task 内に必要操作を示す
- 保存失敗・破損は banner。stack、key 名、JSON 等を利用者へ見せない
- animation event が欠落しても timeout fallback で Idle へ戻す
- dialog は二重 submit を防ぎ、submit 中にボタンを無効化する

## 10. デプロイ

- `npm run build` で `dist/` を生成
- `vercel.json` は SPA fallback と静的セキュリティ header を定義
- framework preset は Vite、build command は `npm run build`、output は `dist`
- 環境変数、Functions、外部 binding は不要
