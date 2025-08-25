import type { Api } from "telegram";
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
} from "../../config/regexTemplates.js";
import type { RawMessage } from "../../index.js";
import { replaceLinks } from "../../utils/links.js";
import { toNum } from "../../utils/numbers.js";

// --- dates -------------------------------------------------

export function toUnixSeconds(
  d: number | string | Date | null | undefined
): number | null {
  if (d == null) return null;

  if (typeof d === "number") {
    // якщо мілісекунди — приведемо до секунд
    return d > 1e12 ? Math.floor(d / 1000) : d;
  }
  const dt = typeof d === "string" ? new Date(d) : d;
  const time = dt instanceof Date ? dt.getTime() : NaN;
  return Number.isNaN(time) ? null : Math.floor(time / 1000);
}

function toIso(d: string | Date | number | undefined): string | null {
  if (d == null) return null;
  if (typeof d === "string") return d;
  if (d instanceof Date) return d.toISOString();
  if (typeof d === "number") return new Date(d * 1000).toISOString(); // unix seconds -> ISO
  return null;
}

// --- media -------------------------------------------------

type PhotoInfo = {
  messageId: number; // id самого повідомлення з фото
  groupedId: string | number | null; // ідентифікатор альбому (якщо є)
  mediaType: "photo";
};

type MsgLike = {
  hasMedia?: boolean;
  mediaType?: string;
  albumId?: string | number | null;
};

export function collectPhotosFromRaw(raw: any): PhotoInfo[] {
  const photos: PhotoInfo[] = [];
  if (raw?.media && raw.photo) {
    photos.push({
      messageId: raw.id as number,
      groupedId: raw.groupedId ?? null,
      mediaType: "photo",
    });
  }
  return photos;
}

// --- wrap --------------------------------------------------

type WrapMeta = {
  id: number | string | undefined; // id «якорного» повідомлення
  peer?: import("telegram").Api.TypePeer; // звідки форвардити (канал/чат/peer)
  dateUnix: number | null;
  dateISO: string | null;
};

type WrapResult<T = unknown> = {
  type: string;
  text: string;
  media: { photos: PhotoInfo[] };
  meta: WrapMeta;
  data: T;
};

type MsgLikeExtended = MsgLike & {
  id?: string | number;
  date?: string | Date | number;   // number теж дозволяємо (unix seconds)
  peer?: Api.TypePeer;             // <-- додали
  __raw?: any;                     // (якщо прокидаєш сирий msg)
};

export function wrapResult<T = unknown>(
  type: string,
  text: string,
  msg: MsgLikeExtended & { __raw?: any }, // опціонально прокинемо сирий msg
  data: T = {} as T
): WrapResult<T> {
  return {
    type,
    text,
    media: { photos: collectPhotosFromRaw(msg.__raw ?? msg) }, // <- беремо з raw
    meta: {
      id: msg.id,
      peer: msg.peer, // <-- важливо для форварду
      dateUnix: toUnixSeconds(msg.date ?? null),
      dateISO: toIso(msg.date),
    },
    data,
  };
}
// --- parsers -----------------------------------------------

type Side = "LONG" | "SHORT";

type Entry = { price: number } | { from: number; to: number };

type Signal = {
  type: "signal";
  ticker: string;
  side: Side;
  entry: Entry | null;
  take: number[];
  stop: number | null;
  leverage: number | null;
};

function parseSignal(text: string): Signal | null {
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
  let entry: Signal["entry"] = null;
  if (entryM) {
    const n1 = toNum(entryM[1]);
    const n2 = entryM[2] ? toNum(entryM[2]) : null;
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
      const n = toNum(chunk.trim());
      if (n !== null) takeVals.push(n);
    }
  }

  const leverage = levM ? Number.parseInt(levM[1], 10) : null;
  const stop = stopM ? toNum(stopM[1]) : null;

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

type SignalUpdate = {
  type: "signal_update";
  update: {
    moveStop?: boolean;
    addMargin?: boolean;
    closeOrFix?: boolean;
  };
};

function parseSignalUpdate(text: string): SignalUpdate | null {
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

type Daily = { type: "daily" };

function parseDaily(text: string): Daily | null {
  return DAILY_RE.test(text) ? { type: "daily" } : null;
}

type Review = {
  type: "review";
  primary: string;
  timeframe: string | null;
};

export function parseReview(text: string): Review | null {
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

// --- adapter & classifier ----------------------------------

function adaptMsg(msg: RawMessage) {
  return {
    id: (msg as any).id as number,
    date: (msg as any).date, // Date або unix seconds
    hasMedia: Boolean((msg as any).media),
    mediaType: (msg as any).photo ? "photo" : undefined,
    albumId: (msg as any).groupedId ?? null,
    peer: (msg as any).peerId as Api.TypePeer, // <-- ДОДАЛИ
    __raw: msg, // сирий меседж для фоток
  };
}

export function classifyAndExtract(msg: RawMessage) {
  const rawText: string = (msg as any).text
    ? String((msg as any).text).trim()
    : "";
  const text: string = replaceLinks(rawText);
  const adapted = { ...adaptMsg(msg), __raw: msg };

  const upd = parseSignalUpdate(rawText);
  if (upd) {
    return wrapResult("signal_update", text, adapted, {
      moveStop: !!upd.update.moveStop,
      addMargin: !!upd.update.addMargin,
      closeOrFix: !!upd.update.closeOrFix,
    });
  }

  const sig = parseSignal(rawText);
  if (sig) {
    return wrapResult("signal", text, adapted, {
      ticker: sig.ticker,
      side: sig.side,
      entry: sig.entry,
      take: sig.take,
      stop: sig.stop,
      leverage: sig.leverage,
    });
  }

  const daily = parseDaily(rawText);
  if (daily) {
    return wrapResult("daily", text, adapted, {});
  }

  const review = parseReview(rawText);
  if (review) {
    return wrapResult("review", text, adapted, {
      primary: review.primary,
      timeframe: review.timeframe,
    });
  }

  return null;
}
