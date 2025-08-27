import type { Photo } from "./types.js";

export function collectPhotosFromRaw(raw: any): Photo | null {
  if (raw?.media?.photo) {
    const photo = raw.media.photo;
    return {
      photoId: photo.id?.value,
      accessHash: photo.accessHash?.value,
      messageId: raw.id,
      fileReference: photo.fileReference,
      dcId: photo.dcId,
      sourcePeer: raw.peerId,
      mediaType: "photo",
      groupedId: raw?.groupedId?.value || null,
    };
  }

  return null ;
}
