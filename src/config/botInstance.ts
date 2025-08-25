
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

const apiId: number = Number(process.env.API_ID);
const apiHash: string = process.env.API_HASH || '';
const sessionString: string = process.env.SESSION_STRING || '';

if (!apiId || !apiHash || !sessionString) {
  throw new Error("Missing Telegram API credentials in .env");
}

if (Number.isNaN(apiId)) {
  throw new Error("API_ID must be a valid number");
}

const client = new TelegramClient(
  new StringSession(sessionString),
  apiId,
  apiHash,
  { connectionRetries: 5 }
);

await client.start({
  phoneNumber: async () => '',
  password: async () => '',
  phoneCode: async () => '',
  onError: (err) => console.error(err)
});

export default client;