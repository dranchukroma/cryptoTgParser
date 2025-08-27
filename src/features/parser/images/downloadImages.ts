import client from "../../../config/botInstance.js";
import type { DownloadedImage, Photo } from "./types.js";

export async function downloadImages(
  media: Photo[] | null
): Promise<DownloadedImage[] | null> {
  if (!media || media.length === 0) return null;

  if (isSingle(media)) {
    let imgDownloaded = null;
    try {
      imgDownloaded = await downloadOne(media[0]);
    } catch (error) {}

    return imgDownloaded ? [imgDownloaded] : null;
  } else if (isAlbum(media)) {
    let imgsDownloaded = null;
    try {
      imgsDownloaded = await downloadMany(media);
    } catch (error) {}

    return imgsDownloaded;
  } else {
    console.error("Downloading images failed, media: ", media);
    return null;
  }
}

const isAlbum = (media: Photo[]) =>
  !!media[0].groupedId &&
  media.every((m) => m.groupedId === media[0].groupedId) &&
  media.length >= 2;

const isSingle = (media: Photo[]) =>
  media.length === 1 && media[0].groupedId == null;

// Download one image
export async function downloadOne(
  photo: Photo
): Promise<DownloadedImage | null> {
  const inputPeer = await client.getInputEntity(photo.sourcePeer);
  if (!inputPeer) {
    console.error(
      `Downloading photo ${photo.photoId} failed, inputPeer is ${inputPeer}`
    );
    return null;
  }

  const [msg] = await client.getMessages(inputPeer, { ids: photo.messageId });
  if (!msg) {
    console.error(`Downloading photo ${photo.photoId} failed, msg is ${msg}`);
    return null;
  }

  const mediaData = await client.downloadMedia(msg);
  if (!mediaData || typeof mediaData === "string") {
    console.error(`Failed to download media for message ${photo.messageId}`);
    return null;
  }
  const data: Buffer = mediaData;
  const filename = `${photo.groupedId ?? "single"}-${photo.messageId}.jpg`;

  return {
    data,
    filename,
    messageId: photo.messageId,
    groupedId: photo.groupedId,
    mime: "image/jpeg",
  };
}

// Download many images
export async function downloadMany(
  photos: Photo[],
  parallel = 3
): Promise<DownloadedImage[]> {
  // Порядок фіксуємо за messageId (стабільно для Telegram)
  const ordered = [...photos].sort((a, b) => a.messageId - b.messageId);

  const out: DownloadedImage[] = [];
  for (let i = 0; i < ordered.length; i += parallel) {
    const chunk = ordered.slice(i, i + parallel);
    const part = await Promise.all(chunk.map((p) => downloadOne(p)));
    const filteredPart = part.filter(
      (item): item is DownloadedImage => item !== null
    );
    out.push(...filteredPart);
  }
  return out;
}