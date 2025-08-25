import type { PhotoInfo } from "./types.js";

export function collectPhotosFromRaw(raw: any): PhotoInfo[] {
    const photos: PhotoInfo[] = [];
    if (raw?.media && raw.photo) {
      photos.push({
        messageId: raw.id as number,
        groupedId: raw.groupedId ?? null,
        mediaType: "photo",
      });
    }
    return photos;
  }