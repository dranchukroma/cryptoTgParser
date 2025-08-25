// scripts/listenNew.js
import "dotenv/config.js";
import client from "./config/botInstance.js";
import { NewMessage } from "telegram/events/index.js";
import { chanelsToParse } from "./config/constants.js";

import messageSourceDetailed from "./features/source/checkMessageSource.js";
import type { Api } from "telegram";
import { classifyAndExtract } from "./features/parse/parseMessages.js";
import { formatMessage } from "./features/format/formatMessage.js";

import { CustomFile } from "telegram/client/uploads.js";

export type RawMessage = Api.Message | Api.MessageService;

const TARGET = (process.env.SEND_MESSAGES_TO || "").trim();

// Loop event
(async () => {
  console.log("🟢 Listening new messages...");

  // Creating message listener
  client.addEventHandler(async (event) => {
    const msg = event.message; // Get message

    // Check if message is from correct group
    const isSourceGroup = await messageSourceDetailed(msg, chanelsToParse);

    if (!isSourceGroup.ok) return;

    // Parse and format messages
    const parsedMessage = classifyAndExtract(msg);
    console.log(JSON.stringify(parsedMessage, null, 2));
    if (!parsedMessage) return; // If format is not compare with REDEX ignore message
    const formatted = formatMessage(parsedMessage).text; // Format messages function

    // Send formated message to target group
    try {
      if (TARGET) {
        if (parsedMessage.media.photos.length > 0) {
          // handle messages here
        } else {
          await client.sendMessage(TARGET, { message: formatted });
          console.log(`✉️ Sent text to ${TARGET}`);
        }
      }
    } catch (e) {
      console.error(`❌ Message has not been send to ${TARGET}:`, e);
    }
  }, new NewMessage({}));
})();
