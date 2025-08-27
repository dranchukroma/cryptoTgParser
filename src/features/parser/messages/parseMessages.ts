import {
  DAILY_RE,
  ENTRY_RE,
  LEV_RE,
  REVIEW_HEAD_RE,
  SIGNAL_HEAD_RE,
  STOP_RE,
  TAKE_RE,
  TICKER_INLINE_RE,
  UPDATE_CLOSE_RE,
  UPDATE_MARGIN_RE,
  UPDATE_STOP_RE,
} from "../templates/messages.js";
import { toNumber } from "../../../utils/numbers.js";
import type { parseMessageType, ReviewData, Side, SignalData, SignalUpdateData } from "../../types/messages.js";


export function parseSignal(text: string): SignalData & {type: parseMessageType} | null {
  const head = text.match(SIGNAL_HEAD_RE);
  if (!head) return null;

  const ticker = head[1].toUpperCase();
  const sideRaw = head[2].toUpperCase();
  const side: Side =
    sideRaw === "LONG" || sideRaw === "SHORT"
      ? sideRaw
      : (() => {
          return null as never;
        })();

  const entryM = text.match(ENTRY_RE);
  const stopM = text.match(STOP_RE);
  const levM = text.match(LEV_RE);

  // Entry
  let entry: SignalData["entry"] = null;
  if (entryM) {
    const n1 = toNumber(entryM[1]);
    const n2 = entryM[2] ? toNumber(entryM[2]) : null;
    if (n1 !== null && n2 !== null) entry = { from: n1, to: n2 };
    else if (n1 !== null) entry = { price: n1 };
  }

  // Takes (RESET lastIndex because of /g)
  const takeVals: number[] = [];
  TAKE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAKE_RE.exec(text)) !== null) {
    const raw = m[1];
    for (const chunk of raw.split(",")) {
      const n = toNumber(chunk.trim());
      if (n !== null) takeVals.push(n);
    }
  }

  const leverage = levM ? Number.parseInt(levM[1], 10) : null;
  const stop = stopM ? toNumber(stopM[1]) : null;

  return {
    type: "signal",
    ticker,
    side,
    entry,
    take: takeVals,
    stop,
    leverage,
  };
}

export function parseSignalUpdate(text: string): {type: parseMessageType, update: SignalUpdateData}  | null {
  const has = (re: RegExp) => re.test(text);
  if (has(UPDATE_STOP_RE) || has(UPDATE_MARGIN_RE) || has(UPDATE_CLOSE_RE)) {
    return {
      type: "signal_update",
      update: {
        moveStop: UPDATE_STOP_RE.test(text) || undefined,
        addMargin: UPDATE_MARGIN_RE.test(text) || undefined,
        closeOrFix: UPDATE_CLOSE_RE.test(text) || undefined,
      },
    };
  }
  return null;
}

export function parseDaily(text: string): {type: parseMessageType} | null {
  return DAILY_RE.test(text) ? { type: "daily" } : null;
}

export function parseReview(text: string): ReviewData & {type: parseMessageType} | null {
  const m = text.match(REVIEW_HEAD_RE);
  let primary: string | null = null;
  let timeframe: string | null = null;

  if (m) {
    primary = m[2].toUpperCase();
    timeframe = m[3]?.toLowerCase() ?? null;
  } else {
    const t = text.match(TICKER_INLINE_RE);
    if (!t) return null;
    primary = t[1].toUpperCase();
  }

  return { type: "review", primary, timeframe };
}