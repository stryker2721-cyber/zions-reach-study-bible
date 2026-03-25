import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  FlatList, StyleSheet, Modal, Pressable,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { GENESIS_1_1, JOHN_1_1, type WordData } from "@/lib/lexicon";
import { searchLexicon } from "@/lib/search-service";

type Mode = "hebrew" | "greek" | "search" | "verse";

interface SearchResult {
  strongs: string;
  lemma: string;
  xlit: string;
  strongs_def: string;
  kjv_def: string;
  lang: "H" | "G";
}

let bibleData: any[] | null = null;

function getBible() {
  if (!bibleData) bibleData = require("../../assets/data/kjv_bible.json");
  return bibleData!;
}

const MODE_OPTIONS: { value: Mode; label: string; icon: string }[] = [
  { value: "hebrew", label: "Hebrew OT — Genesis 1:1", icon: "🟡" },
  { value: "greek",  label: "Greek NT — John 1:1",    icon: "🔵" },
  { value: "search", label: "Lexicon Search",          icon: "🔍" },
  { value: "verse",  label: "Verse Lookup",            icon: "📖" },
];

export default function StudyScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<Mode>("hebrew");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);

  // Lexicon search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Verse lookup state
  const [verseInput, setVerseInput] = useState("");
  const [verseWords, setVerseWords] = useState<WordData[] | null>(null);
  const [verseTitle, setVerseTitle] = useState("");
  const [verseError, setVerseError] = useState("");
  const [verseLookupLoading, setVerseLookupLoading] = useState(false);

  const words = mode === "hebrew" ? GENESIS_1_1 : JOHN_1_1;
  const verseRef = mode === "hebrew" ? "Genesis 1:1 (Hebrew OT)" : "John 1:1 (Greek NT)";
  const currentOption = MODE_OPTIONS.find((o) => o.value === mode)!;

  // ── Lexicon search ──────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const results = await searchLexicon(searchQuery, 30);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  // ── Verse lookup ────────────────────────────────────────────────────────────
  const handleVerseLookup = useCallback(() => {
    setVerseError("");
    setVerseWords(null);
    setVerseTitle("");
    const input = verseInput.trim();
    if (!input) return;

    // Parse patterns: "Matthew 24:5", "Matthew 24 5", "Matthew 24 verse 5"
    const match = input.match(/^(.+?)\s+(\d+)[:\s,]+(?:verse\s*)?(\d+)$/i);
    if (!match) {
      setVerseError("Format: Book Chapter:Verse — e.g. Matthew 24:5 or John 3:16");
      return;
    }
    const bookInput = match[1].trim().toLowerCase();
    const chapterNum = parseInt(match[2], 10);
    const verseNum = parseInt(match[3], 10);

    setVerseLookupLoading(true);
    setTimeout(() => {
      const bible = getBible();
      const book = bible.find((b: any) =>
        b.book.toLowerCase() === bookInput ||
        b.book.toLowerCase().startsWith(bookInput) ||
        bookInput.startsWith(b.book.toLowerCase().substring(0, 4))
      );
      if (!book) {
        setVerseError(`Book "${match[1]}" not found. Try full name e.g. "Matthew", "Genesis", "Revelation".`);
        setVerseLookupLoading(false);
        return;
      }
      const chapter = book.chapters.find((c: any) => c.chapter === chapterNum);
      if (!chapter) {
        setVerseError(`${book.book} only has ${book.chapters.length} chapters.`);
        setVerseLookupLoading(false);
        return;
      }
      const verse = chapter.verses.find((v: any) => v.verse === verseNum);
      if (!verse) {
        setVerseError(`${book.book} ${chapterNum} only has ${chapter.verses.length} verses.`);
        setVerseLookupLoading(false);
        return;
      }

      // Use curated data for known verses, otherwise split into words
      let wordList: WordData[];
      if (book.book === "Genesis" && chapterNum === 1 && verseNum === 1) {
        wordList = GENESIS_1_1;
      } else if (book.book === "John" && chapterNum === 1 && verseNum === 1) {
        wordList = JOHN_1_1;
      } else {
        // Split verse text into word entries
        wordList = verse.text.split(/\s+/).map((w: string) => ({
          original: w.replace(/[^a-zA-Z']/g, ""),
          script: "",
          strongs: "N/A",
          meaning: "Full Strong's lookup coming soon — use Lexicon Search tab for individual words.",
          notes: "",
          transliteration: "",
          lang: "none" as const,
        })).filter((w: WordData) => w.original.length > 0);
      }

      setVerseTitle(`${book.book} ${chapterNum}:${verseNum}`);
      setVerseWords(wordList);
      setVerseLookupLoading(false);
    }, 50);
  }, [verseInput]);

  const s = styles(colors);

  return (
    <ScreenContainer edges={["left", "right", "bottom"]} containerClassName="flex-1">

      {/* ── Dropdown Selector ─────────────────────────────────────────────── */}
      <View style={[s.dropdownContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[s.dropdownBtn, { backgroundColor: colors.background, borderColor: colors.primary }]}
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.8}
        >
          <Text style={[s.dropdownBtnIcon]}>{currentOption.icon}</Text>
          <Text style={[s.dropdownBtnText, { color: colors.foreground }]}>{currentOption.label}</Text>
          <Text style={[s.dropdownArrow, { color: colors.primary }]}>▼</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* ── Hebrew OT / Greek NT word study ───────────────────────────────── */}
        {(mode === "hebrew" || mode === "greek") && (
          <>
            <Text style={s.verseRef}>{verseRef}</Text>
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
            <Text style={s.tapHint}>Tap a word above or a card below to study it</Text>
            <View style={s.cardsGrid}>
              {words.filter(w => w.script && w.strongs !== "N/A").map((w, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.wordCard, selectedWord === w && s.wordCardActive]}
                  onPress={() => setSelectedWord(w)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.cardScript, { color: mode === "hebrew" ? colors.hebrew : colors.greek }]}>
                    {w.script}
                  </Text>
                  <Text style={s.cardEnglish}>{w.original}</Text>
                  <Text style={s.cardStrongs}>{w.strongs}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Lexicon Search ─────────────────────────────────────────────────── */}
        {mode === "search" && (
          <View>
            <Text style={s.verseRef}>Search Hebrew & Greek Lexicons</Text>
            <Text style={s.tapHint}>Enter an English keyword or Strong's number (e.g. H430, G3056)</Text>
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
                  <Text style={[s.resultScript, { color: r.lang === "H" ? colors.hebrew : colors.greek }]}>{r.lemma}</Text>
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

        {/* ── Verse Lookup ───────────────────────────────────────────────────── */}
        {mode === "verse" && (
          <View>
            <Text style={s.verseRef}>Verse Lookup & Translation</Text>
            <Text style={s.tapHint}>
              Type a book, chapter, and verse — e.g. "Matthew 24:5" or "John 3:16" or "Genesis 1:1"
            </Text>
            <View style={s.searchRow}>
              <TextInput
                style={s.searchInput}
                value={verseInput}
                onChangeText={setVerseInput}
                placeholder="Matthew 24:5"
                placeholderTextColor={colors.muted}
                returnKeyType="search"
                onSubmitEditing={handleVerseLookup}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <TouchableOpacity style={s.searchBtn} onPress={handleVerseLookup} activeOpacity={0.8}>
                <Text style={s.searchBtnText}>Look Up</Text>
              </TouchableOpacity>
            </View>

            {verseError ? (
              <View style={[s.errorBox, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: colors.error }]}>
                <Text style={[s.errorText, { color: colors.error }]}>{verseError}</Text>
              </View>
            ) : null}

            {verseLookupLoading && <Text style={s.tapHint}>Looking up verse…</Text>}

            {verseWords && verseTitle ? (
              <>
                <Text style={[s.verseRef, { marginTop: 16 }]}>{verseTitle}</Text>
                {/* Verse word chips */}
                <View style={s.verseBanner}>
                  {verseWords.map((w, i) => (
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
                <Text style={s.tapHint}>Tap a word to see its Hebrew/Greek data</Text>
                {/* Word cards for those with script data */}
                {verseWords.some(w => w.script) && (
                  <View style={s.cardsGrid}>
                    {verseWords.filter(w => w.script && w.strongs !== "N/A").map((w, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[s.wordCard, selectedWord === w && s.wordCardActive]}
                        onPress={() => setSelectedWord(w)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.cardScript, { color: w.lang === "H" ? colors.hebrew : colors.greek }]}>
                          {w.script}
                        </Text>
                        <Text style={s.cardEnglish}>{w.original}</Text>
                        <Text style={s.cardStrongs}>{w.strongs}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {/* Plain word list for verses without curated data */}
                {!verseWords.some(w => w.script) && (
                  <View style={[s.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[s.infoTitle, { color: colors.foreground }]}>Words in {verseTitle}</Text>
                    <Text style={[s.infoBody, { color: colors.muted }]}>
                      This verse has {verseWords.length} words. Full word-by-word Hebrew/Greek annotations are currently available for Genesis 1:1 and John 1:1. Use the Lexicon Search to look up individual words.
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                      {verseWords.map((w, i) => (
                        <View key={i} style={[s.wordChip, { borderColor: colors.border }]}>
                          <Text style={[s.wordChipText, { color: colors.foreground }]}>{w.original}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* ── Dropdown Modal ─────────────────────────────────────────────────── */}
      <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowDropdown(false)}>
          <Pressable style={[s.dropdownSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>Select Study Mode</Text>
            {MODE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  s.dropdownItem,
                  { borderColor: colors.border, backgroundColor: mode === opt.value ? "rgba(124,58,237,0.1)" : "transparent" },
                ]}
                onPress={() => { setMode(opt.value); setShowDropdown(false); }}
                activeOpacity={0.8}
              >
                <Text style={s.dropdownItemIcon}>{opt.icon}</Text>
                <Text style={[s.dropdownItemText, { color: mode === opt.value ? colors.primary : colors.foreground }]}>
                  {opt.label}
                </Text>
                {mode === opt.value && <Text style={{ color: colors.primary, fontSize: 16 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Word Detail Modal ─────────────────────────────────────────────── */}
      <Modal visible={selectedWord !== null} transparent animationType="slide" onRequestClose={() => setSelectedWord(null)}>
        <Pressable style={s.modalOverlay} onPress={() => setSelectedWord(null)}>
          <Pressable style={[s.detailSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {selectedWord && (
              <>
                <View style={s.sheetHandle} />
                <Text style={[s.detailScript, { color: selectedWord.lang === "H" ? colors.hebrew : selectedWord.lang === "G" ? colors.greek : colors.muted }]}>
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
                <ScrollView style={{ maxHeight: 260 }}>
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
                </ScrollView>
                <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.primary }]} onPress={() => setSelectedWord(null)}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Lexicon Result Detail Modal ───────────────────────────────────── */}
      <Modal visible={selectedResult !== null} transparent animationType="slide" onRequestClose={() => setSelectedResult(null)}>
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
                <ScrollView style={{ maxHeight: 260 }}>
                  <View style={[s.detailRow, { borderColor: colors.border }]}>
                    <Text style={[s.detailLabel, { color: colors.muted }]}>Definition</Text>
                    <Text style={[s.detailValue, { color: colors.foreground }]}>{selectedResult.strongs_def}</Text>
                  </View>
                  <View style={[s.detailRow, { borderColor: colors.border }]}>
                    <Text style={[s.detailLabel, { color: colors.muted }]}>KJV Renderings</Text>
                    <Text style={[s.detailValue, { color: colors.foreground }]}>{selectedResult.kjv_def}</Text>
                  </View>
                </ScrollView>
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
    dropdownContainer: {
      padding: 12,
      borderBottomWidth: 1,
    },
    dropdownBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderRadius: 14,
      borderWidth: 2,
      gap: 10,
    },
    dropdownBtnIcon: { fontSize: 20 },
    dropdownBtnText: { flex: 1, fontSize: 17, fontWeight: "800" },
    dropdownArrow: { fontSize: 14, fontWeight: "800" },
    dropdownSheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 36,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 8,
      gap: 10,
    },
    dropdownItemIcon: { fontSize: 20 },
    dropdownItemText: { flex: 1, fontSize: 15, fontWeight: "600" },
    verseRef: { fontSize: 13, fontWeight: "700", color: c.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
    verseBanner: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
    wordChip: {
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    },
    wordChipActive: { backgroundColor: c.primary, borderColor: c.primary },
    wordChipText: { fontSize: 14, color: c.foreground, fontWeight: "500" },
    wordChipTextActive: { color: "#fff", fontWeight: "700" },
    tapHint: { fontSize: 12, color: c.muted, marginBottom: 16, fontStyle: "italic" },
    cardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    wordCard: {
      width: "47%", backgroundColor: c.surface, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: c.border, alignItems: "center", gap: 4,
    },
    wordCardActive: { borderColor: c.primary, backgroundColor: "rgba(124,58,237,0.08)" },
    cardScript: { fontSize: 28, fontWeight: "700", textAlign: "center" },
    cardEnglish: { fontSize: 13, color: c.foreground, fontWeight: "600" },
    cardStrongs: { fontSize: 11, color: c.muted },
    searchRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    searchInput: {
      flex: 1, backgroundColor: c.surface, borderRadius: 12, padding: 12,
      fontSize: 14, color: c.foreground, borderWidth: 1, borderColor: c.border,
    },
    searchBtn: { backgroundColor: c.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
    searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    resultCard: {
      backgroundColor: c.surface, borderRadius: 12, padding: 14,
      marginBottom: 10, borderWidth: 1, borderColor: c.border,
    },
    resultScript: { fontSize: 22, fontWeight: "700" },
    resultXlit: { fontSize: 12, color: c.muted, marginBottom: 4 },
    resultDef: { fontSize: 13, color: c.foreground },
    strongsBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    strongsText: { fontSize: 11, fontWeight: "700" },
    errorBox: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12 },
    errorText: { fontSize: 13, fontWeight: "600" },
    infoBox: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 8 },
    infoTitle: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
    infoBody: { fontSize: 13, lineHeight: 19 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    detailSheet: {
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40, maxHeight: "75%",
    },
    sheetHandle: { width: 40, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
    sheetTitle: { fontSize: 17, fontWeight: "800", marginBottom: 12 },
    detailScript: { fontSize: 52, fontWeight: "700", textAlign: "center", marginBottom: 4 },
    detailEnglish: { fontSize: 20, fontWeight: "700", color: c.foreground, textAlign: "center", marginBottom: 4 },
    detailXlit: { fontSize: 14, color: c.muted, textAlign: "center", marginBottom: 12, fontStyle: "italic" },
    detailRow: { borderTopWidth: 1, paddingVertical: 12 },
    detailLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
    detailValue: { fontSize: 14, lineHeight: 20 },
    closeBtn: { borderRadius: 14, padding: 14, alignItems: "center", marginTop: 16 },
  });
