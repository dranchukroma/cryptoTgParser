// scripts/listenNew.js
import 'dotenv/config.js';
import client from './config/botInstance.js'
import { NewMessage } from 'telegram/events/index.js';
import { Api } from 'telegram/tl/index.js';
import { classifyAndExtract } from './helpers/parseMessages.js';
import { messageSourceDetailed } from './helpers/checkMessageSource.js';
import { formatMessage } from './helpers/formatMessage.js';

const TARGET = (process.env.SEND_MESSAGES_TO || '').trim(); // куди дублювати (опційно)

// Loop event
(async () => {
  await client.start();
  console.log('🟢 Listening new messages...');

  // Creating message listener
  client.addEventHandler(async (event) => {
    // Check if message is from correct group
    const msg = event.message;

    const isSourceGroup = await messageSourceDetailed(msg);
    if (!isSourceGroup.ok) return;

    // Parse and format messages
    const parsedMessage = classifyAndExtract(msg);
    if (!parsedMessage) return; // If format is compare with REDEX ignore message

    const formatedMessage = formatMessage(parsedMessage).text; // Format messages

    // Send formated message to target group
    if (TARGET) {
      try {
        await client.sendMessage(TARGET, { message: formatedMessage });
      } catch (e) {
        console.error(`❌ Message has not been send to ${TARGET}:`, e);
      }
    }
  }, new NewMessage({}));
})();