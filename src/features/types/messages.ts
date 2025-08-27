export type MediaType = "photo";

export type Entry = { price: number } | { from: number; to: number };

export type SignalData = {
  ticker: string;
  side: "LONG" | "SHORT";
  entry: Entry | null;
  take: number[];
  stop: number | null;
  leverage: number | null;
};

export type SignalUpdateData = {
  moveStop?: boolean;
  addMargin?: boolean;
  closeOrFix?: boolean;
};

export type DailyData = Record<string, never>;

export type ReviewData = {
  primary: string;
  timeframe: string | null;
};

export type ParsedBase<T extends string, D> = {
  type: T;
  text: string; // вже з replaceLinks
  media: { photos: Photo[] }; // з classifyAndExtract
  meta: any; // джерело/peer/дати — лишаємо як any
  data: D;
};

export type ParsedSignal = ParsedBase<"signal", SignalData>;
export type ParsedSignalUpdate = ParsedBase<"signal_update", SignalUpdateData>;
export type ParsedDaily = ParsedBase<"daily", DailyData>;
export type ParsedReview = ParsedBase<"review", ReviewData>;
export type ParsedUnknown = ParsedBase<string, any>;

export type Parsed =
  | ParsedSignal
  | ParsedSignalUpdate
  | ParsedDaily
  | ParsedReview
  | ParsedUnknown;

export type FormattedOutput = {
  type: string;
  text: string;
  attachments: { photos: Photo[] };
  meta: any;
};

export type RendererFn = (p: Parsed) => FormattedOutput;


import type { Api } from "telegram";
import type { Photo } from "./images.js";

export type WrapMeta = {
  id: number | string | undefined; // id «якорного» повідомлення
  peer?: import("telegram").Api.TypePeer; // звідки форвардити (канал/чат/peer)
  dateUnix: number | null;
  dateISO: string | null;
};

export type WrapResult<T = unknown> = {
  type: string;
  text: string;
  meta: WrapMeta;
  data: T;
};

export type MsgLike = {
  id?: string | number;
  date?: string | Date | number; // number теж дозволяємо (unix seconds)
  peer?: Api.TypePeer; // <-- додали
};

export type Side = "LONG" | "SHORT";

export type Signal = {
  type: "signal";
  ticker: string;
  side: Side;
  entry: Entry | null;
  take: number[];
  stop: number | null;
  leverage: number | null;
};

export type SignalUpdate = {
  type: "signal_update";
  update: {
    moveStop?: boolean;
    addMargin?: boolean;
    closeOrFix?: boolean;
  };
};

export type Review = {
  type: "review";
  primary: string;
  timeframe: string | null;
};

export type Daily = { type: "daily" };