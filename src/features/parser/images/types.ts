import { Api } from "telegram";

export type MediaType = "photo";

export type Peer = Api.PeerChannel | Api.PeerChat;

export type Photo = {
  photoId: string;
  accessHash: string;
  messageId: number;
  fileReference: Buffer;
  dcId: number;
  sourcePeer: Peer;
  mediaType: MediaType;
  groupedId: string | null;
};

export type DownloadedImage = {
  data: Buffer;
  filename: string;
  messageId: number;
  groupedId: string | null;
  mime: "image/jpeg";
};