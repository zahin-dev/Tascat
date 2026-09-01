import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const sources = {
  aichan: path.join(ROOT, "assets-source/aichan/sprite-sheet-cat.png"),
  catUi: path.join(ROOT, "assets-source/mega/cat-ui-free.png"),
  cozyUi: path.join(ROOT, "assets-source/mega/ui-cozy-free.png"),
  furniture: path.join(ROOT, "assets-source/mega/cat-room-furnitures.png"),
  environment: path.join(ROOT, "assets-source/mega/free-environment.png"),
  petMobile: path.join(ROOT, "assets-source/petmobile/free-demo.png"),
};

const assets = [
  { source: "aichan", crop: [0, 192, 164, 64], mode: "raw", output: "public/assets/processed/cat/aichan-idle-eat.png" },
  { source: "catUi", crop: [128, 0, 16, 16], mode: "ui", output: "public/assets/processed/ui/control-frame.png" },
  { source: "catUi", crop: [64, 32, 16, 16], mode: "ui", output: "public/assets/processed/ui/paw.png" },
  { source: "catUi", crop: [160, 16, 16, 16], mode: "ui", output: "public/assets/processed/ui/check.png" },
  { source: "catUi", crop: [128, 32, 16, 16], mode: "ui", output: "public/assets/processed/ui/cross.png" },
  { source: "cozyUi", crop: [8, 167, 87, 81], mode: "ui", output: "public/assets/processed/ui/panel-frame.png" },
  { source: "furniture", crop: [14, 287, 103, 129], mode: "furniture", output: "public/assets/processed/cat-room/shelf.png" },
  { source: "furniture", crop: [140, 298, 45, 108], mode: "furniture", output: "public/assets/processed/cat-room/plant.png" },
  { source: "furniture", crop: [197, 331, 55, 77], mode: "furniture", output: "public/assets/processed/cat-room/scratcher.png" },
  { source: "environment", crop: [7, 137, 88, 119], mode: "forest", output: "public/assets/processed/cat-room/tree-large.png" },
  { source: "environment", crop: [105, 272, 47, 112], mode: "forest", output: "public/assets/processed/cat-room/tree-dark.png" },
  { source: "environment", crop: [202, 272, 47, 112], mode: "forest", output: "public/assets/processed/cat-room/tree-teal.png" },
  { source: "petMobile", crop: [1, 6, 110, 82], mode: "pet", output: "public/assets/processed/cat-room/pet-bed.png" },
  { source: "petMobile", crop: [204, 3, 52, 108], mode: "pet", output: "public/assets/processed/cat-room/pet-tower.png" },
  { source: "petMobile", crop: [145, 83, 62, 54], mode: "pet", output: "public/assets/processed/cat-room/pet-house.png" },
  { source: "petMobile", crop: [114, 40, 43, 37], mode: "food", output: "public/assets/processed/cat-room/pet-bowl.png" },
  { source: "petMobile", crop: [0, 99, 32, 43], mode: "pet", output: "public/assets/processed/cat-room/catnip.png" },
  { source: "petMobile", crop: [35, 104, 27, 16], mode: "pet", output: "public/assets/processed/cat-room/mouse.png" },
  { source: "petMobile", crop: [210, 115, 43, 30], mode: "pet", output: "public/assets/processed/cat-room/toy.png" },
  { source: "petMobile", crop: [4, 181, 24, 23], mode: "pet", output: "public/assets/processed/cat-room/feather-toy.png" },
  { source: "petMobile", crop: [7, 224, 17, 32], mode: "pet", output: "public/assets/processed/cat-room/food-bag.png" },
  { source: "petMobile", crop: [98, 162, 13, 13], mode: "pet", output: "public/assets/processed/cat-room/yarn.png" },
];

const missingSources = Object.values(sources).filter((sourcePath) => !fs.existsSync(sourcePath));
if (missingSources.length > 0) {
  throw new Error([
    "Licensed source assets are intentionally excluded from the public repository.",
    "Place the original files under assets-source/ as documented in docs/assets.md.",
    ...missingSources.map((sourcePath) => `- ${path.relative(ROOT, sourcePath)}`),
  ].join("\n"));
}

const browser = await chromium.launch();
const page = await browser.newPage();

for (const asset of assets) {
  const sourcePath = sources[asset.source];
  const sourceData = `data:image/png;base64,${fs.readFileSync(sourcePath).toString("base64")}`;
  const pngData = await page.evaluate(async ({ sourceData, crop, mode }) => {
    const image = new Image();
    image.src = sourceData;
    await image.decode();
    const [sourceX, sourceY, width, height] = crop;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.imageSmoothingEnabled = false;
    context.drawImage(image, sourceX, sourceY, width, height, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const { data } = imageData;

    if (mode === "raw") {
      // Keep the original pixels. This mode is used only to minimize a runtime sheet.
    } else if (mode === "ui") {
      const palette = [
        [7, 13, 5],
        [21, 27, 13],
        [33, 40, 22],
        [48, 62, 48],
        [72, 88, 77],
        [95, 103, 81],
        [183, 177, 149],
        [221, 215, 186],
      ];
      const luminances = [];
      for (let index = 0; index < data.length; index += 4) {
        if (data[index + 3] === 0) continue;
        luminances.push(data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722);
      }
      const minimum = Math.min(...luminances);
      const maximum = Math.max(...luminances);
      const range = Math.max(1, maximum - minimum);
      for (let index = 0; index < data.length; index += 4) {
        if (data[index + 3] === 0) continue;
        const luminance = data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
        const paletteIndex = Math.min(
          palette.length - 1,
          Math.round(((luminance - minimum) / range) * (palette.length - 1)),
        );
        [data[index], data[index + 1], data[index + 2]] = palette[paletteIndex];
      }
    } else if (mode === "pet") {
      const palette = [
        [7, 13, 5],
        [21, 27, 13],
        [33, 40, 22],
        [48, 62, 48],
        [72, 88, 77],
        [95, 103, 81],
        [171, 118, 78],
        [206, 140, 95],
        [183, 177, 149],
      ];
      const luminances = [];
      for (let index = 0; index < data.length; index += 4) {
        if (data[index + 3] === 0) continue;
        luminances.push(data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722);
      }
      const minimum = Math.min(...luminances);
      const maximum = Math.max(...luminances);
      const range = Math.max(1, maximum - minimum);
      for (let index = 0; index < data.length; index += 4) {
        if (data[index + 3] === 0) continue;
        const luminance = data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
        const paletteIndex = Math.min(
          palette.length - 1,
          Math.round(((luminance - minimum) / range) * (palette.length - 1)),
        );
        [data[index], data[index + 1], data[index + 2]] = palette[paletteIndex];
      }
    } else {
      const blend = mode === "food" ? 0.07 : mode === "forest" ? 0.18 : 0.12;
      const desaturate = mode === "food" ? 0.04 : mode === "forest" ? 0.08 : 0.14;
      const target = mode === "forest" ? [33, 40, 22] : [48, 62, 48];
      for (let index = 0; index < data.length; index += 4) {
        if (data[index + 3] === 0) continue;
        const luminance = data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
        for (let channel = 0; channel < 3; channel += 1) {
          const softened = data[index + channel] * (1 - desaturate) + luminance * desaturate;
          data[index + channel] = Math.round(softened * (1 - blend) + target[channel] * blend);
        }
      }
    }

    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png").split(",")[1];
  }, { sourceData, crop: asset.crop, mode: asset.mode });

  const outputPath = path.join(ROOT, asset.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(pngData, "base64"));
}

await browser.close();
console.log(`Generated ${assets.length} processed pixel assets.`);
