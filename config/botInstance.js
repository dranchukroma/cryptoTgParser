
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const sessionString = process.env.SESSION_STRING;

const client = new TelegramClient(
  new StringSession(sessionString),
  apiId,
  apiHash,
  { connectionRetries: 5 }
);

export default client;