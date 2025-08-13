// formatting/formatMessage.js
// Вхід: parsed (з classifyAndExtract)
// Вихід: { type, text, attachments, meta } — text повністю готовий до відправки

const DEFAULT_PRICE_DECIMALS = Number(process.env.PRICE_DECIMALS || 4);

// ── helpers ───────────────────────────────────────────────────────────────────
function fmtNum(v, decimals = DEFAULT_PRICE_DECIMALS) {
  if (v == null || Number.isNaN(Number(v))) return '—';
  const n = Number(v);
  return n.toFixed(decimals).replace(/\.?0+$/, '');
}

function fmtList(nums, decimals = DEFAULT_PRICE_DECIMALS) {
  if (!Array.isArray(nums) || nums.length === 0) return '';
  return nums.map(n => fmtNum(n, decimals)).join(', ');
}

function joinLines(lines) {
  return lines.filter(Boolean).join('\n');
}

function wrapOutput(type, text, parsed) {
  return {
    type,
    text, // готовий для caption/повідомлення
    attachments: { photos: parsed?.media?.photos || [] },
    meta: parsed?.meta || {}
  };
}

// ── renderers (під описаний вище формат) ──────────────────────────────────────
export function renderSignal(parsed) {
  const d = parsed.data || {};
  const side = (d.side || '').toUpperCase();
  const sideEmoji = side === 'LONG' ? '🟢' : side === 'SHORT' ? '🔴' : '📈';
  const head = `${sideEmoji} ${side} ${d.ticker || ''}`.trim();

  const lines = [head];

  // Entry
  if (d.entry && typeof d.entry === 'object') {
    if ('from' in d.entry && 'to' in d.entry && d.entry.from != null && d.entry.to != null) {
      lines.push(`Entry: ${fmtNum(d.entry.from)} – ${fmtNum(d.entry.to)}`);
    } else if ('price' in d.entry && d.entry.price != null) {
      lines.push(`Entry: ${fmtNum(d.entry.price)}`);
    }
  }

  // TP / SL / Leverage
  const tp = fmtList(d.take);
  if (tp) lines.push(`TP: ${tp}`);
  if (d.stop != null) lines.push(`SL: ${fmtNum(d.stop)}`);
  if (d.leverage != null) lines.push(`Leverage: x${d.leverage}`);

  return wrapOutput(parsed.type, joinLines(lines), parsed);
}

export function renderSignalUpdate(parsed) {
  const u = parsed.data || {};
  const tags = [];
  if (u.moveStop) tags.push('Stop moved');
  if (u.addMargin) tags.push('Margin added');
  if (u.closeOrFix) tags.push('Close/Partial fix');

  const title = `🔁 Position update${tags.length ? ` — ${tags.join(' · ')}` : ''}`;

  // За специфікою оновлень — показуємо і заголовок, і оригінальний текст (вже з підміненою лінкою)
  const lines = [title];
  if (parsed.text) {
    lines.push('', parsed.text);
  }

  return wrapOutput(parsed.type, joinLines(lines), parsed);
}

export function renderDaily(parsed) {
  const lines = ['🗓️ Daily update', '', parsed.text || ''];
  return wrapOutput(parsed.type, joinLines(lines), parsed);
}

export function renderReview(parsed) {
  const d = parsed.data || {};
  const tf = d.timeframe ? ` (${d.timeframe})` : '';
  const title = `📊 Market review ${d.primary || ''}${tf}`.trim();
  const lines = [title, '', parsed.text || ''];
  return wrapOutput(parsed.type, joinLines(lines), parsed);
}

// fallback — якщо зʼявиться новий тип і ми ще не додали рендерер
function renderFallback(parsed) {
  const lines = [`ℹ️ ${parsed?.type || 'message'}`];
  if (parsed?.text) lines.push('', parsed.text);
  return wrapOutput(parsed?.type || 'unknown', joinLines(lines), parsed || {});
}

// ── реєстр і API ───────────────────────────────────────────────────────────────
const renderers = {
  signal: renderSignal,
  signal_update: renderSignalUpdate,
  daily: renderDaily,
  review: renderReview
};

/**
 * Головна функція форматування
 * @param {ReturnType<classifyAndExtract>} parsed
 * @returns {{ type: string, text: string, attachments: { photos: any[] }, meta: any }}
 */
export function formatMessage(parsed) {
  if (!parsed || !parsed.type) return renderFallback(parsed || {});
  const r = renderers[parsed.type] || renderFallback;
  return r(parsed);
}

/**
 * Дозволяє підключити форматер для нового типу без зміни цього файлу
 */
export function registerFormatter(type, fn) {
  if (!type || typeof fn !== 'function') {
    throw new Error('registerFormatter(type, fn) requires valid args');
  }
  renderers[type] = fn;
}
