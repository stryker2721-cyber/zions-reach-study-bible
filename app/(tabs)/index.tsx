import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  FlatList, StyleSheet, Modal, Pressable,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { searchLexicon } from "@/lib/search-service";

type Mode = "search" | "phrase";

interface SearchResult {
  strongs: string;
  hebrew?: string;
  greek?: string;
  transliteration: string;
  meaning: string;
  kjv: string;
  lang: "H" | "G";
}

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

let bibleData: any[] | null = null;

function getBible() {
  if (!bibleData) bibleData = require("../../assets/data/kjv_bible.json");
  return bibleData!;
}

const MODE_OPTIONS: { value: Mode; label: string; icon: string }[] = [
  { value: "search", label: "Lexicon Search", icon: "🔍" },
  { value: "phrase", label: "Bible Phrases & Keywords", icon: "📖" },
];

export default function StudyScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<Mode>("search");
  const [showDropdown, setShowDropdown] = useState(false);

  // Lexicon search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Phrase search state
  const [phraseQuery, setPhraseQuery] = useState("");
  const [phraseResults, setPhraseResults] = useState<BibleVerse[]>([]);
  const [phraseLoading, setPhraseLoading] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);

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

  // ── Phrase search across entire Bible ────────────────────────────────────────
  const handlePhraseSearch = useCallback(() => {
    if (!phraseQuery.trim()) return;
    setPhraseLoading(true);
    setPhraseResults([]);

    try {
      const bible = getBible();
      const query = phraseQuery.toLowerCase();
      const results: BibleVerse[] = [];

      // Search through all verses
      for (const book of bible) {
        for (const chapter of book.chapters) {
          for (const verse of chapter.verses) {
            if (verse.text.toLowerCase().includes(query)) {
              results.push({
                book: book.book,
                chapter: chapter.chapter,
                verse: verse.verse,
                text: verse.text,
              });
              // Limit results to 100
              if (results.length >= 100) break;
            }
          }
          if (results.length >= 100) break;
        }
        if (results.length >= 100) break;
      }

      setPhraseResults(results);
    } catch (error) {
      console.error("Phrase search error:", error);
      setPhraseResults([]);
    } finally {
      setPhraseLoading(false);
    }
  }, [phraseQuery]);

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
                  <Text style={[s.resultScript, { color: r.lang === "H" ? colors.hebrew : colors.greek }]}>{r.hebrew || r.greek || r.transliteration}</Text>
                  <View style={[s.strongsBadge, { backgroundColor: r.lang === "H" ? "rgba(245,158,11,0.15)" : "rgba(56,189,248,0.15)" }]}>
                    <Text style={[s.strongsText, { color: r.lang === "H" ? colors.hebrew : colors.greek }]}>{r.strongs}</Text>
                  </View>
                </View>
                <Text style={s.resultXlit}>/{r.transliteration}/</Text>
                <Text style={s.resultDef} numberOfLines={2}>{r.meaning}</Text>
              </TouchableOpacity>
            ))}
            {searchResults.length === 0 && !searchLoading && searchQuery.length > 0 && (
              <Text style={s.tapHint}>No results found. Try a different keyword.</Text>
            )}
          </View>
        )}

        {/* ── Phrase Search ──────────────────────────────────────────────────── */}
        {mode === "phrase" && (
          <View>
            <Text style={s.verseRef}>Search Bible by Phrase or Keyword</Text>
            <Text style={s.tapHint}>Find verses by topic or phrase (e.g. "gnashing of teeth", "stress", "addiction")</Text>
            <View style={s.searchRow}>
              <TextInput
                style={s.searchInput}
                value={phraseQuery}
                onChangeText={setPhraseQuery}
                placeholder="gnashing of teeth, stress, addiction…"
                placeholderTextColor={colors.muted}
                returnKeyType="search"
                onSubmitEditing={handlePhraseSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={s.searchBtn} onPress={handlePhraseSearch} activeOpacity={0.8}>
                <Text style={s.searchBtnText}>Search</Text>
              </TouchableOpacity>
            </View>
            {phraseLoading && <Text style={s.tapHint}>Searching…</Text>}
            {phraseResults.length > 0 && (
              <Text style={s.tapHint}>{phraseResults.length} verses found</Text>
            )}
            {phraseResults.map((v, i) => (
              <TouchableOpacity key={i} style={s.resultCard} onPress={() => setSelectedVerse(v)} activeOpacity={0.8}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={[s.resultScript, { color: colors.primary }]}>
                    {v.book} {v.chapter}:{v.verse}
                  </Text>
                </View>
                <Text style={s.resultDef} numberOfLines={3}>{v.text}</Text>
              </TouchableOpacity>
            ))}
            {phraseResults.length === 0 && !phraseLoading && phraseQuery.length > 0 && (
              <Text style={s.tapHint}>No verses found. Try a different phrase or keyword.</Text>
            )}
          </View>
        )}

      </ScrollView>

      {/* ── Dropdown Modal ────────────────────────────────────────────────────── */}
      <Modal visible={showDropdown} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setShowDropdown(false)}>
          <View style={[s.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {MODE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[s.dropdownItem, mode === opt.value && { backgroundColor: colors.primary + "20" }]}
                onPress={() => {
                  setMode(opt.value);
                  setShowDropdown(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[s.dropdownItemIcon]}>{opt.icon}</Text>
                <Text style={[s.dropdownItemText, { color: colors.foreground }]}>{opt.label}</Text>
                {mode === opt.value && <Text style={[s.checkmark, { color: colors.primary }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Lexicon Result Detail Modal ───────────────────────────────────────── */}
      <Modal visible={!!selectedResult} transparent animationType="slide">
        <Pressable style={s.modalOverlay} onPress={() => setSelectedResult(null)}>
          <Pressable style={[s.detailSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {selectedResult && (
              <>
                <View style={s.sheetHandle} />
                <Text style={[s.detailScript, { color: selectedResult.lang === "H" ? colors.hebrew : colors.greek }]}>
                  {selectedResult.hebrew || selectedResult.greek || selectedResult.transliteration}
                </Text>
                <Text style={s.detailXlit}>/{selectedResult.transliteration}/</Text>
                <View style={[s.strongsBadge, { alignSelf: "center", marginBottom: 12, backgroundColor: selectedResult.lang === "H" ? "rgba(245,158,11,0.15)" : "rgba(56,189,248,0.15)" }]}>
                  <Text style={[s.strongsText, { color: selectedResult.lang === "H" ? colors.hebrew : colors.greek }]}>{selectedResult.strongs}</Text>
                </View>
                <ScrollView style={{ maxHeight: 260 }}>
                  <View style={[s.detailRow, { borderColor: colors.border }]}>
                    <Text style={[s.detailLabel, { color: colors.muted }]}>Definition</Text>
                    <Text style={[s.detailValue, { color: colors.foreground }]}>{selectedResult.meaning}</Text>
                  </View>
                  <View style={[s.detailRow, { borderColor: colors.border }]}>
                    <Text style={[s.detailLabel, { color: colors.muted }]}>KJV Renderings</Text>
                    <Text style={[s.detailValue, { color: colors.foreground }]}>{selectedResult.kjv}</Text>
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

      {/* ── Verse Detail Modal ────────────────────────────────────────────────── */}
      <Modal visible={!!selectedVerse} transparent animationType="slide">
        <Pressable style={s.modalOverlay} onPress={() => setSelectedVerse(null)}>
          <Pressable style={[s.detailSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {selectedVerse && (
              <>
                <View style={s.sheetHandle} />
                <Text style={[s.detailScript, { color: colors.primary }]}>
                  {selectedVerse.book} {selectedVerse.chapter}:{selectedVerse.verse}
                </Text>
                <ScrollView style={{ maxHeight: 300, marginVertical: 16 }}>
                  <Text style={[s.detailValue, { color: colors.foreground }]}>{selectedVerse.text}</Text>
                </ScrollView>
                <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.primary }]} onPress={() => setSelectedVerse(null)}>
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

// ────────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────────

const styles = (colors: any) => StyleSheet.create({
  dropdownContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownBtnIcon: {
    fontSize: 20,
  },
  dropdownBtnText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  dropdownArrow: {
    fontSize: 12,
    fontWeight: "700",
  },
  dropdownMenu: {
    position: "absolute",
    top: 80,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemIcon: {
    fontSize: 18,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "700",
  },
  verseRef: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 8,
  },
  tapHint: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
    fontStyle: "italic",
  },
  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.foreground,
    fontSize: 14,
  },
  searchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: "center",
  },
  searchBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  resultScript: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultXlit: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  resultDef: {
    fontSize: 13,
    color: colors.foreground,
    lineHeight: 18,
  },
  strongsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  strongsText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  detailSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  detailScript: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  detailXlit: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 8,
  },
  detailRow: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
