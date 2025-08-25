// helpers/checkMessageSource.js

import { Api } from "telegram";
import client from "../../config/botInstance.js";
import type { RawMessage } from "../../index.js";

type MessageSourceResult = {
  ok: boolean;
  by: "id" | "username" | null;
  matched: string | null;
  index: number | null;
};


/**
 * Checks, if message is from allowed chanels list to parse source.
 * It can be group id ('-100...'), username ('@username) or chat id
 * Return detail of match for loggining
 */
export async function messageSourceDetailed(
  msg: RawMessage,
  sources: string[]
): Promise<MessageSourceResult> {
  const cleanSource = sources.filter(Boolean); // Delete null and empty records

  if (msg?.peerId instanceof Api.PeerChannel) {
    const peerIdVal: number | undefined = Number(msg?.peerId.channelId);

    if (peerIdVal !== undefined) {
      const currentId = `-100${peerIdVal}`;
      const index: number = cleanSource.findIndex((s) => s === currentId);
      if (index !== -1)
        return { ok: true, by: "id", matched: cleanSource[index], index };
    }

    // 2) Check by @username
    try {
      let uname: string | undefined;

      // 1) швидка перевірка — чи є username прямо в повідомленні
      if (msg?.chat && "username" in msg.chat && msg.chat.username) {
        uname = `@${msg.chat.username}`.toLowerCase();
      } else {
        const ent = await client.getEntity(msg.peerId);
        if ("username" in ent && ent.username) {
          uname = `@${ent.username}`.toLowerCase();
        }
      }

      if (uname) {
        const index = cleanSource.findIndex((s) => s.toLowerCase() === uname);
        if (index !== -1)
          return { ok: true, by: "username", matched: cleanSource[index], index };
      }
    } catch (e) {
      console.error("Checking message source failed: ", e);
    }
  }

  return { ok: false, by: null, matched: null, index: null };
}

export default messageSourceDetailed;
