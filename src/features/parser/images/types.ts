export type MediaType = "photo";

export type Photo = {
  photoId: string; // id конкретного повідомлення з фото
  accessHash: string; // id конкретного повідомлення з фото
  mediaType: MediaType;
}

export type PhotoInfo = {
  photo: Photo | null;
  groupedId: string | null; // ідентифікатор альбому (або null)
};
