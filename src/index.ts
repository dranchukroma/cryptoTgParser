import "dotenv/config.js";
import client from "./config/botInstance.js";
import { NewMessage } from "telegram/events/index.js";
import type { Api } from "telegram";

import { chanelsToParse } from "./config/constants.js";
import checkMessageSource from "./features/checker/checkMessageSource.js";
import { parseEventData } from "./features/parser/index.js";
import { formatMessage } from "./features/formatter/messages/index.js";
import { downloadImages } from "./features/parser/images/downloadImages.js";
import type { dataToFormat } from "./features/types/messages.js";
import { sendMessage } from "./features/sendler/index.js";

export type RawMessage = Api.Message | Api.MessageService;

// Loop event
(async () => {
  console.log("🟢 Listening new messages...");

  // Creating message listener
  client.addEventHandler(async (event) => {
    const msg = event.message; // Get message

    // Check if message is from correct group
    const isSourceGroup = await checkMessageSource(msg, chanelsToParse);
    if (!isSourceGroup.ok) return;

    // Parse and format messages
    const parsedEvent = await parseEventData(msg);
    if (!parsedEvent) return; // If format is not compare with REDEX ignore message
    // TO DO return empty only if messages and images are null

    // Download images
    const parsedImages = await downloadImages(parsedEvent.media); // Move it to parseEventData and here should be formatter;

    // Format messages
    const formattedMsgText = await formatMessage(
      parsedEvent.type,
      parsedEvent.text,
      parsedEvent.data as dataToFormat
    );

    // Send formated message to target group
    await sendMessage(formattedMsgText, parsedImages, parsedEvent.type);
  }, new NewMessage({}));
})();

//client.pinMessage() -- закріплення повідомлення