import type { Api } from "telegram";

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

export type Entry = { price: number } | { from: number; to: number };

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