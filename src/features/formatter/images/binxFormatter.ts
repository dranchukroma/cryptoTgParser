// overlayBottomBar.ts (ESM)
import sharp from "sharp";
import fs from "fs/promises";

// твій бар із прозорим фоном (той, що ти виклав)
const defaultBarUrl = new URL("./binx_bottomBar.png", import.meta.url);

export async function binxSignal(
  imgBuffer: Buffer,
  barPath: string | URL = defaultBarUrl
): Promise<Buffer> {
  const base = sharp(imgBuffer);
  const baseMeta = await base.metadata();
  if (!baseMeta.width || !baseMeta.height) return imgBuffer;

  // читаємо бар
  const barRaw = await fs.readFile(barPath);
  let bar = sharp(barRaw).ensureAlpha(); // на випадок, якщо файл без альфи
  const barMeta0 = await bar.metadata();
  if (!barMeta0.width || !barMeta0.height) return imgBuffer;

  // ширина має збігатися; якщо різниця 1–2px — додаємо прозорий паддінг, а не тягнемо
  if (barMeta0.width !== baseMeta.width) {
    const diff = baseMeta.width - barMeta0.width;
    if (Math.abs(diff) <= 2) {
      const leftPad = Math.floor(Math.max(0, diff) / 2);
      const rightPad = Math.max(0, diff) - leftPad;
      bar = bar.extend({
        left: leftPad,
        right: rightPad,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
    } else {
      // як крайній випадок — підженемо по ширині (висоту не чіпаємо)
      bar = bar.resize({ width: baseMeta.width });
    }
  }

  const barMeta = await bar.metadata();
  const top = Math.max(0, baseMeta.height - (barMeta.height ?? 0) - 7);


  // накладання поверх (blend: 'over'); висоту фото НЕ збільшуємо
  return base
    .composite([
      {
        input: await bar.png().toBuffer(), // збереження альфи для чистого оверлею
        left: -5,
        top,
        blend: "over",
      },
    ])
    .jpeg({ quality: 92 }) // або .png() якщо важлива безвтратність
    .toBuffer();
}
