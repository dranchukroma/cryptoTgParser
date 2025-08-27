import type { Peer, PhotoInfo } from "./types.js";

export function collectPhotosFromRaw(raw: any): PhotoInfo {

  if (raw?.media?.photo) {
    const photo = raw.media.photo;
    return {
      photo: {
        photoId: photo.id?.value,
        accessHash: photo.accessHash?.value,
        messageId: raw.id,
        fileReference: photo.fileReference,
        dcId: photo.dcId,
        sourcePeer: raw.peerId,
        mediaType: "photo",
      },
      groupedId: raw?.groupedId?.value || null,
    };
  }

  return { photo: null, groupedId: null };
}