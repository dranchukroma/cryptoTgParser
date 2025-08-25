// mediaProcessor.js  (ES Modules)
import sharp from 'sharp';

/** Налаштування під перший шаблон (BingX trade card) */
const BINGX_TEMPLATE = {
  id: 'bingx_trade_card_v1',
  // частка висоти чорної смуги, яку будемо різати
  bottomBarRatio: 0.20,
  // параметри валідації
  validate: {
    expectSquare: true,
    darkBarRatio: 0.22,          // яку частку низу перевіряємо як «темну смугу»
    maxSquareDeltaPx: 4,         // наскільки «не квадрат» допускаємо
    darkLumaThreshold: 0.18,     // середня яскравість 0..1 (чим менше — тим темніше)
  },
};

/** обчислення середньої «яскравості» raw RGB буфера (0..1) */
function avgLumaRGB(rawRgbBuffer) {
  const data = rawRgbBuffer;
  let s = 0;
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    s += (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  return s / (data.length / 3);
}

/** Перевірка, що зображення відповідає шаблону BingX */
async function isBingxTemplate(imgSharp) {
  const meta = await imgSharp.metadata();
  const { width, height } = meta;
  if (!width || !height) return false;

  // 1) квадратність
  if (BINGX_TEMPLATE.validate.expectSquare) {
    const delta = Math.abs(width - height);
    if (delta > BINGX_TEMPLATE.validate.maxSquareDeltaPx) return false;
  }

  // 2) нижня темна смуга
  const barH = Math.round(height * BINGX_TEMPLATE.validate.darkBarRatio);
  const bar = await imgSharp
    .extract({ left: 0, top: height - barH, width, height: barH })
    .raw()
    .toBuffer();

  const luma = avgLumaRGB(bar);
  if (luma > BINGX_TEMPLATE.validate.darkLumaThreshold) return false;

  return true;
}

/** Обрізання нижньої смуги під BingX */
async function cropBottomBar_Bingx(imgBuffer) {
  const img = sharp(imgBuffer);
  const { width, height } = await img.metadata();
  const cutH = Math.round(height * BINGX_TEMPLATE.bottomBarRatio);
  return img
    .extract({ left: 0, top: 0, width, height: height - cutH })
    .jpeg({ quality: 92 })
    .toBuffer();
}

/** Реєстр шаблонів (легко додавати нові) */
const TEMPLATES = [
  {
    id: BINGX_TEMPLATE.id,
    detect: isBingxTemplate,
    transform: cropBottomBar_Bingx,
    action: 'crop_bottom_bar',
  },
];

/**
 * Визначає який це шаблон (або null)
 * @param {Buffer} imgBuffer
 * @returns {Promise<{id:string, action:string, transform:Function} | null>}
 */
export async function detectTemplate(imgBuffer) {
  const img = sharp(imgBuffer);
  for (const t of TEMPLATES) {
    const ok = await t.detect(img.clone());
    if (ok) return { id: t.id, action: t.action, transform: t.transform };
  }
  return null;
}

/**
 * Обробити одне фото: визначити шаблон і застосувати трансформацію
 * @param {Buffer} imgBuffer
 * @returns {Promise<{matched:boolean, templateId?:string, action?:string, output:Buffer}>}
 */
export async function processOne(imgBuffer) {
  const tpl = await detectTemplate(imgBuffer);
  if (!tpl) {
    // не впізнано — повертаємо оригінал
    return { matched: false, output: imgBuffer };
  }
  const out = await tpl.transform(imgBuffer);
  return { matched: true, templateId: tpl.id, action: tpl.action, output: out };
}
