// scripts/fetchHistory.js
import 'dotenv/config.js';
import { fetchRecentMessages } from '../config/botInstance.js';

(async () => {
  const CHANNEL = process.env.CHANNEL_ID; // '@username' або '-100…'
  const LIMIT = Number(process.env.HISTORY_LIMIT || 5000);

  const messages = await fetchRecentMessages({
    channel: CHANNEL,
    limit: LIMIT,
    includeService: false,
    saveToPath: 'exported_messages.json', // прибери або зміни шлях, якщо треба
  });

  console.log(`✅ Готово: збережено ${messages.length} повідомлень у exported_messages.json`);
})();
