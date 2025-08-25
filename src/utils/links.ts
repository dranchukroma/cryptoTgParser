const MY_LINK: string = process.env.MY_LINK || ""; //Link than will be replaced

export function replaceLinks(text: string) {
  if (!text) return text;
  if (!MY_LINK) return text.replace(/\bhttps?:\/\/\S+/gi, "");
  return text.replace(/\bhttps?:\/\/\S+/gi, MY_LINK);
}
