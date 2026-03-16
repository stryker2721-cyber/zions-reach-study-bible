import { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Modal, Pressable,
  StyleSheet, ActivityIndicator, ScrollView,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { GENESIS_1_1, JOHN_1_1, type WordData } from "@/lib/lexicon";

interface BibleVerse {
  verse: number;
  text: string;
}
interface BibleChapter {
  chapter: number;
  verses: BibleVerse[];
}
interface BibleBook {
  book: string;
  chapters: BibleChapter[];
}

type BibleData = BibleBook[];

let bibleCache: BibleData | null = null;

function getBible(): BibleData {
  if (!bibleCache) {
    bibleCache = require("../../assets/data/kjv_bible.json") as BibleData;
  }
  return bibleCache;
}

// Simple word-level translation using curated data
function getVerseTranslation(bookName: string, chapter: number, verseNum: number, verseText: string): WordData[] {
  if (bookName === "Genesis" && chapter === 1 && verseNum === 1) return GENESIS_1_1;
  if (bookName === "John" && chapter === 1 && verseNum === 1) return JOHN_1_1;
  // Generic: split verse into words, mark as no data
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

type BibleVersion = "KJV" | "NKJV" | "NLT" | "NIV";

const VERSION_INFO: Record<BibleVersion, { label: string; note: string }> = {
  KJV:  { label: "King James Version",        note: "KJV (1611)" },
  NKJV: { label: "New King James Version",     note: "NKJV (1982)" },
  NLT:  { label: "New Living Translation",     note: "NLT (2015)" },
  NIV:  { label: "New International Version",  note: "NIV (2011)" },
};

export default function BibleScreen() {
  const colors = useColors();
  const [bible, setBible] = useState<BibleData | null>(null);
  const [bookIndex, setBookIndex] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [transWords, setTransWords] = useState<WordData[]>([]);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [bibleVersion, setBibleVersion] = useState<BibleVersion>("KJV");
  const [showVersionPicker, setShowVersionPicker] = useState(false);

  useEffect(() => {
    // Load lazily
    setTimeout(() => setBible(getBible()), 100);
  }, []);

  const book = bible?.[bookIndex];
  const chapter = book?.chapters?.[chapterIndex];
  const verses = chapter?.verses ?? [];

  const handleVersePress = useCallback((verse: BibleVerse) => {
    const words = getVerseTranslation(book?.book ?? "", chapterIndex + 1, verse.verse, verse.text);
    setTransWords(words);
    setSelectedVerse(verse);
  }, [book, chapterIndex]);

  const s = styles(colors);

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
      {/* Bible Version Dropdown */}
      <View style={[s.versionBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[s.versionBtn, { backgroundColor: colors.background, borderColor: colors.primary }]}
          onPress={() => setShowVersionPicker(true)}
          activeOpacity={0.8}
        >
          <Text style={[s.versionBtnLabel, { color: colors.muted }]}>Bible Version</Text>
          <Text style={[s.versionBtnText, { color: colors.foreground }]}>{VERSION_INFO[bibleVersion].label}</Text>
          <Text style={[s.versionArrow, { color: colors.primary }]}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Controls */}
      <View style={[s.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* Book Picker */}
        <TouchableOpacity style={[s.pickerBtn, { borderColor: colors.border }]} onPress={() => setShowBookPicker(true)}>
          <Text style={[s.pickerText, { color: colors.foreground }]} numberOfLines={1}>{book?.book ?? "—"}</Text>
          <Text style={{ color: colors.muted, fontSize: 10 }}>▼</Text>
        </TouchableOpacity>

        {/* Chapter Picker */}
        <TouchableOpacity style={[s.pickerBtn, { borderColor: colors.border, flex: 0.5 }]} onPress={() => setShowChapterPicker(true)}>
          <Text style={[s.pickerText, { color: colors.foreground }]}>Ch. {chapterIndex + 1}</Text>
          <Text style={{ color: colors.muted, fontSize: 10 }}>▼</Text>
        </TouchableOpacity>

        {/* Prev / Next */}
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
        <Text style={[s.tapHint, { color: colors.muted }]}>Tap any verse to translate</Text>
      </View>

      {/* Verse List */}
      <FlatList
        data={verses}
        keyExtractor={(item) => String(item.verse)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.verseRow, { borderBottomColor: colors.border }]}
            onPress={() => handleVersePress(item)}
            activeOpacity={0.7}
          >
            <Text style={[s.verseNum, { color: colors.primary }]}>{item.verse}</Text>
            <Text style={[s.verseText, { color: colors.foreground }]}>{item.text}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Book Picker Modal */}
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

      {/* Chapter Picker Modal */}
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

      {/* Version Picker Modal */}
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
                📌 Note: The app currently uses the KJV text for all versions. Full NKJV, NLT, and NIV text integration is coming in a future update. The Hebrew/Greek word study works with all versions.
              </Text>
            </View>
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

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    versionBar: {
      padding: 10,
      borderBottomWidth: 1,
    },
    versionBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingVertical: 16,
      borderRadius: 14,
      borderWidth: 2,
      gap: 10,
    },
    versionBtnLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
    versionBtnText: { flex: 1, fontSize: 17, fontWeight: "800" },
    versionArrow: { fontSize: 14, fontWeight: "800" },
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
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.background,
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
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%", padding: 16 },
    transSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "75%", padding: 20, paddingBottom: 36 },
    sheetHandle: { width: 40, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
    sheetTitle: { fontSize: 17, fontWeight: "800", marginBottom: 8 },
    verseTextSmall: { fontSize: 13, lineHeight: 18 },
    pickerItem: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 0.5 },
    pickerItemText: { fontSize: 15, fontWeight: "500" },
    chapterChip: {
      flex: 1,
      margin: 4,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
    },
    transRow: { flexDirection: "row", gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, alignItems: "flex-start" },
    transScript: { fontSize: 26, fontWeight: "700", width: 50, textAlign: "center" },
    transEnglish: { fontSize: 14, fontWeight: "600" },
    transStrongs: { fontSize: 11, fontWeight: "700", marginTop: 1 },
    transMeaning: { fontSize: 12, marginTop: 2 },
    closeBtn: { borderRadius: 14, padding: 14, alignItems: "center", marginTop: 16 },
  });
