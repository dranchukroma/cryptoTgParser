import client from "../../config/botInstance.js";
import type { DownloadedImage } from "../types/images.js";
import { chanelsToSend as targetGroups } from "../../config/constants.js";
import type { parseMessageType } from "../types/messages.js";
import { sendMultiPhotos, sendSinglePhoto } from "./media.js";

export async function sendMessage(
  message: string | null,
  images: DownloadedImage[] | null,
  msgType: parseMessageType | null
) {
  if (!targetGroups && targetGroups === 0)
    throw new Error("Target groups doesn't exist");
  try {
    for (const group in targetGroups) {
      let msgId = null;
      if (images && images.length > 0) {
        if (images.length === 1) {
          msgId = (
            await sendSinglePhoto(targetGroups[group], images[0], message || "")
          ).id;
        } else {
          msgId = (
            await sendMultiPhotos(targetGroups[group], images, message || "")
          ).id;
        }
      } else if (message) {
        msgId = (await client.sendMessage(targetGroups[group], { message })).id;
      }
      if (msgType === "signal" && msgId) {
        await client.pinMessage(targetGroups[group], msgId);
      }
      await delay();
    }
  } catch (error) {
    console.log("send Message failed: ", error);
  }
}

export const delay = (ms = 2000) =>
  new Promise((resolve) => setTimeout(resolve, ms));