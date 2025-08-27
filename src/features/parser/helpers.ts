import type { Api } from "telegram";
import type { RawMessage } from "../../index.js";
import type { MsgLike, WrapResult, parseMessageType } from "../types/messages.js";

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

export function adaptMsg(msg: RawMessage) {
  return {
    id: (msg as any).id as number,
    date: (msg as any).date, // Date або unix seconds
    albumId: (msg as any).groupedId ?? null,
    peer: (msg as any).peerId as Api.TypePeer, // <-- ДОДАЛИ
  };
}

export function wrapResult<T = unknown>(
  type: parseMessageType,
  text: string,
  msg: MsgLike, // опціонально прокинемо сирий msg
  data: T = {} as T
): WrapResult<T> {
  return {
    type,
    text,
    meta: {
      id: msg.id,
      peer: msg.peer, // <-- важливо для форварду
      dateUnix: toUnixSeconds(msg.date ?? null),
      dateISO: toIso(msg.date),
    },
    data,
  };
}
