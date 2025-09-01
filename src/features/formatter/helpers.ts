import { priceDecimals } from "../../config/constants.js";

export function fmtNum(v: unknown, decimals = priceDecimals): string {
    if (v == null || Number.isNaN(Number(v))) return "—";
    const n = Number(v);
    return n.toFixed(decimals).replace(/\.?0+$/, "");
  }
  
  export function fmtList(nums: unknown, decimals = priceDecimals): string {
    if (!Array.isArray(nums) || nums.length === 0) return "";
    return nums.map((n) => fmtNum(n, decimals)).join(", ");
  }
  
  export function joinLines(lines: Array<string | undefined | null | false>): string {
    return lines.filter(Boolean).join("\n");
  }