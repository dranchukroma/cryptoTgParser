// formatting/formatMessage.ts
// Вхід: parsed (з classifyAndExtract)
// Вихід: { type, text, attachments, meta } — text повністю готовий до відправки

// ── типи з вашого пайплайну ───────────────────────────────────────────────────
export type MediaType = "photo";

export type PhotoInfo = {
  photoId: string;                 // id конкретного повідомлення з фото
  accessHash: string;                 // id конкретного повідомлення з фото
  groupedId: string | number | null; // ідентифікатор альбому (або null)
  mediaType: MediaType;              // наразі тільки "photo"
};

type Entry = { price: number } | { from: number; to: number };

type SignalData = {
  ticker: string;
  side: "LONG" | "SHORT";
  entry: Entry | null;
  take: number[];
  stop: number | null;
  leverage: number | null;
};

type SignalUpdateData = {
  moveStop?: boolean;
  addMargin?: boolean;
  closeOrFix?: boolean;
};

type DailyData = Record<string, never>;

type ReviewData = {
  primary: string;
  timeframe: string | null;
};

type ParsedBase<T extends string, D> = {
  type: T;
  text: string;                      // вже з replaceLinks
  media: { photos: PhotoInfo[] };    // з classifyAndExtract
  meta: any;                         // джерело/peer/дати — лишаємо як any
  data: D;
};

export type ParsedSignal        = ParsedBase<"signal",        SignalData>;
export type ParsedSignalUpdate  = ParsedBase<"signal_update", SignalUpdateData>;
export type ParsedDaily         = ParsedBase<"daily",         DailyData>;
export type ParsedReview        = ParsedBase<"review",        ReviewData>;
export type ParsedUnknown       = ParsedBase<string, any>;

export type Parsed =
  | ParsedSignal
  | ParsedSignalUpdate
  | ParsedDaily
  | ParsedReview
  | ParsedUnknown;

export type FormattedOutput = {
  type: string;
  text: string;
  attachments: { photos: PhotoInfo[] };
  meta: any;
};

// ── helpers ───────────────────────────────────────────────────────────────────
const DEFAULT_PRICE_DECIMALS: number = Number(process.env.PRICE_DECIMALS ?? 6);

function fmtNum(v: unknown, decimals = DEFAULT_PRICE_DECIMALS): string {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  return n.toFixed(decimals).replace(/\.?0+$/, "");
}

function fmtList(nums: unknown, decimals = DEFAULT_PRICE_DECIMALS): string {
  if (!Array.isArray(nums) || nums.length === 0) return "";
  return nums.map((n) => fmtNum(n, decimals)).join(", ");
}

function joinLines(lines: Array<string | undefined | null | false>): string {
  return lines.filter(Boolean).join("\n");
}

function wrapOutput(type: string, text: string, parsed: Parsed): FormattedOutput {
  return {
    type,
    text, // готовий для caption/повідомлення
    attachments: { photos: parsed?.media?.photos ?? [] },
    meta: parsed?.meta ?? {},
  };
}

// ── renderers (під описаний вище формат) ──────────────────────────────────────
export function renderSignal(parsed: ParsedSignal): FormattedOutput {
  const d = parsed.data;
  const side = (d.side ?? "").toUpperCase() as "LONG" | "SHORT" | "";
  const sideEmoji = side === "LONG" ? "🟢" : side === "SHORT" ? "🔴" : "📈";
  const head = `${sideEmoji} ${side} ${d.ticker || ""}`.trim();

  const lines: string[] = [head];

  // Entry
  if (d.entry && typeof d.entry === "object") {
    if ("from" in d.entry && "to" in d.entry && d.entry.from != null && d.entry.to != null) {
      lines.push(`Entry: ${fmtNum(d.entry.from)} – ${fmtNum(d.entry.to)}`);
    } else if ("price" in d.entry && d.entry.price != null) {
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

export function renderSignalUpdate(parsed: ParsedSignalUpdate): FormattedOutput {
  const u = parsed.data || {};
  const tags: string[] = [];
  if (u.moveStop) tags.push("Stop moved");
  if (u.addMargin) tags.push("Margin added");
  if (u.closeOrFix) tags.push("Close/Partial fix");

  const title = `🔁 Position update${tags.length ? ` — ${tags.join(" · ")}` : ""}`;

  // показуємо і заголовок, і оригінальний текст (вже з підміненою лінкою)
  const lines: string[] = [title];
  if (parsed.text) lines.push("", parsed.text);

  return wrapOutput(parsed.type, joinLines(lines), parsed);
}

export function renderDaily(parsed: ParsedDaily): FormattedOutput {
  const lines = ["🗓️ Daily update", "", parsed.text || ""];
  return wrapOutput(parsed.type, joinLines(lines), parsed);
}

export function renderReview(parsed: ParsedReview): FormattedOutput {
  const d = parsed.data || ({} as ReviewData);
  const tf = d.timeframe ? ` (${d.timeframe})` : "";
  const title = `📊 Market review ${d.primary || ""}${tf}`.trim();
  const lines = [title, "", parsed.text || ""];
  return wrapOutput(parsed.type, joinLines(lines), parsed);
}

// fallback — якщо зʼявиться новий тип і ми ще не додали рендерер
function renderFallback(parsed: ParsedUnknown | null | undefined): FormattedOutput {
  const lines: string[] = [`ℹ️ ${parsed?.type || "message"}`];
  if (parsed?.text) lines.push("", parsed.text);
  const safeParsed: Parsed = parsed as any;
  return wrapOutput(parsed?.type || "unknown", joinLines(lines), safeParsed || ({} as any));
}

// ── реєстр і API ───────────────────────────────────────────────────────────────
type RendererFn = (p: Parsed) => FormattedOutput;

const renderers: Record<string, RendererFn> = {
  signal: renderSignal as RendererFn,
  signal_update: renderSignalUpdate as RendererFn,
  daily: renderDaily as RendererFn,
  review: renderReview as RendererFn,
};

/**
 * Головна функція форматування
 */
export async function formatMessage(parsed: Parsed | null | undefined): Promise<FormattedOutput> {
  if (!parsed || !parsed.type) return renderFallback(parsed as any);
  const r = renderers[parsed.type] || renderFallback;
  return r(parsed as any);
}

/**
 * Дозволяє підключити форматер для нового типу без зміни цього файлу
 */
export function registerFormatter<T extends string>(
  type: T,
  fn: (parsed: Parsed & { type: T }) => FormattedOutput
): void {
  if (!type || typeof fn !== "function") {
    throw new Error("registerFormatter(type, fn) requires valid args");
  }
  renderers[type] = fn as RendererFn;
}
