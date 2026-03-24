/**
 * Text normalization utilities for fixing encoding issues and accent-insensitive search.
 */

// Map of common mojibake sequences (latin1 double-encoded as UTF-8)
const MOJIBAKE_MAP: [RegExp, string][] = [
  [/Ã£/g, "ã"],
  [/Ã¡/g, "á"],
  [/Ã©/g, "é"],
  [/Ã­/g, "í"],
  [/Ã³/g, "ó"],
  [/Ãº/g, "ú"],
  [/Ã§/g, "ç"],
  [/Ã¢/g, "â"],
  [/Ãª/g, "ê"],
  [/Ã´/g, "ô"],
  [/Ã¼/g, "ü"],
  [/Ã£o/g, "ão"],
  [/Ã£e/g, "ãe"],
  [/Ãµ/g, "õ"],
  [/Ã\u0083Â£/g, "ã"],
  [/Ã\u0083Â©/g, "é"],
  [/Ã\u0083Â§/g, "ç"],
  [/Ã\u0083Â¡/g, "á"],
  [/Ã\u0083Â³/g, "ó"],
  [/Ã\u0083Âº/g, "ú"],
  [/Ã\u0083Â­/g, "í"],
  [/Ã\u0080/g, "À"],
  [/Ã\u0081/g, "Á"],
  [/Ã\u0089/g, "É"],
  [/Ã\u008D/g, "Í"],
  [/Ã\u0093/g, "Ó"],
  [/Ã\u009A/g, "Ú"],
  [/Ã\u0087/g, "Ç"],
  [/Ã\u0082/g, "Â"],
  [/Ã\u008A/g, "Ê"],
  [/Ã\u0094/g, "Ô"],
  [/Ã\u0095/g, "Õ"],
  [/Ã\u0083/g, "Ã"],
];

/**
 * Fix mojibake (double-encoded latin1→UTF-8) in a string.
 * Returns the original string if no fix is needed.
 */
export function fixMojibake(text: string): string {
  if (!text) return text;
  let result = text;
  for (const [pattern, replacement] of MOJIBAKE_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Normalize text for accent-insensitive, case-insensitive search.
 * Strips accents, lowercases, trims.
 */
export function normalizeForSearch(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Normalize text for storage: fix mojibake + trim whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return text;
  return fixMojibake(text).trim();
}
