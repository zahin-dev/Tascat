# Tascat アセット運用

## 1. 公開方針

公開リポジトリには、Webアプリの実行に必要な加工済みruntime assets、Tascatのオリジナルブランド資産、フォントだけを含める。第三者の元ZIP、元sheet、未使用asset、inspection outputは含めない。

元素材はWebアプリへの組み込み、ポートフォリオ利用、改変が可能である一方、配布物そのものの再配布は不可という確認済み条件に従う。加工済みruntime assetもTascatのUI内で利用するための最小範囲に限定する。

## 2. 公開するruntime assets

| 分類 | ファイル | 使用箇所 / 用途 |
| --- | --- | --- |
| Aichan | `public/assets/processed/cat/aichan-idle-eat.png` | Home。Stand Idle 5frames / Eat 4framesだけを収めた164×64 sheet |
| UI | `processed/ui/control-frame.png` | button、navigation、paginationのpixel frame |
| UI | `processed/ui/panel-frame.png` | panel、task card、dialog、timerのborder image |
| UI | `processed/ui/paw.png` | section、empty state、primary actionの補助icon |
| UI | `processed/ui/check.png` | checkbox、calendar completion marker |
| UI | `processed/ui/cross.png` | dialog、danger actionの補助icon |
| Cat Room | `processed/cat-room/shelf.png` | 左中景の棚 |
| Cat Room | `processed/cat-room/plant.png` | 右奥の植物 |
| Cat Room | `processed/cat-room/scratcher.png` | 左前景の爪とぎ |
| Forest | `processed/cat-room/tree-large.png` | 大窓の右奥 |
| Forest | `processed/cat-room/tree-dark.png` | 大窓の左奥 |
| Forest | `processed/cat-room/tree-teal.png` | 大窓の中央奥 |
| Pet items | `processed/cat-room/pet-bed.png` | 右前景の猫ベッド |
| Pet items | `processed/cat-room/pet-tower.png` | 右中景のキャットタワー |
| Pet items | `processed/cat-room/pet-house.png` | 左前景の猫ハウス |
| Pet items | `processed/cat-room/pet-bowl.png` | Aichan右側の餌皿と `ごはん × N` の装飾icon |
| Pet items | `processed/cat-room/catnip.png` | 棚付近の猫用品袋 |
| Pet items | `processed/cat-room/mouse.png` | 右前景のおもちゃ |
| Pet items | `processed/cat-room/toy.png` | 右中景の猫用toy |
| Pet items | `processed/cat-room/feather-toy.png` | 左前景の羽根toy |
| Pet items | `processed/cat-room/food-bag.png` | 棚上のfood bag |
| Pet items | `processed/cat-room/yarn.png` | 右前景の毛糸玉 |

すべてのruntime PNGは元sheetの必要範囲だけをcropし、Pixel UIのforest / warm wood paletteへ必要最小限の色調整を行う。Aichan sheetは色を変えず、Animation 7 / 8だけをcropする。

## 3. ブランド資産

| ファイル | 用途 |
| --- | --- |
| `public/brand/tascat-logo.svg` | README向け横長logo |
| `public/brand/tascat-logo.png` | rasterが必要な掲載先向け横長logo |
| `public/brand/tascat-icon.svg` | sidebar / modern browser favicon |
| `public/brand/tascat-icon-32.png` | ICO生成元・小サイズ確認 |
| `public/brand/tascat-icon-180.png` | apple touch icon |
| `public/brand/tascat-icon-192.png` | manifest icon |
| `public/brand/tascat-icon-512.png` | manifest icon |
| `public/favicon.ico` | 16 / 32 / 48pxを内包するlegacy browser / Windows系site icon |

ブランドマークは `scripts/generate-brand-assets.mjs` が決定論的に生成するTascat専用のfirst-party asset。Aichanの耳、暗い猫の輪郭、尻尾をpixel gridへ抽象化しており、第三者spriteの1frameを複製していない。

## 4. フォント

- Runtime: `public/assets/fonts/ContiNeue2P-1.0.1.otf`
- License: `licenses/ContiNeue2P-OFL.txt`
- License: SIL Open Font License 1.1

fontはWebアプリ実行に必要な配布物として保持し、ライセンス本文も公開する。

## 5. 非公開source assets

次のsourceは `assets-source/` にローカル配置する想定だが、公開リポジトリには含めない。`.gitignore` でdirectory全体を除外する。

```text
assets-source/
├─ aichan/sprite-sheet-cat.png
├─ mega/
│  ├─ cat-ui-free.png
│  ├─ ui-cozy-free.png
│  ├─ cat-room-furnitures.png
│  └─ free-environment.png
└─ petmobile/free-demo.png
```

元ZIP、Animation List、未使用character sheet、比較画像、asset inspection outputも公開しない。

## 6. 再生成パイプライン

`scripts/process-pixel-assets.mjs` は次を固定する保守用scriptとして残す。

- sourceごとの期待path
- crop座標
- palette quantization / blend方式
- runtime output path
- AichanのIdle / Eat最小sheet化

```bash
npm run assets:build
```

source filesがない場合は、公開リポジトリから欠けているのではなく意図的に除外されていることと、必要な配置先をerrorで案内する。通常の `npm ci`、`npm run dev`、`npm run build` は生成済みruntime assetsだけで成立する。

ブランド資産は第三者sourceを必要としない。

```bash
npm run brand:build
```

## 7. 使用しない提供素材

| Asset group | 不使用理由 |
| --- | --- |
| PetMobileの別猫・犬・ウサギ | Aichan 1匹固定と衝突するため |
| MegaPackのMochi / Sleeping Cat / dog / bird / frog / pig | 別character追加になるため |
| Horror / Medieval / Fantasy / Pastel UI | Tascatの静かなforest pixel roomと世界観が一致しないため |
| Attack / Run / Stealth / Jump等のAichan animation | 癒しのIdle / Eatだけを使う仕様のため |
| Cat Animation List画像 | frame確認用資料でありruntime UIではないため |

「提供素材を最大限使う」は、Tascatの仕様と両立する素材をCSSの模造より優先するという意味で扱う。別characterや別themeを無理に掲載しない。

## 8. CSS / HTMLとの責務分担

Assetは外観を担当し、HTMLは意味と操作を担当する。button、input、select、checkbox、calendar cell、dialog、focus ring、live regionを画像だけで代替しない。

可変長surface、wall、floor、window frame、focus ring、form state、modal backdropは、連続textureやsemantic controlとしての適切な提供assetがないためCSSで補完する。植物・家具・pet items・UI frame・状態iconは加工済みassetを優先する。
