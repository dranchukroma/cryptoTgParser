export type PhotoInfo = {
  messageId: number; // id самого повідомлення з фото
  groupedId: string | number | null; // ідентифікатор альбому (якщо є)
  mediaType: "photo";
};
