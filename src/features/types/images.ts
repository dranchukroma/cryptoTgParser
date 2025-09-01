import type { Sharp } from "sharp";
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

export type RGBBuffer = Buffer | Uint8Array;
export type DetectFn = (img: Sharp) => Promise<boolean>;
export type TransformFn = (imgBuffer: Buffer) => Promise<Buffer>;
export type TemplateActions = 'binxSignal'

export interface DetectedTemplate {
  id: string;
  action: string;
  transform: TransformFn;
}

export interface TemplateDef {
  id: string;
  detect: DetectFn;
  transform: TransformFn;
  action: TemplateActions;
}