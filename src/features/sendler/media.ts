import client from "../../config/botInstance.js";
import { type Api } from "telegram";
import type { DownloadedImage } from "../types/images.js";
import { CustomFile } from "telegram/client/uploads.js";

/** Send one image as phonto (not document) */
export async function sendSinglePhoto(
  target: Api.TypeEntityLike,
  img: DownloadedImage,
  caption = ""
) {
    const image = new CustomFile(img.filename, img.data.length, '', img.data)
  return client.sendFile(target, {
    file: image,
    caption: caption,
  });
}

/** Send an album 2-10 images, caption is in captionIndex (default 0) */
export async function sendMultiPhotos(
  target: Api.TypeEntityLike,
  imgs: DownloadedImage[],
  caption = "",
  captionIndex = 0
) {
  if (imgs.length < 2) throw new Error("Album must have at least 2 photos");
  if (imgs.length > 10) throw new Error("Album can contain max 10 items");

  const peer = await client.getInputEntity(target);

  // зробимо так, щоб елемент з captionIndex став першим (sendFile ставить підпис на перше фото)
  const ordered = [...imgs];
  const idx = Math.max(0, Math.min(captionIndex, ordered.length - 1));
  if (idx !== 0) {
    const [picked] = ordered.splice(idx, 1);
    ordered.unshift(picked);
  }

  // перетворюємо буфери -> CustomFile
  const files = ordered.map(
    (img) => new CustomFile(img.filename, img.data.length, "", img.data)
  );

  // GramJS автоматично відправить як альбом
  return client.sendFile(peer, {
    file: files, // масив -> альбом
    caption, // підпис піде на перше фото (ми його підняли)
    workers: 1,
  });
}