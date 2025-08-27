import { Api } from "telegram";
import type { Photo } from "./images.js";

export type dataToFormat = SignalData | SignalUpdateData | ReviewData | null;

export type parseEventType = WrapResult & { media: Photo[] | null };

export type parseMessageType = "signal" | "signal_update" | "review" | "daily"

export type WrapMeta = {
  id: number | string | undefined; // id «якорного» повідомлення
  peer?: Api.TypePeer; // звідки форвардити (канал/чат/peer)
  dateUnix: number | null;
  dateISO: string | null;
};

export type WrapResult<T = unknown> = {
  type: parseMessageType;
  text: string;
  meta: WrapMeta;
  data: T;
};

export type MsgLike = {
  id? : string | number;
  date?: string | Date | number;
  peer?: Api.PeerChannel | Api.PeerChat | Api.PeerUser;
}

export type Side = "LONG" | "SHORT";

export type Entry = { price: number } | { from: number; to: number };

export type SignalData = {
  ticker: string;
  side: Side;
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

export type ReviewData = {
  primary: string;
  timeframe: string | null;
};

// export type formatBase<T extends string, D> = {
//   type: T;
//   text: string;
//   meta: WrapMeta; // джерело/peer/дати — лишаємо як any
//   data: D;
//   media: Photo[];
// };