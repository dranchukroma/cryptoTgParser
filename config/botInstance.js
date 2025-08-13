// config/botInstance.js
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';
import fs from 'fs';

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const sessionString = process.env.SESSION_STRING;

// ── Базовий клієнт без слухачів ────────────────────────────────────────────────
const client = new TelegramClient(
  new StringSession(sessionString),
  apiId,
  apiHash,
  { connectionRetries: 5 }
);

// ── Хелпери для історії/парсингу ──────────────────────────────────────────────
function extractMediaInfo(message) {
  const info = {
    hasMedia: !!message.media,
    mediaType: null,            // 'photo' | 'document' | 'webpage' | 'other' | null
    fileName: null,
    mimeType: null,
    size: null,
    isAlbum: !!message.groupedId,
  };

  if (!message.media) return info;

  const media = message.media;
  const className = media?.className || media?._ || null;

  if (className === 'MessageMediaPhoto' || message.photo) {
    info.mediaType = 'photo';
  } else if (className === 'MessageMediaDocument' || message.document) {
    info.mediaType = 'document';
    const doc = message.document || media.document;
    const attributes = doc?.attributes || [];
    const nameAttr = attributes.find(a => a.fileName || a.className === 'DocumentAttributeFilename');
    info.fileName = nameAttr?.fileName || null;
    info.mimeType = doc?.mimeType || null;
    info.size = Number(doc?.size ?? null) || null;
  } else if (className === 'MessageMediaWebPage') {
    info.mediaType = 'webpage';
  } else {
    info.mediaType = 'other';
  }

  return info;
}

function normalizeMessage(message) {
  const media = extractMediaInfo(message);
  return {
    id: message.id,
    date: message.date?.toISOString?.() || String(message.date),
    text: message.message || null,
    hasMedia: media.hasMedia,
    mediaType: media.mediaType,
    fileName: media.fileName,
    mimeType: media.mimeType,
    size: media.size,
    albumId: message.groupedId ? String(message.groupedId) : null,
    replyToMsgId: message.replyTo?.replyToMsgId ?? null,
    fwdFrom: message.fwdFrom ? {
      fromName: message.fwdFrom?.fromName || null,
      fromId: message.fwdFrom?.fromId || null,
    } : null,
    views: typeof message.views === 'number' ? message.views : null,
    forwards: typeof message.forwards === 'number' ? message.forwards : null,
    entities: (message.entities || []).map(e => e.className || e._).slice(0, 20),
  };
}

async function resolvePeer(raw) {
  if (!raw) throw new Error('CHANNEL_ID is empty');
  if (String(raw).startsWith('@')) return raw;
  try {
    // -100… підтримується як BigInt
    return BigInt(raw);
  } catch {
    return raw;
  }
}

/**
 * Витягує останні повідомлення з каналу/чату.
 * @param {object} opts
 * @param {string|bigint} opts.channel - '@username' або '-100…'
 * @param {number} [opts.limit] - скільки тягнути (дефолт з ENV HISTORY_LIMIT або 5000)
 * @param {boolean} [opts.includeService=false] - чи включати службові повідомлення
 * @param {string|null} [opts.saveToPath=null] - шлях до JSON для збереження (опційно)
 * @returns {Promise<Array<object>>} масив нормалізованих повідомлень
 */
async function fetchRecentMessages({
  channel,
  limit = Number(process.env.HISTORY_LIMIT || 5000),
  includeService = false,
  saveToPath = null,
} = {}) {
  if (!client.connected) {
    // Якщо ви ще не робили client.start() у головному файлі — дозволимо зробити тут.
    await client.start();
  }

  const peer = await resolvePeer(channel);
  const entity = await client.getEntity(peer);

  const out = [];
  let count = 0;

  // iterMessages йде від нових до старих; limit — максимум записів
  for await (const msg of client.iterMessages(entity, { limit })) {
    if (!msg) continue;

    // Фільтрація службових (join/left/пін тощо), якщо includeService === false
    const isService = msg instanceof Api.MessageService;
    if (isService && !includeService) continue;

    out.push(normalizeMessage(msg));
    count++;
    // Легке тротлінг-логування без консольного шуму
    if (count % 1000 === 0) {
      // eslint-disable-next-line no-console
      console.log(`  …витягнуто ${count}`);
    }
  }

  if (saveToPath) {
    fs.writeFileSync(saveToPath, JSON.stringify(out, null, 2), 'utf8');
    // eslint-disable-next-line no-console
    console.log(`💾 Збережено ${out.length} повідомлень у ${saveToPath}`);
  }

  return out;
}

// Експорти
export default client;
export { fetchRecentMessages };
