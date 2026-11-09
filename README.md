<h1 align="center">
  <img src="public/brand/tascat-logo.svg" width="540" alt="Tascat" />
</h1>

<p align="center"><strong>タスクを片付けたあとに、猫とひと息つけるピクセルToDoアプリ。</strong></p>

<p align="center">アカウント不要 · ローカルファースト · 個人利用向け</p>

<p align="center"><a href="https://tascat.vercel.app/"><strong>Tascatを開く</strong></a></p>

<p align="center">
  <a href="#development">開発・公開状況</a> ·
  <a href="#screenshots">プレビュー</a> ·
  <a href="#features">主な機能</a> ·
  <a href="#technology">技術スタック</a> ·
  <a href="#quickstart">セットアップ</a> ·
  <a href="#documentation">ドキュメント</a>
</p>

---

<a id="development"></a>

## 開発・公開状況

| 項目 | 内容 |
| --- | --- |
| 開発開始 | 2025年9月 |
| MVP完成 | 2025年11月 |
| 現在の状況 | 開発停止 |
| GitHub初回公開 | 2026年9月 |
| 公開アプリ | [Tascatを開く](https://tascat.vercel.app/) |

<a id="screenshots"></a>

## 🖼️ プレビュー

| 猫広場を中心にしたホーム画面 | タスク追加モーダル |
| --- | --- |
| ![Aichanの猫広場とタスク一覧を表示したTascatのホーム画面](docs/screenshots/home-preview.png) | ![タスク名、期限、属性、サブタスクを入力するTascatのタスク追加モーダル](docs/screenshots/task-modal-preview.png) |

## 🐈 Tascatとは

Tascatは、タスク管理と短い癒しを組み合わせた個人向けWebアプリケーションです。親タスクを1件完了すると猫のごはんを1食獲得でき、好きなタイミングでAichanに与えられます。

競争や育成のためのゲームではありません。タスクを終えた直後に小さな休息を挟み、次の行動へ気持ちを切り替えるための静かな体験を目指しています。

## 💡 なぜ作ったか

一般的なToDoアプリでは、完了チェックのあとに達成感より疲れが残ることがあります。そこで「やることを整理する」だけでなく、やり切った直後に猫との短い時間を置くことで、作業と生活の間に自然な区切りを作りました。

## 🔁 コア体験

```mermaid
flowchart LR
  A[タスクを完了] --> B[ごはんを1食獲得]
  B --> C[好きな時に猫へごはん]
  C --> D[短い食事アニメーション]
  D --> E[通常の猫広場へ戻る]
```

同じタスクから獲得できるごはんは最大1食です。完了解除後に再び完了しても報酬は増えず、繰り返しタスクの次回分も重複生成されません。

<a id="features"></a>

## ✨ 主な機能

- ✅ タスクの追加・編集・削除・完了解除とサブタスク管理
- ✅ 全サブタスク完了後のみ親タスクを完了できる制約
- 🍚 1タスク1食を保証するごはん報酬
- 🐈 AichanのStand Idle / Eatピクセルアニメーション
- 🔁 毎日・毎週・毎月の繰り返しタスクと重複防止
- 📅 月表示カレンダーと日付からのタスク追加
- ⏱️ 25分集中・5分休憩の固定ポモドーロ
- 💾 アカウント不要のlocalStorage保存
- 🎨 深い森林と暖かな木を基調とした一貫したピクセルUI
- ♿ WCAG 2.2 Level AAを意識したキーボード操作とReflow

検索、通知、同期、統計、ランキング、育成要素は実装していません。

<a id="technology"></a>

## 🛠️ 技術スタック

| 技術 | 役割 |
| --- | --- |
| React 19.2 | 4画面、モーダル、猫アニメーションの宣言的UI |
| TypeScript 6.0 | ドメインモデルと状態遷移の型安全性 |
| Vite 8.2 | 開発サーバーと静的プロダクションビルド |
| Tailwind CSS 4.3 + CSS Design Tokens | リセット基盤と独自ピクセルUIの設計 |
| React `useReducer` + Context | タスク・報酬・繰り返しの原子的な更新 |
| localStorage | 現在のブラウザ内だけの永続化 |
| Vitest + Testing Library | Unit / Integration Test |
| Playwright + axe-core | E2E、ブラウザ互換、アクセシビリティ検査 |
| Vercel | `dist` の静的配信 |

バックエンド、外部API、データベース、環境変数は使用しません。

## 🏗️ アーキテクチャ概要

```mermaid
flowchart TD
  R[Hash Navigation] --> P[React Feature Pages]
  P --> U[共有Pixel UI]
  P --> S[AppProvider / useReducer]
  S --> D[Task・Reward・Recurrence Domain]
  S --> L[localStorage Adapter]
  L --> V[Schema Validation]
```

ドメイン処理はUIから分離した純粋関数を中心に構成しています。親タスク完了時の「完了更新・初回報酬・次回生成」は単一のreducer actionで処理し、中間状態や再描画による二重付与を防ぎます。

永続化には、利用者1人・端末内限定・少量データ・同期なしという要件に最も単純に合うlocalStorageを採用しました。保存snapshotはschema versionとruntime validationを持ち、破損データを安全に拒否します。

## 🎨 設計・実装上の工夫

- `rewardClaimed` を完了解除と独立させ、1タスク1食を保証
- `generatedFromId` と生成済み状態により繰り返しタスクの二重作成を防止
- 終了予定時刻を基準にポモドーロ残時間を再計算し、ページ移動や再読込によるずれを抑制
- AichanはIdle / Eatだけを収めた最小runtime sheetを整数倍率で描画
- HTMLが意味と操作を担い、加工済みPixel Assetは外観に限定
- 第三者の元配布物を含めず、実行に必要な加工済みruntime assetsだけを公開

## ♿ アクセシビリティと品質保証

- セマンティックなナビゲーション、見出し、フォーム、ボタン
- 明確な `:focus-visible`、skip link、キーボード操作
- ネイティブ `dialog` によるフォーカス拘束、Escape、フォーカス復帰
- label・入力エラー・live regionの関連付け
- 色と文字・形を併用した完了、優先度、無効状態
- `prefers-reduced-motion` でも食事状態の意味を維持
- 1280×720の画面成立と320px幅の縦方向Reflow
- Chromium主要フロー、Firefox / WebKit smoke、axe serious / critical 0を自動検証
- TypeScript、ESLint、Unit、Integration、E2E、production buildを品質ゲート化

<a id="quickstart"></a>

## 🚀 セットアップ

### 必要環境

- Node.js 22.22.2以上
- npm 11以上

### インストールと起動

```bash
git clone <repository-url>
cd Tascat
npm ci
npx playwright install chromium firefox webkit
npm run dev
```

表示されたローカルURLをブラウザで開きます。Playwrightのブラウザ導入はE2Eとブランド画像の再生成に使用します。アプリの起動だけなら省略できます。`.env` は不要です。

### 検証とビルド

```bash
npm run typecheck       # TypeScript
npm run lint            # ESLint
npm test                # Unit + Integration
npm run test:coverage   # Coverage report
npm run test:e2e        # Chromium + Firefox / WebKit smoke + axe
npm run build           # distを生成
npm run preview         # production buildを確認
```

### アセット再生成

```bash
npm run brand:build
npm run assets:build
```

ブランドアセットは同梱スクリプトだけで再生成できます。`assets:build` はライセンス済みの元素材をローカルの `assets-source/` に配置した場合だけ使用する保守用コマンドです。通常の開発・ビルドには不要です。

## 📁 プロジェクト構成

```text
Tascat/
├─ docs/                  # 要件・設計・テスト・アセット資料
│  └─ screenshots/        # README用の指定スクリーンショット
├─ e2e/                   # Playwright E2E
├─ licenses/              # Conti Neue 2PのOFL 1.1
├─ public/
│  ├─ assets/             # Fontと加工済みruntime pixel assets
│  └─ brand/              # Tascatロゴとサイトアイコン
├─ scripts/               # ブランド生成と任意のPixel Asset再生成
├─ src/
│  ├─ app/                # Providerとhash navigation
│  ├─ components/         # CatSpriteと共有UI
│  ├─ domain/             # Task・日付・報酬・Pomodoroの純粋ロジック
│  ├─ features/           # Home / Calendar / Pomodoro / Settings / Tasks / Cat
│  ├─ storage/            # localStorageの検証・読み書き
│  └─ test/               # テスト初期化
├─ playwright.config.ts
├─ vercel.json
└─ vite.config.ts
```

<a id="documentation"></a>

## 📚 ドキュメント

- [要件定義](docs/requirements.md)
- [アーキテクチャ](docs/architecture.md)
- [データモデル](docs/data-model.md)
- [デザインシステム](docs/design-system.md)
- [テスト戦略](docs/testing.md)
- [アセット運用](docs/assets.md)

## 🔒 データとプライバシー

- アカウント・ログインなし
- タスク、ごはん、報酬、タイマーを現在のブラウザだけに保存
- 利用データの外部送信・端末間同期なし
- 広告、課金、アクセス解析なし
- ブラウザデータを削除するとTascatのデータも消失

## ☁️ デプロイ

`vercel.json` にViteのbuild command、`dist` 出力、SPA fallback、静的セキュリティheaderを定義済みです。VercelへリポジトリをImportし、環境変数なしでデプロイできます。

## 📦 第三者素材とフォント

Conti Neue 2PはSIL Open Font License 1.1で配布され、ライセンス本文を [`licenses/ContiNeue2P-OFL.txt`](licenses/ContiNeue2P-OFL.txt) に保持しています。一部のPixel Assetは利用許諾を確認した第三者素材を加工したものです。公開リポジトリには実行に必要なruntime assetsだけを含め、元ZIP・元sheet・未使用素材は再配布条件に従い含めません。詳細は[アセット運用](docs/assets.md)を参照してください。

プロジェクト全体に対するOSSライセンスは設定していません。

## ⚠️ 制約

- 端末間・ブラウザ間の同期はありません
- バックアップ、インポート、エクスポートはありません
- 複数タブで同時編集した場合は最後に保存されたsnapshotが優先されます
- 通知、音、履歴、統計、検索、フィルターはありません

## 👤 作者

**@zahin-dev**  
University Student · Expected Graduation: 2028
