/**
 * Search service for Hebrew and Greek lexicons
 * Handles keyword and Strong's number searches
 */

interface SearchResult {
  strongs: string;
  hebrew?: string;
  greek?: string;
  transliteration: string;
  meaning: string;
  kjv: string;
  lang: "H" | "G";
}

let hebrewCache: Record<string, any> | null = null;
let greekCache: Record<string, any> | null = null;

async function loadHebrew() {
  if (!hebrewCache) {
    hebrewCache = await import("@/assets/data/hebrew.json").then((m) => m.default);
  }
  return hebrewCache;
}

async function loadGreek() {
  if (!greekCache) {
    greekCache = await import("@/assets/data/greek.json").then((m) => m.default);
  }
  return greekCache;
}

export async function searchLexicon(query: string, limit = 50): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const q = query.trim().toLowerCase();
  const isStrongs = /^[hg]?\d+/i.test(q);
  const results: SearchResult[] = [];

  try {
    const [hebrew, greek] = await Promise.all([loadHebrew(), loadGreek()]);

    const searchInLexicon = (lex: Record<string, any>, langCode: "H" | "G") => {
      if (results.length >= limit) return;

      for (const [key, entry] of Object.entries(lex)) {
        if (results.length >= limit) break;

        const meaning = (entry.meaning || "").toLowerCase();
        const kjvText = (entry.kjv || "").toLowerCase();
        const transliteration = (entry.transliteration || "").toLowerCase();
        const hebrewText = (entry.hebrew || "").toLowerCase();
        const greekText = (entry.greek || "").toLowerCase();

        // Match by Strong's number (e.g., 'H430', 'G3056', or just '430')
        const normalizedKey = key.toLowerCase();
        const normalizedQ = q.startsWith("h") || q.startsWith("g") ? q : langCode.toLowerCase() + q;

        if (isStrongs && (normalizedKey === normalizedQ || normalizedKey === q)) {
          results.push({
            strongs: key,
            hebrew: langCode === "H" ? entry.hebrew : undefined,
            greek: langCode === "G" ? entry.greek : undefined,
            transliteration: entry.transliteration || "",
            meaning: entry.meaning || "",
            kjv: entry.kjv || "",
            lang: langCode,
          });
          return; // Exact match found
        }

        // Match by keyword in any field
        if (!isStrongs && (meaning.includes(q) || kjvText.includes(q) || transliteration.includes(q) || hebrewText.includes(q) || greekText.includes(q))) {
          results.push({
            strongs: key,
            hebrew: langCode === "H" ? entry.hebrew : undefined,
            greek: langCode === "G" ? entry.greek : undefined,
            transliteration: entry.transliteration || "",
            meaning: entry.meaning || "",
            kjv: entry.kjv || "",
            lang: langCode,
          });
        }
      }
    };

    // Search Hebrew first, then Greek
    if (hebrew) searchInLexicon(hebrew, "H");
    if (greek) searchInLexicon(greek, "G");

    return results;
  } catch (error) {
    console.error("[Search] Error:", error);
    return [];
  }
}
