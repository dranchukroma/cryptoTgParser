import type { PhotoInfo } from "./types.js";

export function collectPhotosFromRaw(raw: any): PhotoInfo {
  if (raw?.media?.photo) {
    const photo = raw.media.photo;
    return {
      photo: {
        photoId: photo.id?.value as string,
        accessHash: photo.accessHash?.value,
        mediaType: 'photo', 
      },
      groupedId: raw?.groupedId?.value || null,
    }
  }

  return {photo: null, groupedId: null};
}