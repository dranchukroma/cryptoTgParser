import type { RawMessage } from "../../index.js";
import { replaceLinks } from "../../utils/links.js";
import { adaptMsg, wrapResult } from "./helpers.js";
import { collectPhotosFromRaw } from "./images/parseImages.js";
import type { Photo } from "./images/types.js";
import {
  parseDaily,
  parseReview,
  parseSignal,
  parseSignalUpdate,
} from "./messages/parseMessages.js";
import type { WrapResult } from "./messages/types.js";

const collectedPhotos = new Map<string, Photo[]>();
const lastSeen = new Map<string, number>(); // час останнього фото по groupId
const albumToken = new Map<string, number>(); // версія виклику для скасування попередніх
const parsedResultWithoutPhotos = new Map(); // версія виклику для скасування попередніх

type parseEventType = WrapResult & { media: Photo[] | null };

export async function parseEventData(
  msg: RawMessage
): Promise<parseEventType | null> {
  const rawText: string = (msg as any).text
    ? String((msg as any).text).trim()
    : "";
  const text: string = replaceLinks(rawText);
  const adapted = adaptMsg(msg);

  // Parse message text
  let parseEventResult = null;
  const upd = parseSignalUpdate(rawText);
  if (upd) {
    parseEventResult = {
      ...wrapResult("signal_update", text, adapted, {
        moveStop: !!upd.update.moveStop,
        addMargin: !!upd.update.addMargin,
        closeOrFix: !!upd.update.closeOrFix,
      }),
      media: null,
    };
  }

  const sig = parseSignal(rawText);
  if (sig) {
    parseEventResult = {
      ...wrapResult("signal", text, adapted, {
        ticker: sig.ticker,
        side: sig.side,
        entry: sig.entry,
        take: sig.take,
        stop: sig.stop,
        leverage: sig.leverage,
      }),
      media: null,
    };
  }

  const daily = parseDaily(rawText);
  if (daily) {
    parseEventResult = {
      ...wrapResult("daily", text, adapted, {}),
      media: null,
    };
  }

  const review = parseReview(rawText);
  if (review) {
    parseEventResult = {
      ...wrapResult("review", text, adapted, {
        primary: review.primary,
        timeframe: review.timeframe,
      }),
      media: null,
    };
  }

  // Parse media
  const imageData = collectPhotosFromRaw(msg);

  if (imageData && imageData.groupedId) {
    const id: string = imageData.groupedId;

    if (!collectedPhotos.has(id)) {
      parsedResultWithoutPhotos.set(id, parseEventResult);
    }

    // 1) додати фото в колекцію
    const prev = collectedPhotos.get(id) ?? [];
    collectedPhotos.set(id, [...prev, imageData]);

    // 2) позначити час останнього фото та інкрементнути "версію"
    lastSeen.set(id, Date.now());
    const myToken = (albumToken.get(id) ?? 0) + 1;
    albumToken.set(id, myToken);

    // 3) чекати, поки 2 секунди не буде нових фото для цього id
    while (Date.now() - (lastSeen.get(id) ?? 0) < 2000) {
      // якщо прийшло нове фото (версія змінилась) — завершуємо цей виклик без результату
      if (albumToken.get(id) !== myToken) return null;
      await new Promise((res) => setTimeout(res, 50));
    }

    // перед самим поверненням ще раз перевіримо, що ми досі актуальні
    // console.log("return 2: ", albumToken);
    if (albumToken.get(id) !== myToken) return null;

    const photos = collectedPhotos.get(id) ?? null;

    console.log(parsedResultWithoutPhotos.has(id))
    if(parsedResultWithoutPhotos.has(id)){
      parseEventResult = parsedResultWithoutPhotos.get(id);
    }

    // прибираємо службові записи
    collectedPhotos.delete(id);
    lastSeen.delete(id);
    albumToken.delete(id);
    parsedResultWithoutPhotos.delete(id)

    console.log("return 3: ");
    return parseEventResult ? { ...parseEventResult, media: photos } : null;
  }

  // якщо є одиночне фото без groupedId — обгортаємо в масив
  if (imageData) {
    // console.log("return 5: одиночне фото");
    return parseEventResult
      ? { ...parseEventResult, media: [imageData] }
      : null;
  }

  // без фото — повертаємо як є
  console.log("return 6: без фото");
  return parseEventResult;
}
