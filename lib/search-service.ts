/**
 * Search service for Hebrew and Greek lexicons
 * Handles keyword and Strong's number searches
 */

interface SearchResult {
  strongs: string;
  lemma: string;
  xlit: string;
  strongs_def: string;
  kjv_def: string;
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
  const isStrongs = /^[hg]\d+/i.test(q);
  const results: SearchResult[] = [];

  try {
    const [hebrew, greek] = await Promise.all([loadHebrew(), loadGreek()]);

    const searchInLexicon = (lex: Record<string, any>, langCode: "H" | "G") => {
      if (results.length >= limit) return;

      for (const [key, entry] of Object.entries(lex)) {
        if (results.length >= limit) break;

        const def = (entry.strongs_def || "").toLowerCase();
        const kjv = (entry.kjv_def || "").toLowerCase();
        const xlit = (entry.xlit || "").toLowerCase();
        const lemma = (entry.lemma || "").toLowerCase();

        // Match by Strong's number
        if (isStrongs && key.toLowerCase() === q) {
          results.push({
            strongs: key,
            lemma: entry.lemma || "",
            xlit: entry.xlit || "",
            strongs_def: entry.strongs_def || "",
            kjv_def: entry.kjv_def || "",
            lang: langCode,
          });
          return; // Exact match found
        }

        // Match by keyword in any field
        if (!isStrongs && (def.includes(q) || kjv.includes(q) || xlit.includes(q) || lemma.includes(q))) {
          results.push({
            strongs: key,
            lemma: entry.lemma || "",
            xlit: entry.xlit || "",
            strongs_def: entry.strongs_def || "",
            kjv_def: entry.kjv_def || "",
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
