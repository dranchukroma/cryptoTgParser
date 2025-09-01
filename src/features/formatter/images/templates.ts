// mediaProcessor.ts (ES Modules, TypeScript)
import sharp, { type Sharp } from 'sharp';
import { binxSignal } from './binxFormatter.js';
import type { DetectedTemplate, RGBBuffer, TemplateDef } from '../../types/images.js';

/** -------- Helper -------- */
/** обчислення середньої «яскравості» raw RGB буфера (0..1) */
function avgLumaRGB(rawRgbBuffer: RGBBuffer): number {
  const data = rawRgbBuffer as Uint8Array;
  let s = 0;
  // дані у форматі RGBRGB... ⇒ крок 3
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    s += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  return s / (data.length / 3);
}

/* -------- Other -------- */

// Templates
const BINGX_TEMPLATE = {
  id: 'bingx_trade_card_v1',
  bottomBarRatio: 0.20,
  validate: {
    expectSquare: true,
    darkBarRatio: 0.22,
    maxSquareDeltaPx: 4,
    darkLumaThreshold: 0.18,
  },
} as const;

async function isBingxTemplate(imgSharp: Sharp): Promise<boolean> {
  const meta = await imgSharp.metadata();
  const width = meta.width ?? null;
  const height = meta.height ?? null;
  if (!width || !height) return false;

  // 1) квадратність
  if (BINGX_TEMPLATE.validate.expectSquare) {
    const delta = Math.abs(width - height);
    if (delta > BINGX_TEMPLATE.validate.maxSquareDeltaPx) return false;
  }

  // 2) нижня темна смуга
  const barH = Math.round(height * BINGX_TEMPLATE.validate.darkBarRatio);
  if (barH <= 0 || barH >= height) return false;

  const bar = await imgSharp
    .extract({ left: 0, top: height - barH, width, height: barH })
    .raw()
    .toBuffer();

  const luma = avgLumaRGB(bar);
  if (luma > BINGX_TEMPLATE.validate.darkLumaThreshold) return false;

  return true;
}

// Template info
const TEMPLATES: ReadonlyArray<TemplateDef> = [
  {
    id: BINGX_TEMPLATE.id,
    detect: isBingxTemplate,
    transform: binxSignal,
    action: 'binxSignal',
  },
] as const;

/**
 * Check template or return null
 */
export async function detectTemplate(imgBuffer: Buffer): Promise<DetectedTemplate | null> {
  const img = sharp(imgBuffer);
  for (const t of TEMPLATES) {
    const ok = await t.detect(img.clone());
    if (ok) return { id: t.id, action: t.action, transform: t.transform };
  }
  return null;
}