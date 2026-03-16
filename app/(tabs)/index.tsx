import { useState, useRef, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  FlatList, StyleSheet, Modal, Pressable, Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { GENESIS_1_1, JOHN_1_1, type WordData } from "@/lib/lexicon";

type Lang = "hebrew" | "greek" | "search";

interface SearchResult {
  strongs: string;
  lemma: string;
  xlit: string;
  strongs_def: string;
  kjv_def: string;
  lang: "H" | "G";
}

// Lazy-load the lexicons only when needed
let hebrewLex: Record<string, any> | null = null;
let greekLex: Record<string, any> | null = null;

async function getHebrew() {
  if (!hebrewLex) hebrewLex = require("../../assets/data/hebrew.json");
  return hebrewLex!;
}
async function getGreek() {
  if (!greekLex) greekLex = require("../../assets/data/greek.json");
  return greekLex!;
}

export default function StudyScreen() {
  const colors = useColors();
  const [lang, setLang] = useState<Lang>("hebrew");
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  const words = lang === "hebrew" ? GENESIS_1_1 : JOHN_1_1;
  const verseRef = lang === "hebrew" ? "Genesis 1:1 (Hebrew OT)" : "John 1:1 (Greek NT)";

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    const q = searchQuery.trim().toLowerCase();
    const isStrongs = /^[hg]\d+/i.test(q);

    const [heb, grk] = await Promise.all([getHebrew(), getGreek()]);
    const results: SearchResult[] = [];

    const searchIn = (lex: Record<string, any>, langCode: "H" | "G") => {
      for (const [key, entry] of Object.entries(lex)) {
        if (results.length >= 30) break;
        const def = (entry.strongs_def || "").toLowerCase();
        const kjv = (entry.kjv_def || "").toLowerCase();
        const xlit = (entry.xlit || "").toLowerCase();
        const lemma = (entry.lemma || "").toLowerCase();
        if (
          (isStrongs && key.toLowerCase() === q) ||
          (!isStrongs && (def.includes(q) || kjv.includes(q) || xlit.includes(q) || lemma.includes(q)))
        ) {
          results.push({ strongs: key, lemma: entry.lemma, xlit: entry.xlit, strongs_def: entry.strongs_def, kjv_def: entry.kjv_def, lang: langCode });
        }
      }
    };

    searchIn(heb, "H");
    searchIn(grk, "G");
    setSearchResults(results);
    setSearchLoading(false);
  }, [searchQuery]);

  const s = styles(colors);

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      {/* Language Switcher */}
      <View style={s.langBar}>
        {(["hebrew", "greek", "search"] as Lang[]).map((l) => (
          <TouchableOpacity
            key={l}
            style={[s.langBtn, lang === l && s.langBtnActive]}
            onPress={() => setLang(l)}
            activeOpacity={0.8}
          >
            <Text style={[s.langBtnText, lang === l && s.langBtnTextActive]}>
              {l === "hebrew" ? "🟡 Hebrew OT" : l === "greek" ? "🔵 Greek NT" : "🔍 Lexicon"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {lang !== "search" && (
          <>
            {/* Verse Reference */}
            <Text style={s.verseRef}>{verseRef}</Text>

            {/* Verse Banner — tappable word chips */}
            <View style={s.verseBanner}>
              {words.map((w, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.wordChip, selectedWord === w && s.wordChipActive]}
                  onPress={() => setSelectedWord(w)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.wordChipText, selectedWord === w && s.wordChipTextActive]}>
                    {w.original}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Instruction */}
            <Text style={s.tapHint}>Tap a word above or a card below to study it</Text>

            {/* Word Cards Grid */}
            <View style={s.cardsGrid}>
              {words.filter(w => w.script && w.strongs !== "N/A").map((w, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.wordCard, selectedWord === w && s.wordCardActive]}
                  onPress={() => setSelectedWord(w)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.cardScript, { color: lang === "hebrew" ? colors.hebrew : colors.greek }]}>
                    {w.script}
                  </Text>
                  <Text style={s.cardEnglish}>{w.original}</Text>
                  <Text style={s.cardStrongs}>{w.strongs}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {lang === "search" && (
          <View>
            <Text style={s.verseRef}>Search Hebrew & Greek Lexicons</Text>
            <Text style={s.tapHint}>Search by English keyword or Strong's number (e.g. H430, G3056)</Text>

            <View style={s.searchRow}>
              <TextInput
                style={s.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="grace, love, H430, G3056…"
                placeholderTextColor={colors.muted}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={s.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
                <Text style={s.searchBtnText}>Search</Text>
              </TouchableOpacity>
            </View>

            {searchLoading && <Text style={s.tapHint}>Searching…</Text>}

            {searchResults.map((r, i) => (
              <TouchableOpacity key={i} style={s.resultCard} onPress={() => setSelectedResult(r)} activeOpacity={0.8}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={[s.resultScript, { color: r.lang === "H" ? colors.hebrew : colors.greek }]}>
                    {r.lemma}
                  </Text>
                  <View style={[s.strongsBadge, { backgroundColor: r.lang === "H" ? "rgba(245,158,11,0.15)" : "rgba(56,189,248,0.15)" }]}>
                    <Text style={[s.strongsText, { color: r.lang === "H" ? colors.hebrew : colors.greek }]}>{r.strongs}</Text>
                  </View>
                </View>
                <Text style={s.resultXlit}>/{r.xlit}/</Text>
                <Text style={s.resultDef} numberOfLines={2}>{r.strongs_def}</Text>
              </TouchableOpacity>
            ))}

            {searchResults.length === 0 && !searchLoading && searchQuery.length > 0 && (
              <Text style={s.tapHint}>No results found. Try a different keyword.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Word Detail Modal */}
      <Modal
        visible={selectedWord !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedWord(null)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setSelectedWord(null)}>
          <Pressable style={[s.detailSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {selectedWord && (
              <>
                <View style={s.sheetHandle} />
                <Text style={[s.detailScript, { color: selectedWord.lang === "H" ? colors.hebrew : colors.greek }]}>
                  {selectedWord.script || "—"}
                </Text>
                <Text style={s.detailEnglish}>{selectedWord.original}</Text>
                {selectedWord.transliteration ? (
                  <Text style={s.detailXlit}>/{selectedWord.transliteration}/</Text>
                ) : null}
                {selectedWord.strongs !== "N/A" && (
                  <View style={[s.strongsBadge, { alignSelf: "center", marginBottom: 12, backgroundColor: selectedWord.lang === "H" ? "rgba(245,158,11,0.15)" : "rgba(56,189,248,0.15)" }]}>
                    <Text style={[s.strongsText, { color: selectedWord.lang === "H" ? colors.hebrew : colors.greek }]}>{selectedWord.strongs}</Text>
                  </View>
                )}
                <View style={[s.detailRow, { borderColor: colors.border }]}>
                  <Text style={[s.detailLabel, { color: colors.muted }]}>Meaning</Text>
                  <Text style={[s.detailValue, { color: colors.foreground }]}>{selectedWord.meaning}</Text>
                </View>
                {selectedWord.notes ? (
                  <View style={[s.detailRow, { borderColor: colors.border }]}>
                    <Text style={[s.detailLabel, { color: colors.muted }]}>Notes</Text>
                    <Text style={[s.detailValue, { color: colors.foreground }]}>{selectedWord.notes}</Text>
                  </View>
                ) : null}
                <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.primary }]} onPress={() => setSelectedWord(null)}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Lexicon Result Detail Modal */}
      <Modal
        visible={selectedResult !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedResult(null)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setSelectedResult(null)}>
          <Pressable style={[s.detailSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {selectedResult && (
              <>
                <View style={s.sheetHandle} />
                <Text style={[s.detailScript, { color: selectedResult.lang === "H" ? colors.hebrew : colors.greek }]}>
                  {selectedResult.lemma}
                </Text>
                <Text style={s.detailXlit}>/{selectedResult.xlit}/</Text>
                <View style={[s.strongsBadge, { alignSelf: "center", marginBottom: 12, backgroundColor: selectedResult.lang === "H" ? "rgba(245,158,11,0.15)" : "rgba(56,189,248,0.15)" }]}>
                  <Text style={[s.strongsText, { color: selectedResult.lang === "H" ? colors.hebrew : colors.greek }]}>{selectedResult.strongs}</Text>
                </View>
                <View style={[s.detailRow, { borderColor: colors.border }]}>
                  <Text style={[s.detailLabel, { color: colors.muted }]}>Definition</Text>
                  <Text style={[s.detailValue, { color: colors.foreground }]}>{selectedResult.strongs_def}</Text>
                </View>
                <View style={[s.detailRow, { borderColor: colors.border }]}>
                  <Text style={[s.detailLabel, { color: colors.muted }]}>KJV Renderings</Text>
                  <Text style={[s.detailValue, { color: colors.foreground }]}>{selectedResult.kjv_def}</Text>
                </View>
                <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.primary }]} onPress={() => setSelectedResult(null)}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    langBar: {
      flexDirection: "row",
      padding: 10,
      gap: 6,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    langBtn: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    langBtnActive: { backgroundColor: c.primary, borderColor: c.primary },
    langBtnText: { fontSize: 11, fontWeight: "700", color: c.muted },
    langBtnTextActive: { color: "#fff" },
    verseRef: { fontSize: 13, fontWeight: "700", color: c.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
    verseBanner: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
    wordChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    wordChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    wordChipText: { fontSize: 14, color: c.foreground, fontWeight: "500" },
    wordChipTextActive: { color: "#fff", fontWeight: "700" },
    tapHint: { fontSize: 12, color: c.muted, marginBottom: 16, fontStyle: "italic" },
    cardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    wordCard: {
      width: "47%",
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      gap: 4,
    },
    wordCardActive: { borderColor: c.primary, backgroundColor: "rgba(124,58,237,0.08)" },
    cardScript: { fontSize: 28, fontWeight: "700", textAlign: "center" },
    cardEnglish: { fontSize: 13, color: c.foreground, fontWeight: "600" },
    cardStrongs: { fontSize: 11, color: c.muted },
    searchRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    searchInput: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 12,
      fontSize: 14,
      color: c.foreground,
      borderWidth: 1,
      borderColor: c.border,
    },
    searchBtn: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingHorizontal: 16,
      justifyContent: "center",
    },
    searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    resultCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    resultScript: { fontSize: 22, fontWeight: "700" },
    resultXlit: { fontSize: 12, color: c.muted, marginBottom: 4 },
    resultDef: { fontSize: 13, color: c.foreground },
    strongsBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    strongsText: { fontSize: 11, fontWeight: "700" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    detailSheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
      maxHeight: "70%",
    },
    sheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: c.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 20,
    },
    detailScript: { fontSize: 52, fontWeight: "700", textAlign: "center", marginBottom: 4 },
    detailEnglish: { fontSize: 20, fontWeight: "700", color: c.foreground, textAlign: "center", marginBottom: 4 },
    detailXlit: { fontSize: 14, color: c.muted, textAlign: "center", marginBottom: 12, fontStyle: "italic" },
    detailRow: {
      borderTopWidth: 1,
      paddingVertical: 12,
    },
    detailLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
    detailValue: { fontSize: 14, lineHeight: 20 },
    closeBtn: {
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
      marginTop: 16,
    },
  });
