# Tascat デザインシステム

## 1. 目的

TascatのUIは、Aichanが暮らす「深い森林を大きな窓越しに眺める、暖かな木のピクセル猫部屋」を中心に構成する。ゲーム的な派手さではなく、タスク完了後に気持ちを切り替えられる静かな空間を目指す。

デザイン上の優先順位は次のとおり。

1. Aichanと猫広場
2. ごはん数と食事操作
3. タスク一覧
4. 4画面のナビゲーション

## 2. デザイントークン

色は `src/styles.css` のCSS Custom Propertiesで役割ごとに管理し、同じ色へ画面ごとに別の意味を与えない。

| 参照色 | 主な役割 |
| --- | --- |
| `#070D05` | viewport、窓の暗部、input surface、最深shadow |
| `#151B0D` | sidebar、猫部屋の壁、深い森林 |
| `#212816` | 主要surface |
| `#2B3320` | 猫部屋の床、森林の中景 |
| `#303E30` | elevated surface、hover |
| `#3B4B3E` | assetの中間色、部屋の奥行き |
| `#3F4227` | olive tone、室内の補助色 |
| `#48584D` | muted green、静かなedge |
| `#5F6751` | border |
| `#79775F` | muted text / highlight |
| `#AB764E` | warm wood dark、accent |
| `#CE8C5F` | primary action、accent hover |
| `#B7B195` | secondary textの基準 |
| `#DDD7BA` | AAコントラスト用のprimary text |
| `#E3A879` | keyboard focus |
| `#B96F62` | 削除専用のmuted danger |

純白、鮮やかな青、グラデーションを主役にしない。暗部を優勢にし、暖色は操作と木材の小さなaccentへ限定する。

## 3. タイポグラフィと寸法

- 基本書体: Conti Neue 2P
- fallback: `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace
- 1920×1080ではroot font sizeを17.5pxとし、旧14px相当から約125%へ拡張
- 1280×720では15.5pxへresponsive調整し、レイアウト成立と可読性を両立
- 320pxでは横幅を固定せず、縦方向Reflowを許容
- 主要button / inputは44px相当以上の操作領域を基準とする
- Pixel Assetは1x / 2x / 4x / 5x / 6x等の整数倍率を優先する

## 4. 画面構成

### 共通シェル

PCでは左sidebarと右main canvasに分割する。sidebarには正方形のTascatブランドマーク、4画面のsemantic link、local storage表記を配置する。現在地は `aria-current="page"`、文字、surface、左edgeで示す。

小画面ではsidebarを上部navigationへ変形し、4画面への操作を維持する。横スクロールは発生させない。

### ホーム

1920×1080ではHome available heightの約65%をCat Room、約35%をTask Panelに割り当てる。1280×720では約60% : 40%へ圧縮する。

Cat Roomは次のlayerで構成する。

1. 暗いwall
2. 大窓と加工済みforest assets
3. floorとwarm wood edge
4. 棚・植物・猫用品の奥景 / 中景 / 前景
5. 中央にbreathing spaceを確保したAichan

背景に格子や反復罫線は使用しない。タスク一覧は表示件数を減らしてpaginationし、文字を縮めて詰め込まない。

### タスクモーダル

タスク作成と編集は同じnative `dialog` を再利用する。1920×1080では基本情報・期限・属性・サブタスクの4区画を2列で表示し、狭い画面では1列へReflowする。label、必須、文字数、error summaryをDOMで保持する。

### カレンダー

月表示は7列gridだが、日付はsemantic buttonとして操作可能にする。選択、今日、未完了、完了を色だけで区別せず、label・件数・形を併用する。狭い画面でも曜日と日付を横方向にはみ出させない。

### ポモドーロ

固定25分 / 5分のtimer deviceとして見せる。残時間は `role="timer"`、modeは文字、操作はbuttonで表す。装飾assetは意味を担わない。

### 設定

「データ」と「アプリ情報」の2区画だけを置く。全データ削除はmuted red、文言、確認dialogの3つで誤操作を防ぐ。

## 5. 共通コンポーネント

- Panel / Card: `panel-frame.png`を `border-image` として使い、可変contentはHTML/CSSで保持
- Button / Navigation / Pagination: semantic elementに `control-frame.png`の外観を重ねる
- Checkbox: native checkboxを保持し、checked外観だけ `check.png`で補助
- Form controls: native input / select / textareaを使用し、pixel surfaceはCSSで構成
- Dialog: native `dialog`、backdrop、focus management、Escape、focus return
- Badge: 動的状態を文字とborderで表示
- Focus ring: `:focus-visible` に高コントラストのwarm wood色を使用

## 6. ブランド

`public/brand/tascat-icon.svg` は、Aichanの立った耳、暗い猫シルエット、尻尾を少色のpixel gridへ抽象化したオリジナルマーク。元スプライトの1frameは転用していない。

横長ロゴは同じマークと自作pixel letterによる `TASCAT` を組み合わせる。favicon、manifest、apple touch icon、sidebarで同じ正方形マークを使用し、ブランド認識を統一する。

## 7. アクセシビリティ

- WCAG 2.2 Level AAを目標とする
- すべての操作をkeyboardで実行可能にする
- focus-visibleを色・太さ・位置で明確にする
- form errorは該当controlと関連付け、最初のerrorへfocusする
- statusはlive regionで通知し、技術的な内部情報を表示しない
- `prefers-reduced-motion` ではIdle loopを停止し、Eat完了は短いtimeoutで意味を維持する
- 装飾画像は空altまたは `aria-hidden` とし、状態を画像だけで伝えない
- 320px幅では縦scrollを許容し、横scrollを防ぐ

## 8. 禁止する表現

SaaS風白背景、Material Designの流用、巨大な角丸カード、glassmorphism、過剰なgradient、neon、3D、particle、level / badge / streak等のゲーム演出は使用しない。Aichan以外のcharacterを追加しない。
