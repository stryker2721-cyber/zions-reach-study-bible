import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Modal, Pressable,
  StyleSheet, ActivityIndicator, ScrollView, TextInput, Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { GENESIS_1_1, JOHN_1_1, type WordData } from "@/lib/lexicon";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BibleVerse { verse: number; text: string; }
interface BibleChapter { chapter: number; verses: BibleVerse[]; }
interface BibleBook { book: string; chapters: BibleChapter[]; }
type BibleData = BibleBook[];

interface Highlight {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  color: string;
  createdAt: string;
}

interface SearchResult {
  book: string;
  bookIndex: number;
  chapter: number;
  chapterIndex: number;
  verse: number;
  text: string;
  matchStart: number;
  matchEnd: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const HIGHLIGHT_COLORS = [
  { name: "Gold",   value: "rgba(251,191,36,0.35)",  dot: "#F59E0B" },
  { name: "Green",  value: "rgba(34,197,94,0.3)",    dot: "#22C55E" },
  { name: "Blue",   value: "rgba(59,130,246,0.3)",   dot: "#3B82F6" },
  { name: "Pink",   value: "rgba(236,72,153,0.3)",   dot: "#EC4899" },
  { name: "Purple", value: "rgba(139,92,246,0.3)",   dot: "#8B5CF6" },
];

const HIGHLIGHTS_KEY = "owb_highlights";

type BibleVersion = "KJV" | "NKJV" | "NLT" | "NIV";
const VERSION_INFO: Record<BibleVersion, { label: string; note: string }> = {
  KJV:  { label: "King James Version",       note: "KJV (1611)" },
  NKJV: { label: "New King James Version",   note: "NKJV (1982)" },
  NLT:  { label: "New Living Translation",   note: "NLT (2015)" },
  NIV:  { label: "New International Version",note: "NIV (2011)" },
};

// ── Bible cache ───────────────────────────────────────────────────────────────
let bibleCache: BibleData | null = null;
function getBible(): BibleData {
  if (!bibleCache) {
    bibleCache = require("../../assets/data/kjv_bible.json") as BibleData;
  }
  return bibleCache;
}

// ── Translation helper ────────────────────────────────────────────────────────
function getVerseTranslation(bookName: string, chapter: number, verseNum: number, verseText: string): WordData[] {
  if (bookName === "Genesis" && chapter === 1 && verseNum === 1) return GENESIS_1_1;
  if (bookName === "John" && chapter === 1 && verseNum === 1) return JOHN_1_1;
  return verseText.split(/\s+/).map((w) => ({
    original: w.replace(/[^a-zA-Z']/g, ""),
    script: "",
    strongs: "N/A",
    meaning: "No entry — tap Study tab to look up specific words",
    notes: "",
    transliteration: "",
    lang: "none" as const,
  }));
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BibleScreen() {
  const colors = useColors();

  // Reading state
  const [bible, setBible] = useState<BibleData | null>(null);
  const [bookIndex, setBookIndex] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [transWords, setTransWords] = useState<WordData[]>([]);

  // Pickers
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [bibleVersion, setBibleVersion] = useState<BibleVersion>("KJV");
  const [showVersionPicker, setShowVersionPicker] = useState(false);

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Highlights
  const [highlights, setHighlights] = useState<Record<string, Highlight>>({});
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [pendingHighlightVerse, setPendingHighlightVerse] = useState<BibleVerse | null>(null);
  const [showHighlightsList, setShowHighlightsList] = useState(false);

  // Active tab: "read" | "search" | "highlights"
  const [activeTab, setActiveTab] = useState<"read" | "search" | "highlights">("read");

  // Load Bible + highlights
  useEffect(() => {
    setTimeout(() => setBible(getBible()), 100);
    AsyncStorage.getItem(HIGHLIGHTS_KEY).then((raw) => {
      if (raw) setHighlights(JSON.parse(raw));
    });
  }, []);

  const book = bible?.[bookIndex];
  const chapter = book?.chapters?.[chapterIndex];
  const verses = chapter?.verses ?? [];

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const highlightKey = (bookName: string, ch: number, v: number) => `${bookName}:${ch}:${v}`;

  const saveHighlights = async (updated: Record<string, Highlight>) => {
    setHighlights(updated);
    await AsyncStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(updated));
  };

  const handleVersePress = useCallback((verse: BibleVerse) => {
    const words = getVerseTranslation(book?.book ?? "", chapterIndex + 1, verse.verse, verse.text);
    setTransWords(words);
    setSelectedVerse(verse);
  }, [book, chapterIndex]);

  const handleVerseLongPress = useCallback((verse: BibleVerse) => {
    setPendingHighlightVerse(verse);
    setShowHighlightPicker(true);
  }, []);

  const applyHighlight = async (color: string) => {
    if (!pendingHighlightVerse || !book) return;
    const key = highlightKey(book.book, chapterIndex + 1, pendingHighlightVerse.verse);
    const existing = highlights[key];
    let updated: Record<string, Highlight>;
    if (existing && existing.color === color) {
      // Toggle off — remove highlight
      updated = { ...highlights };
      delete updated[key];
    } else {
      updated = {
        ...highlights,
        [key]: {
          book: book.book,
          chapter: chapterIndex + 1,
          verse: pendingHighlightVerse.verse,
          text: pendingHighlightVerse.text,
          color,
          createdAt: new Date().toISOString(),
        },
      };
    }
    await saveHighlights(updated);
    setShowHighlightPicker(false);
    setPendingHighlightVerse(null);
  };

  const removeHighlight = async (key: string) => {
    const updated = { ...highlights };
    delete updated[key];
    await saveHighlights(updated);
  };

  const navigateToHighlight = (h: Highlight) => {
    if (!bible) return;
    const bIdx = bible.findIndex((b) => b.book === h.book);
    if (bIdx < 0) return;
    setBookIndex(bIdx);
    setChapterIndex(h.chapter - 1);
    setActiveTab("read");
    setShowHighlightsList(false);
  };

  // ── Search ────────────────────────────────────────────────────────────────────
  const doSearch = useCallback(() => {
    if (!bible || searchQuery.trim().length < 2) return;
    setIsSearching(true);
    const query = searchQuery.trim().toLowerCase();
    const results: SearchResult[] = [];
    for (let bi = 0; bi < bible.length; bi++) {
      const b = bible[bi];
      for (let ci = 0; ci < b.chapters.length; ci++) {
        const ch = b.chapters[ci];
        for (const v of ch.verses) {
          const lower = v.text.toLowerCase();
          const idx = lower.indexOf(query);
          if (idx >= 0) {
            results.push({
              book: b.book,
              bookIndex: bi,
              chapter: ch.chapter,
              chapterIndex: ci,
              verse: v.verse,
              text: v.text,
              matchStart: idx,
              matchEnd: idx + query.length,
            });
            if (results.length >= 200) break;
          }
        }
        if (results.length >= 200) break;
      }
      if (results.length >= 200) break;
    }
    setSearchResults(results);
    setIsSearching(false);
  }, [bible, searchQuery]);

  const navigateToResult = (r: SearchResult) => {
    setBookIndex(r.bookIndex);
    setChapterIndex(r.chapterIndex);
    setActiveTab("read");
    setShowSearch(false);
  };

  const s = styles(colors);
  const highlightList = Object.values(highlights).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (!bible) {
    return (
      <ScreenContainer edges={["left", "right", "bottom"]} containerClassName="flex-1">
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>Loading Bible…</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["left", "right", "bottom"]} containerClassName="flex-1">

      {/* ── Top Bar: Version + Search + Highlights ─────────────────────────── */}
      <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[s.versionBtn, { backgroundColor: colors.background, borderColor: colors.primary }]}
          onPress={() => setShowVersionPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={[s.versionBtnLabel, { color: colors.muted }]}>Version</Text>
          <Text style={[s.versionBtnText, { color: colors.foreground }]}>{bibleVersion}</Text>
          <Text style={[s.versionArrow, { color: colors.primary }]}>▼</Text>
        </TouchableOpacity>

        {/* Inner tab buttons: Read / Search / Highlights */}
        <View style={s.innerTabs}>
          {(["read", "search", "highlights"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.innerTab, activeTab === tab && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[s.innerTabText, { color: activeTab === tab ? "#fff" : colors.muted }]}>
                {tab === "read" ? "📖" : tab === "search" ? "🔍" : "🌟"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── READ TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === "read" && (
        <>
          {/* Navigation Controls */}
          <View style={[s.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity style={[s.pickerBtn, { borderColor: colors.border }]} onPress={() => setShowBookPicker(true)}>
              <Text style={[s.pickerText, { color: colors.foreground }]} numberOfLines={1}>{book?.book ?? "—"}</Text>
              <Text style={{ color: colors.muted, fontSize: 10 }}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.pickerBtn, { borderColor: colors.border, flex: 0.5 }]} onPress={() => setShowChapterPicker(true)}>
              <Text style={[s.pickerText, { color: colors.foreground }]}>Ch. {chapterIndex + 1}</Text>
              <Text style={{ color: colors.muted, fontSize: 10 }}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.arrowBtn, { borderColor: colors.border }]}
              onPress={() => setChapterIndex(Math.max(0, chapterIndex - 1))}
              disabled={chapterIndex === 0}
            >
              <Text style={[s.arrowText, { color: chapterIndex === 0 ? colors.muted : colors.primary }]}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.arrowBtn, { borderColor: colors.border }]}
              onPress={() => setChapterIndex(Math.min((book?.chapters.length ?? 1) - 1, chapterIndex + 1))}
              disabled={chapterIndex >= (book?.chapters.length ?? 1) - 1}
            >
              <Text style={[s.arrowText, { color: chapterIndex >= (book?.chapters.length ?? 1) - 1 ? colors.muted : colors.primary }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Chapter Title */}
          <View style={[s.chapterHeader, { backgroundColor: colors.background }]}>
            <Text style={[s.chapterTitle, { color: colors.foreground }]}>{book?.book} {chapterIndex + 1}</Text>
            <Text style={[s.tapHint, { color: colors.muted }]}>Tap to translate · Hold to highlight</Text>
          </View>

          {/* Verse List */}
          <FlatList
            data={verses}
            keyExtractor={(item) => String(item.verse)}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            renderItem={({ item }) => {
              const key = highlightKey(book?.book ?? "", chapterIndex + 1, item.verse);
              const hl = highlights[key];
              return (
                <TouchableOpacity
                  style={[
                    s.verseRow,
                    { borderBottomColor: colors.border },
                    hl ? { backgroundColor: hl.color, borderRadius: 8, paddingHorizontal: 8, marginBottom: 2 } : null,
                  ]}
                  onPress={() => handleVersePress(item)}
                  onLongPress={() => handleVerseLongPress(item)}
                  delayLongPress={400}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={[s.verseNum, { color: colors.primary }]}>{item.verse}</Text>
                    {hl && <Text style={{ fontSize: 10 }}>●</Text>}
                  </View>
                  <Text style={[s.verseText, { color: colors.foreground }]}>{item.text}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}

      {/* ── SEARCH TAB ───────────────────────────────────────────────────────── */}
      {activeTab === "search" && (
        <View style={{ flex: 1 }}>
          <View style={[s.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TextInput
              style={[s.searchInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Search the Bible… (e.g. love, faith, grace)"
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={doSearch}
              returnKeyType="search"
              autoFocus
            />
            <TouchableOpacity
              style={[s.searchBtn, { backgroundColor: colors.primary }]}
              onPress={doSearch}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Search</Text>
            </TouchableOpacity>
          </View>

          {isSearching && (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}

          {!isSearching && searchResults.length > 0 && (
            <Text style={[s.resultCount, { color: colors.muted }]}>
              {searchResults.length >= 200 ? "200+ results" : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`} for "{searchQuery}"
            </Text>
          )}

          {!isSearching && searchQuery.length > 0 && searchResults.length === 0 && (
            <Text style={[s.resultCount, { color: colors.muted }]}>No results found for "{searchQuery}"</Text>
          )}

          <FlatList
            data={searchResults}
            keyExtractor={(item, i) => `${item.book}-${item.chapter}-${item.verse}-${i}`}
            contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.resultRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigateToResult(item)}
                activeOpacity={0.8}
              >
                <Text style={[s.resultRef, { color: colors.primary }]}>{item.book} {item.chapter}:{item.verse}</Text>
                <Text style={[s.resultText, { color: colors.foreground }]} numberOfLines={3}>
                  {item.text.substring(0, item.matchStart)}
                  <Text style={{ fontWeight: "800", color: colors.primary }}>
                    {item.text.substring(item.matchStart, item.matchEnd)}
                  </Text>
                  {item.text.substring(item.matchEnd)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ── HIGHLIGHTS TAB ───────────────────────────────────────────────────── */}
      {activeTab === "highlights" && (
        <View style={{ flex: 1 }}>
          <View style={[s.hlHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.hlHeaderTitle, { color: colors.foreground }]}>
              🌟 Highlighted Verses ({highlightList.length})
            </Text>
            <Text style={[s.hlHeaderHint, { color: colors.muted }]}>
              Long-press any verse to highlight it
            </Text>
          </View>

          {highlightList.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🌟</Text>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>No highlights yet</Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                Go to the Read tab, then long-press any verse to add a highlight
              </Text>
            </View>
          ) : (
            <FlatList
              data={highlightList}
              keyExtractor={(item) => highlightKey(item.book, item.chapter, item.verse)}
              contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
              renderItem={({ item }) => {
                const key = highlightKey(item.book, item.chapter, item.verse);
                const colorDot = HIGHLIGHT_COLORS.find((c) => c.value === item.color)?.dot ?? "#F59E0B";
                return (
                  <View style={[s.hlRow, { backgroundColor: item.color, borderColor: colorDot }]}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => navigateToHighlight(item)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <View style={[s.hlDot, { backgroundColor: colorDot }]} />
                        <Text style={[s.hlRef, { color: colors.foreground }]}>{item.book} {item.chapter}:{item.verse}</Text>
                      </View>
                      <Text style={[s.hlText, { color: colors.foreground }]} numberOfLines={3}>{item.text}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.hlRemoveBtn}
                      onPress={() => removeHighlight(key)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 18, color: colors.muted }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}

      {/* Book Picker */}
      <Modal visible={showBookPicker} transparent animationType="slide" onRequestClose={() => setShowBookPicker(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowBookPicker(false)}>
          <Pressable style={[s.pickerSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>Select Book</Text>
            <FlatList
              data={bible}
              keyExtractor={(item) => item.book}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[s.pickerItem, { borderBottomColor: colors.border, backgroundColor: index === bookIndex ? "rgba(124,58,237,0.1)" : "transparent" }]}
                  onPress={() => { setBookIndex(index); setChapterIndex(0); setShowBookPicker(false); }}
                >
                  <Text style={[s.pickerItemText, { color: index === bookIndex ? colors.primary : colors.foreground }]}>{item.book}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Chapter Picker */}
      <Modal visible={showChapterPicker} transparent animationType="slide" onRequestClose={() => setShowChapterPicker(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowChapterPicker(false)}>
          <Pressable style={[s.pickerSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>Select Chapter</Text>
            <FlatList
              data={book?.chapters ?? []}
              keyExtractor={(item) => String(item.chapter)}
              numColumns={5}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[s.chapterChip, { borderColor: index === chapterIndex ? colors.primary : colors.border, backgroundColor: index === chapterIndex ? colors.primary : colors.background }]}
                  onPress={() => { setChapterIndex(index); setShowChapterPicker(false); }}
                >
                  <Text style={{ color: index === chapterIndex ? "#fff" : colors.foreground, fontWeight: "700", fontSize: 13 }}>{item.chapter}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Version Picker */}
      <Modal visible={showVersionPicker} transparent animationType="fade" onRequestClose={() => setShowVersionPicker(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowVersionPicker(false)}>
          <Pressable style={[s.pickerSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>Select Bible Version</Text>
            {(Object.keys(VERSION_INFO) as BibleVersion[]).map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.pickerItem, { borderBottomColor: colors.border, backgroundColor: v === bibleVersion ? "rgba(124,58,237,0.1)" : "transparent", borderRadius: 10, marginBottom: 4 }]}
                onPress={() => { setBibleVersion(v); setShowVersionPicker(false); }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View>
                    <Text style={[s.pickerItemText, { color: v === bibleVersion ? colors.primary : colors.foreground }]}>{VERSION_INFO[v].label}</Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{VERSION_INFO[v].note}</Text>
                  </View>
                  {v === bibleVersion && <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
            <View style={[s.pickerItem, { borderBottomColor: "transparent", backgroundColor: "rgba(245,158,11,0.08)", borderRadius: 10, marginTop: 8 }]}>
              <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
                📌 Note: Full NKJV, NLT, and NIV text integration is coming in a future update. Hebrew/Greek word study works with all versions.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Highlight Color Picker */}
      <Modal visible={showHighlightPicker} transparent animationType="fade" onRequestClose={() => setShowHighlightPicker(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowHighlightPicker(false)}>
          <Pressable style={[s.hlPickerSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>Highlight Verse</Text>
            {pendingHighlightVerse && (
              <Text style={[s.hlVersePreview, { color: colors.muted }]} numberOfLines={2}>
                {book?.book} {chapterIndex + 1}:{pendingHighlightVerse.verse} — {pendingHighlightVerse.text}
              </Text>
            )}
            <View style={s.hlColorRow}>
              {HIGHLIGHT_COLORS.map((hc) => {
                const key = pendingHighlightVerse ? highlightKey(book?.book ?? "", chapterIndex + 1, pendingHighlightVerse.verse) : "";
                const isActive = highlights[key]?.color === hc.value;
                return (
                  <TouchableOpacity
                    key={hc.name}
                    style={[s.hlColorBtn, { backgroundColor: hc.value, borderColor: hc.dot, borderWidth: isActive ? 3 : 1.5 }]}
                    onPress={() => applyHighlight(hc.value)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.hlColorDot, { backgroundColor: hc.dot }]} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>{hc.name}</Text>
                    {isActive && <Text style={{ fontSize: 16 }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 8 }}>
              Tap the active color to remove the highlight
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Translation Drawer */}
      <Modal visible={selectedVerse !== null} transparent animationType="slide" onRequestClose={() => setSelectedVerse(null)}>
        <Pressable style={s.modalOverlay} onPress={() => setSelectedVerse(null)}>
          <Pressable style={[s.transSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>
              {book?.book} {chapterIndex + 1}:{selectedVerse?.verse}
            </Text>
            <Text style={[s.verseTextSmall, { color: colors.muted }]} numberOfLines={3}>{selectedVerse?.text}</Text>
            <ScrollView style={{ marginTop: 12 }}>
              {transWords.map((w, i) => {
                if (!w.original.trim()) return null;
                return (
                  <View key={i} style={[s.transRow, { borderBottomColor: colors.border }]}>
                    {w.script ? (
                      <Text style={[s.transScript, { color: w.lang === "H" ? colors.hebrew : colors.greek }]}>{w.script}</Text>
                    ) : (
                      <Text style={[s.transScript, { color: colors.muted, fontSize: 14 }]}>—</Text>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[s.transEnglish, { color: colors.foreground }]}>{w.original}</Text>
                      {w.strongs !== "N/A" && <Text style={[s.transStrongs, { color: w.lang === "H" ? colors.hebrew : colors.greek }]}>{w.strongs}</Text>}
                      <Text style={[s.transMeaning, { color: colors.muted }]} numberOfLines={2}>{w.meaning}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.primary }]} onPress={() => setSelectedVerse(null)}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </ScreenContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      gap: 8,
      borderBottomWidth: 1,
    },
    versionBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 2,
      gap: 6,
      flex: 1,
    },
    versionBtnLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
    versionBtnText: { flex: 1, fontSize: 15, fontWeight: "800" },
    versionArrow: { fontSize: 12, fontWeight: "800" },
    innerTabs: {
      flexDirection: "row",
      gap: 6,
    },
    innerTab: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    innerTabText: { fontSize: 18 },
    navBar: {
      flexDirection: "row",
      padding: 10,
      gap: 6,
      borderBottomWidth: 1,
      alignItems: "center",
    },
    pickerBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      backgroundColor: c.background,
      gap: 4,
    },
    pickerText: { fontSize: 13, fontWeight: "600", flex: 1 },
    arrowBtn: {
      width: 36, height: 36, borderRadius: 10, borderWidth: 1,
      alignItems: "center", justifyContent: "center", backgroundColor: c.background,
    },
    arrowText: { fontSize: 20, fontWeight: "700", lineHeight: 24 },
    chapterHeader: { paddingHorizontal: 16, paddingVertical: 10 },
    chapterTitle: { fontSize: 20, fontWeight: "800" },
    tapHint: { fontSize: 12, marginTop: 2 },
    verseRow: {
      flexDirection: "row",
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      gap: 10,
    },
    verseNum: { fontSize: 12, fontWeight: "800", width: 24, marginTop: 2 },
    verseText: { flex: 1, fontSize: 15, lineHeight: 22 },
    // Search
    searchBar: {
      flexDirection: "row",
      padding: 12,
      gap: 8,
      borderBottomWidth: 1,
    },
    searchInput: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      fontSize: 15,
    },
    searchBtn: {
      paddingHorizontal: 16,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    resultCount: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 12,
    },
    resultRow: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      marginBottom: 8,
    },
    resultRef: { fontSize: 13, fontWeight: "800", marginBottom: 4 },
    resultText: { fontSize: 14, lineHeight: 20 },
    // Highlights
    hlHeader: {
      padding: 16,
      borderBottomWidth: 1,
    },
    hlHeaderTitle: { fontSize: 17, fontWeight: "800" },
    hlHeaderHint: { fontSize: 12, marginTop: 4 },
    hlRow: {
      borderRadius: 12,
      borderWidth: 1.5,
      padding: 12,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    hlDot: { width: 10, height: 10, borderRadius: 5 },
    hlRef: { fontSize: 13, fontWeight: "800" },
    hlText: { fontSize: 14, lineHeight: 20, marginTop: 2 },
    hlRemoveBtn: { padding: 4, marginLeft: 8 },
    hlPickerSheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 36,
    },
    hlVersePreview: {
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 16,
      fontStyle: "italic",
    },
    hlColorRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 8,
    },
    hlColorBtn: {
      width: 56,
      height: 72,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    hlColorDot: { width: 20, height: 20, borderRadius: 10 },
    // Modals
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%", padding: 16 },
    transSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "75%", padding: 20, paddingBottom: 36 },
    sheetHandle: { width: 40, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
    sheetTitle: { fontSize: 17, fontWeight: "800", marginBottom: 8 },
    verseTextSmall: { fontSize: 13, lineHeight: 18 },
    pickerItem: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 0.5 },
    pickerItemText: { fontSize: 15, fontWeight: "500" },
    chapterChip: {
      flex: 1, margin: 4, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center",
    },
    transRow: { flexDirection: "row", gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, alignItems: "flex-start" },
    transScript: { fontSize: 26, fontWeight: "700", width: 50, textAlign: "center" },
    transEnglish: { fontSize: 14, fontWeight: "600" },
    transStrongs: { fontSize: 11, fontWeight: "700", marginTop: 1 },
    transMeaning: { fontSize: 12, marginTop: 2 },
    closeBtn: { borderRadius: 14, padding: 14, alignItems: "center", marginTop: 16 },
  });
