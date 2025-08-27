import { Api } from "telegram";

export type MediaType = "photo";

// export type Peer = {
//   channelId?: Api.PeerChannel;
//   chatId?: Api.PeerChat;
// };

export type Peer = Api.PeerChannel | Api.PeerChat;

export type Photo = {
  photoId: number;
  accessHash: number;
  messageId: number;
  fileReference: Buffer;
  dcId: number;
  sourcePeer: Peer;
  mediaType: MediaType;
};

export type PhotoInfo = {
  photo: Photo | null;
  groupedId: string | null; // ідентифікатор альбому (або null)
};
