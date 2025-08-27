import type {
  ReviewData,
  Side,
  SignalData,
  SignalUpdateData,
} from "../../types/messages.js";
import { fmtList, fmtNum, joinLines } from "./helpers.js";

// ── renderers (під описаний вище формат) ──────────────────────────────────────
export function renderSignal(text: string, data: SignalData): string {
  const side = (data.side ?? "").toUpperCase() as Side;

  const sideEmoji = side === "LONG" ? "🟢" : side === "SHORT" ? "🔴" : "📈";
  const head = `${sideEmoji} ${side} ${data.ticker || ""}`.trim();

  const lines: string[] = [head];

  // Entry
  if (data.entry && typeof data.entry === "object") {
    if (
      "from" in data.entry &&
      "to" in data.entry &&
      data.entry.from != null &&
      data.entry.to != null
    ) {
      lines.push(
        `Entry: ${fmtNum(data.entry.from)} – ${fmtNum(data.entry.to)}`
      );
    } else if ("price" in data.entry && data.entry.price != null) {
      lines.push(`Entry: ${fmtNum(data.entry.price)}`);
    }
  }

  // TP / SL / Leverage
  const tp = fmtList(data.take);
  if (tp) lines.push(`TP: ${tp}`);
  if (data.stop != null) lines.push(`SL: ${fmtNum(data.stop)}`);
  if (data.leverage != null) lines.push(`Leverage: x${data.leverage}`);

  return joinLines(lines);
}

export function renderSignalUpdate(orgMsg: string, data: SignalUpdateData): string {
  const u = data || {};
  const tags: string[] = [];
  if (u.moveStop) tags.push("Stop moved");
  if (u.addMargin) tags.push("Margin added");
  if (u.closeOrFix) tags.push("Close/Partial fix");

  const title = `🔁 Position update${
    tags.length ? ` — ${tags.join(" · ")}` : ""
  }`;

  // Show title with original text with changed link
  const lines: string[] = [title];
  if (orgMsg) lines.push("", orgMsg);

  return joinLines(lines);
}

export function renderDaily(orgMsg: string): string {
  const lines = ["🗓️ Daily update", "", orgMsg || ""];
  return joinLines(lines);
}

export function renderReview(orgMsg: string, data: ReviewData): string {
  const tf = data.timeframe ? ` (${data.timeframe})` : "";
  const title = `📊 Market review ${data.primary || ""}${tf}`.trim();
  const lines = [title, "", orgMsg || ""];
  return joinLines(lines);
}