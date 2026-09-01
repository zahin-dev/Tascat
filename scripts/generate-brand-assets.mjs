import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = process.cwd();
const BRAND_DIRECTORY = path.join(ROOT, "public/brand");
const colors = {
  night: "#070d05",
  forest: "#151b0d",
  moss: "#303e30",
  muted: "#5f6751",
  cream: "#ddd7ba",
  wood: "#ce8c5f",
};

const iconArt = `
  <rect width="64" height="64" fill="${colors.forest}"/>
  <path fill="${colors.muted}" d="M2 2h60v4H6v52h52V6h4v56H2z"/>
  <path fill="${colors.cream}" d="M6 6h52v4H10v44h44V10h4v48H6z"/>
  <path fill="${colors.night}" d="M18 18h4V10h4v4h4v4h8v-4h4v-4h4v8h4v22h4v4h4v8h-4v4H42v-4H26v4H14v-4h-4v-8h4v-4h4z"/>
  <path fill="${colors.moss}" d="M22 22h24v18H22zm4 18h16v12H26zM46 36h8v4h-8zm8 4h4v8h-4zm-4 8h8v4h-8z"/>
  <path fill="${colors.wood}" d="M26 28h4v4h-4zm8 0h4v4h-4z"/>
  <path fill="${colors.cream}" d="M30 36h4v4h-4z"/>
`;

const letterPatterns = {
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
};

function pixelWord(word, startX, startY, pixelSize) {
  return [...word].map((letter, letterIndex) => {
    const pattern = letterPatterns[letter];
    const xOffset = startX + letterIndex * pixelSize * 6;
    const pixels = [];
    pattern.forEach((row, rowIndex) => {
      [...row].forEach((value, columnIndex) => {
        if (value === "1") {
          pixels.push(`<rect x="${xOffset + columnIndex * pixelSize}" y="${startY + rowIndex * pixelSize}" width="${pixelSize}" height="${pixelSize}"/>`);
        }
      });
    });
    return pixels.join("");
  }).join("");
}

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges" role="img" aria-labelledby="title"><title id="title">Tascat pixel cat mark</title>${iconArt}</svg>\n`;
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 80" shape-rendering="crispEdges" role="img" aria-labelledby="title"><title id="title">Tascat</title><rect width="360" height="80" fill="${colors.forest}"/><path fill="${colors.muted}" d="M0 0h360v4H4v72h352V4h4v76H0z"/><g transform="translate(8 8)">${iconArt}</g><g fill="${colors.cream}">${pixelWord("TASCAT", 88, 18, 6)}</g><path fill="${colors.wood}" d="M88 64h208v4H88z"/></svg>\n`;

fs.mkdirSync(BRAND_DIRECTORY, { recursive: true });
fs.writeFileSync(path.join(BRAND_DIRECTORY, "tascat-icon.svg"), iconSvg);
fs.writeFileSync(path.join(BRAND_DIRECTORY, "tascat-logo.svg"), logoSvg);

const browser = await chromium.launch();
const page = await browser.newPage();

async function render(svg, width, height, outputPath) {
  const pngBase64 = await page.evaluate(async ({ svg, width, height }) => {
    const image = new Image();
    image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png").split(",")[1];
  }, { svg, width, height });
  const png = Buffer.from(pngBase64, "base64");
  if (outputPath) fs.writeFileSync(outputPath, png);
  return png;
}

const favicon16 = await render(iconSvg, 16, 16);
const favicon32 = await render(iconSvg, 32, 32, path.join(BRAND_DIRECTORY, "tascat-icon-32.png"));
const favicon48 = await render(iconSvg, 48, 48);
await render(iconSvg, 180, 180, path.join(BRAND_DIRECTORY, "tascat-icon-180.png"));
await render(iconSvg, 192, 192, path.join(BRAND_DIRECTORY, "tascat-icon-192.png"));
await render(iconSvg, 512, 512, path.join(BRAND_DIRECTORY, "tascat-icon-512.png"));
await render(logoSvg, 720, 160, path.join(BRAND_DIRECTORY, "tascat-logo.png"));

function createIco(images) {
  const directorySize = 6 + images.length * 16;
  const directory = Buffer.alloc(directorySize);
  directory.writeUInt16LE(0, 0);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(images.length, 4);

  let imageOffset = directorySize;
  images.forEach(({ size, png }, index) => {
    const entryOffset = 6 + index * 16;
    directory.writeUInt8(size, entryOffset);
    directory.writeUInt8(size, entryOffset + 1);
    directory.writeUInt16LE(1, entryOffset + 4);
    directory.writeUInt16LE(32, entryOffset + 6);
    directory.writeUInt32LE(png.length, entryOffset + 8);
    directory.writeUInt32LE(imageOffset, entryOffset + 12);
    imageOffset += png.length;
  });

  return Buffer.concat([directory, ...images.map(({ png }) => png)]);
}

const favicon = createIco([
  { size: 16, png: favicon16 },
  { size: 32, png: favicon32 },
  { size: 48, png: favicon48 },
]);
fs.writeFileSync(path.join(ROOT, "public/favicon.ico"), favicon);

await browser.close();
console.log("Generated Tascat SVG, PNG, and ICO brand assets.");
