// scripts/listenNew.js
import "dotenv/config.js";
import client from "./config/botInstance.js";
import { NewMessage } from "telegram/events/index.js";
import { chanelsToParse } from "./config/constants.js";

import messageSourceDetailed from "./features/checker/checkMessageSource.js";
import type { Api } from "telegram";

import { parseEventData } from "./features/parser/index.js";
import { formatMessage } from "./features/formatter/formatMessage.js";

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
    const parsedMessage = parseEventData(msg);
    // console.log(JSON.stringify(parsedMessage, null, 2));
    console.log(JSON.stringify(msg, null, 2));

    if (!parsedMessage) return; // If format is not compare with REDEX ignore message
    const formattedMsgText = formatMessage(parsedMessage).text; // Format messages function

    // Send formated message to target group
    try {
      if (TARGET) {
        if (parsedMessage.media.photos.length > 0) {
          // handle messages here
        } else {
          await client.sendMessage(TARGET, { message: formattedMsgText });
          console.log(`✉️ Sent text to ${TARGET}`);
        }
      }
    } catch (e) {
      console.error(`❌ Message has not been send to ${TARGET}:`, e);
    }
  }, new NewMessage({}));
})();

//client.pinMessage() -- закріплення повідомлення

//Test1
const obj1 = {
  id: 183,
  date: 1756208821,
  message: "Test 1 - no photo",
  media: null,
  groupedId: null,
  className: "Message",
};
//Test2
const obj2 = {
  id: 184,
  date: 1756208859,
  message: "Test 2 - 1 photo",
  media: {
    flags: 1,
    spoiler: false,
    photo: {
      flags: 0,
      hasStickers: false,
      id: "5285455762153412883",
      accessHash: "-7493337284877842185",
      fileReference: {
        type: "Buffer",
        data: [
          5, 0, 0, 0, 0, 164, 67, 24, 205, 0, 0, 0, 184, 104, 173, 158, 219,
          153, 55, 63, 24, 9, 70, 130, 40, 47, 203, 89, 75, 84, 58, 172, 235,
        ],
      },
      date: 1756042687,
      sizes: [
        {
          type: "i",
          bytes: {
            type: "Buffer",
            data: [
              1, 40, 40, 203, 71, 140, 0, 26, 44, 159, 93, 216, 205, 71, 82, 42,
              169, 65, 144, 51, 254, 254, 40, 59, 1, 198, 222, 127, 223, 226,
              152, 17, 211, 208, 2, 27, 60, 28, 113, 73, 141, 204, 113, 129,
              248, 210, 96, 147, 129, 201, 246, 160, 67, 230, 134, 72, 88, 44,
              131, 4, 140, 245, 162, 152, 197, 137, 195, 103, 35, 214, 138, 53,
              24, 191, 38, 209, 193, 207, 122, 127, 238, 207, 3, 53, 24, 108,
              12, 127, 90, 93, 231, 182, 127, 58, 5, 97, 195, 110, 112, 87, 30,
              149, 46, 50, 65, 7, 149, 232, 49, 81, 60, 165, 215, 4, 127, 227,
              196, 211, 243, 251, 181, 198, 50, 195, 7, 243, 160, 99, 137, 93,
              251, 183, 18, 92, 115, 197, 20, 196, 76, 174, 253, 227, 131, 128,
              51, 205, 21, 72, 8, 134, 222, 51, 74, 74, 99, 129, 207, 214, 138,
              42, 0, 96, 167, 13, 135, 57, 226, 138, 40, 2, 206, 219, 79, 177,
              49, 222, 126, 209, 158, 7, 56, 235, 255, 0, 235, 162, 138, 40, 3,
            ],
          },
          className: "PhotoStrippedSize",
        },
        {
          type: "m",
          w: 320,
          h: 320,
          size: 22785,
          className: "PhotoSize",
        },
        {
          type: "x",
          w: 800,
          h: 800,
          size: 80117,
          className: "PhotoSize",
        },
        {
          type: "y",
          w: 1280,
          h: 1280,
          sizes: [13103, 30814, 46842, 66094, 107781],
          className: "PhotoSizeProgressive",
        },
      ],
      videoSizes: null,
      dcId: 2,
      className: "Photo",
    },
    ttlSeconds: null,
    className: "MessageMediaPhoto",
  },
  groupedId: null,
  className: "Message",
};
//Test 3
const obj3 = {
  id: 187,
  date: 1756208961,
  message: "Test 3 - 2 photo",
  media: {
    flags: 1,
    spoiler: false,
    photo: {
      flags: 0,
      hasStickers: false,
      id: "5285455762153412883",
      accessHash: "-7493337284877842185",
      fileReference: {
        type: "Buffer",
        data: [
          5, 0, 0, 0, 0, 164, 67, 24, 205, 0, 0, 0, 187, 104, 173, 159, 65, 48,
          86, 44, 3, 222, 157, 86, 237, 201, 116, 98, 56, 89, 87, 205, 107,
        ],
      },
      date: 1756042687,
      sizes: [
        {
          type: "i",
          bytes: {
            type: "Buffer",
            data: [
              1, 40, 40, 203, 71, 140, 0, 26, 44, 159, 93, 216, 205, 71, 82, 42,
              169, 65, 144, 51, 254, 254, 40, 59, 1, 198, 222, 127, 223, 226,
              152, 17, 211, 208, 2, 27, 60, 28, 113, 73, 141, 204, 113, 129,
              248, 210, 96, 147, 129, 201, 246, 160, 67, 230, 134, 72, 88, 44,
              131, 4, 140, 245, 162, 152, 197, 137, 195, 103, 35, 214, 138, 53,
              24, 191, 38, 209, 193, 207, 122, 127, 238, 207, 3, 53, 24, 108,
              12, 127, 90, 93, 231, 182, 127, 58, 5, 97, 195, 110, 112, 87, 30,
              149, 46, 50, 65, 7, 149, 232, 49, 81, 60, 165, 215, 4, 127, 227,
              196, 211, 243, 251, 181, 198, 50, 195, 7, 243, 160, 99, 137, 93,
              251, 183, 18, 92, 115, 197, 20, 196, 76, 174, 253, 227, 131, 128,
              51, 205, 21, 72, 8, 134, 222, 51, 74, 74, 99, 129, 207, 214, 138,
              42, 0, 96, 167, 13, 135, 57, 226, 138, 40, 2, 206, 219, 79, 177,
              49, 222, 126, 209, 158, 7, 56, 235, 255, 0, 235, 162, 138, 40, 3,
            ],
          },
          className: "PhotoStrippedSize",
        },
        {
          type: "m",
          w: 320,
          h: 320,
          size: 22785,
          className: "PhotoSize",
        },
        {
          type: "x",
          w: 800,
          h: 800,
          size: 80117,
          className: "PhotoSize",
        },
        {
          type: "y",
          w: 1280,
          h: 1280,
          sizes: [13103, 30814, 46842, 66094, 107781],
          className: "PhotoSizeProgressive",
        },
      ],
      videoSizes: null,
      dcId: 2,
      className: "Photo",
    },
    ttlSeconds: null,
    className: "MessageMediaPhoto",
  },
  groupedId: "14049671692874274",
  className: "Message",
};
const obj4 = {
  id: 188,
  date: 1756208961,
  message: "",
  media: {
    flags: 1,
    spoiler: false,
    photo: {
      flags: 0,
      hasStickers: false,
      id: "5285455762153412903",
      accessHash: "-4919021835535725303",
      fileReference: {
        type: "Buffer",
        data: [
          5, 0, 0, 0, 0, 164, 67, 24, 205, 0, 0, 0, 188, 104, 173, 159, 65, 216,
          201, 158, 33, 108, 14, 87, 202, 197, 193, 27, 69, 216, 35, 73, 228,
        ],
      },
      date: 1756043322,
      sizes: [
        {
          type: "i",
          bytes: {
            type: "Buffer",
            data: [
              1, 40, 40, 203, 71, 140, 0, 26, 44, 159, 93, 216, 205, 71, 82, 32,
              82, 163, 32, 103, 253, 252, 81, 242, 103, 27, 121, 255, 0, 123,
              138, 96, 71, 78, 64, 8, 108, 240, 113, 197, 5, 114, 78, 48, 0,
              237, 154, 104, 4, 156, 14, 244, 8, 146, 104, 100, 133, 130, 200,
              48, 72, 207, 90, 41, 140, 88, 156, 54, 114, 61, 104, 163, 81, 142,
              27, 54, 242, 57, 231, 154, 113, 242, 243, 192, 53, 24, 108, 12,
              127, 90, 93, 231, 182, 127, 58, 5, 97, 255, 0, 187, 45, 247, 72,
              244, 169, 49, 146, 8, 60, 175, 65, 138, 134, 73, 12, 152, 200,
              233, 238, 77, 73, 159, 221, 174, 49, 150, 24, 63, 157, 8, 22, 131,
              137, 93, 249, 220, 73, 113, 207, 20, 83, 17, 50, 187, 247, 142,
              14, 0, 207, 52, 85, 33, 145, 13, 188, 102, 148, 148, 193, 192,
              231, 235, 69, 21, 0, 48, 83, 134, 195, 156, 241, 69, 20, 1, 103,
              109, 167, 216, 152, 239, 63, 104, 207, 3, 156, 117, 255, 0, 245,
              209, 69, 20, 1,
            ],
          },
          className: "PhotoStrippedSize",
        },
        {
          type: "m",
          w: 320,
          h: 320,
          size: 23079,
          className: "PhotoSize",
        },
        {
          type: "x",
          w: 800,
          h: 800,
          size: 80600,
          className: "PhotoSize",
        },
        {
          type: "y",
          w: 1280,
          h: 1280,
          sizes: [13117, 31018, 47410, 66733, 108823],
          className: "PhotoSizeProgressive",
        },
      ],
      videoSizes: null,
      dcId: 2,
      className: "Photo",
    },
    ttlSeconds: null,
    className: "MessageMediaPhoto",
  },
  groupedId: "14049671692874274",
  className: "Message",
};