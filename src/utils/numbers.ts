export const toNum = (s: string): number | null => {
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };