export type MediaType = "photo";

export type PhotoInfo = {
  photoId: string; // id конкретного повідомлення з фото
  accessHash: string; // id конкретного повідомлення з фото
  groupedId: string | number | null; // ідентифікатор альбому (або null)
  mediaType: MediaType; // наразі тільки "photo"
};

export type Entry = { price: number } | { from: number; to: number };

export type SignalData = {
  ticker: string;
  side: "LONG" | "SHORT";
  entry: Entry | null;
  take: number[];
  stop: number | null;
  leverage: number | null;
};

export type SignalUpdateData = {
  moveStop?: boolean;
  addMargin?: boolean;
  closeOrFix?: boolean;
};

export type DailyData = Record<string, never>;

export type ReviewData = {
  primary: string;
  timeframe: string | null;
};

export type ParsedBase<T extends string, D> = {
  type: T;
  text: string; // вже з replaceLinks
  media: { photos: PhotoInfo[] }; // з classifyAndExtract
  meta: any; // джерело/peer/дати — лишаємо як any
  data: D;
};

export type ParsedSignal = ParsedBase<"signal", SignalData>;
export type ParsedSignalUpdate = ParsedBase<"signal_update", SignalUpdateData>;
export type ParsedDaily = ParsedBase<"daily", DailyData>;
export type ParsedReview = ParsedBase<"review", ReviewData>;
export type ParsedUnknown = ParsedBase<string, any>;

export type Parsed =
  | ParsedSignal
  | ParsedSignalUpdate
  | ParsedDaily
  | ParsedReview
  | ParsedUnknown;

export type FormattedOutput = {
  type: string;
  text: string;
  attachments: { photos: PhotoInfo[] };
  meta: any;
};

type RendererFn = (p: Parsed) => FormattedOutput;
