import type { RawMessage } from "../../index.js";
import { replaceLinks } from "../../utils/links.js";
import { adaptMsg, wrapResult } from "./helpers.js";
import {
  parseDaily,
  parseReview,
  parseSignal,
  parseSignalUpdate,
} from "./messages/parseMessages.js";

export function parseEventData(msg: RawMessage) {
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
