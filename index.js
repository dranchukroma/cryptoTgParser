import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { NewMessage } from 'telegram/events/index.js'
import dotenv from 'dotenv';
dotenv.config();

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const channelId = process.env.CHANNEL_ID;
const sessionString = process.env.SESSION_STRING;



(async () => {
    const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start();

    client.addEventHandler(async (event) => {
        const message = event.message;
        const peerId = message?.peerId?.channelId?.value;

        // Якщо повідомлення з потрібного каналу
        if (`-100${peerId}` === channelId.toString() || channelId.toString().startsWith("@")) {
            console.log("------");
            console.log("📩 Нове повідомлення:");
            console.log("Текст:", message.message || "[без тексту]");
            console.log("Дата:", message.date);

            const targetChatId = '-1002528811587'
            try {
                if (message.message) {
                    await client.sendMessage(targetChatId, {
                        message: message.message
                    });
                }

                if (message.media) {
                    await client.sendFile(targetChatId, {
                        file: message.media,
                        caption: message.message || ''
                    });
                }

                console.log('📤 Повідомлення успішно опубліковано як нове');
            } catch (err) {
                console.error('❌ Помилка відправки:', err);
            }

    }
    }, new NewMessage({}));

}) ();