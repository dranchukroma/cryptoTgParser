// helpers/checkMessageSource.js
import client from '../config/botInstance.js';
import { Api } from 'telegram/tl/index.js';
import { chanelsToParse } from '../config/constants.js';

/**
 * Перевіряє, чи повідомлення з одного з джерел (ID '-100…' або '@username').
 * Повертає деталі збігу для логування/аналітики.
 *
 * @param {any} msg - event.message з GramJS
 * @param {string[]} [sources=chanelsToParse]
 * @returns {Promise<{ ok: boolean, by: 'id'|'username'|null, matched: string|null, index: number|null }>}
 */
export async function messageSourceDetailed(msg, sources = chanelsToParse) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return { ok: false, by: null, matched: null, index: null };
  }

  // Нормалізація + індексація джерел для зручного логування
  const normalized = sources
    .map(s => String(s).trim())
    .filter(Boolean);

  const ids = new Set();           // '-100…'
  const usernames = new Set();     // '@name' (у lowerCase)
  const indexByValue = new Map();  // значення → позиція в масиві sources

  normalized.forEach((s, idx) => {
    if (s.startsWith('@')) {
      const key = s.toLowerCase();
      usernames.add(key);
      indexByValue.set(key, idx);
    } else {
      ids.add(s);
      indexByValue.set(s, idx);
    }
  });

  // 1) Перевірка по channelId → '-100{value}'
  const peerIdVal = msg?.peerId?.channelId?.value;
  if (peerIdVal) {
    const currentId = `-100${peerIdVal}`;
    if (ids.has(currentId)) {
      return { ok: true, by: 'id', matched: currentId, index: indexByValue.get(currentId) ?? null };
    }
  }

  // 2) Перевірка по @username (уникаємо зайвого getEntity, якщо вже є msg.chat.username)
  if (usernames.size && msg?.peerId instanceof Api.PeerChannel) {
    try {
      let uname = null;
      if (msg?.chat?.username) {
        uname = `@${msg.chat.username}`.toLowerCase();
      } else {
        const ent = await client.getEntity(msg.peerId);
        if (ent?.username) uname = `@${ent.username}`.toLowerCase();
      }
      if (uname && usernames.has(uname)) {
        return { ok: true, by: 'username', matched: uname, index: indexByValue.get(uname) ?? null };
      }
    } catch {
      // ігноруємо помилку резолву
    }
  }

  return { ok: false, by: null, matched: null, index: null };
}

/**
 * Шорткат: повертає лише boolean.
 * @param {any} msg
 * @param {string[]} [sources]
 * @returns {Promise<boolean>}
 */
export async function messageSource(msg, sources = chanelsToParse) {
  const { ok } = await messageSourceDetailed(msg, sources);
  return ok;
}

export default messageSourceDetailed;
