import type { DownloadedImage } from "../../types/images.js";
import { detectTemplate } from "./templates.js";

export async function formatMedia(
  images: DownloadedImage[] | null
): Promise<DownloadedImage[] | null> {
  if (!images) return null;
  for (const i in images) {
    const tpl = await detectTemplate(images[i].data);
    if (!tpl) {
      continue;
    }
    images[i].data = await tpl.transform(images[i].data);
  }
  return images;
}