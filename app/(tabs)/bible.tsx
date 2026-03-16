import { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Modal, Pressable,
  StyleSheet, ActivityIndicator, ScrollView, TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BibleVerse { verse: number; text: string; }
interface BibleChapter { chapter: number; verses: BibleVerse[]; }
interface BibleBook { book: string; chapters: BibleChapter[]; }
type BibleData = BibleBook[];

interface WordEntry {
  original: string;
  script: string;
  strongs: string;
  transliteration: string;
  meaning: string;
  lang: "H" | "G" | "none";
}

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
  { name: "Gold",   value: "rgba(251,191,36,0.4)",  dot: "#F59E0B" },
  { name: "Green",  value: "rgba(34,197,94,0.35)",  dot: "#22C55E" },
  { name: "Blue",   value: "rgba(59,130,246,0.35)", dot: "#3B82F6" },
  { name: "Pink",   value: "rgba(236,72,153,0.35)", dot: "#EC4899" },
  { name: "Purple", value: "rgba(139,92,246,0.35)", dot: "#8B5CF6" },
];

const HIGHLIGHTS_KEY = "owb_highlights_v2";

type BibleVersion = "KJV" | "NKJV" | "NLT" | "NIV";
const VERSION_INFO: Record<BibleVersion, { label: string; note: string }> = {
  KJV:  { label: "King James Version",        note: "KJV (1611)" },
  NKJV: { label: "New King James Version",    note: "NKJV (1982)" },
  NLT:  { label: "New Living Translation",    note: "NLT (2015)" },
  NIV:  { label: "New International Version", note: "NIV (2011)" },
};

// OT books use Hebrew; NT books use Greek
const OT_BOOKS = new Set([
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
  "Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
  "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
  "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
]);

// ── Curated verse data for key passages ──────────────────────────────────────
const CURATED: Record<string, WordEntry[]> = {
  "Genesis:1:1": [
    { original: "In",        script: "בְּ",       strongs: "N/A",  transliteration: "bə-",         meaning: "in, at, within — preposition prefix",                    lang: "H" },
    { original: "the",       script: "",           strongs: "N/A",  transliteration: "hā-",         meaning: "Definite article",                                       lang: "H" },
    { original: "beginning", script: "רֵאשִׁית",   strongs: "H7225", transliteration: "rēʾšît",     meaning: "first, beginning, chief — root: ראש (head)",            lang: "H" },
    { original: "created",   script: "בָּרָא",     strongs: "H1254", transliteration: "bārāʾ",      meaning: "to create, shape, form — only God can 'bara'",           lang: "H" },
    { original: "God",       script: "אֱלֹהִים",   strongs: "H430",  transliteration: "ʾĕlōhîm",   meaning: "God, plural of majesty — indicates divine authority",     lang: "H" },
    { original: "the",       script: "הַ",         strongs: "N/A",  transliteration: "ha-",         meaning: "Definite article",                                       lang: "H" },
    { original: "heavens",   script: "שָּׁמַיִם",  strongs: "H8064", transliteration: "šāmayim",    meaning: "sky, cosmos, heavenly realm — dual form",                lang: "H" },
    { original: "and",       script: "וְ",         strongs: "H5771", transliteration: "wə-",        meaning: "and, also — conjunction prefix",                         lang: "H" },
    { original: "the",       script: "הָ",         strongs: "N/A",  transliteration: "hā-",         meaning: "Definite article",                                       lang: "H" },
    { original: "earth",     script: "אָרֶץ",      strongs: "H776",  transliteration: "ʾereṣ",      meaning: "earth, land, ground — physical earth",                   lang: "H" },
  ],
  "John:1:1": [
    { original: "In",        script: "Ἐν",         strongs: "G1722", transliteration: "en",         meaning: "in, by, with — primary preposition",                    lang: "G" },
    { original: "the",       script: "τῇ",         strongs: "G3588", transliteration: "tē",         meaning: "the — definite article (feminine dative)",               lang: "G" },
    { original: "beginning", script: "ἀρχῇ",       strongs: "G746",  transliteration: "archē",      meaning: "beginning, origin, first cause",                         lang: "G" },
    { original: "was",       script: "ἦν",         strongs: "G2258", transliteration: "ēn",         meaning: "was — imperfect of εἰμί (to be), continuous existence",  lang: "G" },
    { original: "the",       script: "ὁ",          strongs: "G3588", transliteration: "ho",         meaning: "the — definite article (masculine nominative)",          lang: "G" },
    { original: "Word",      script: "Λόγος",      strongs: "G3056", transliteration: "Logos",      meaning: "word, reason, divine expression — the pre-incarnate Christ", lang: "G" },
    { original: "and",       script: "καὶ",        strongs: "G2532", transliteration: "kai",        meaning: "and, also, even — coordinating conjunction",             lang: "G" },
    { original: "the",       script: "ὁ",          strongs: "G3588", transliteration: "ho",         meaning: "the — definite article",                                 lang: "G" },
    { original: "Word",      script: "Λόγος",      strongs: "G3056", transliteration: "Logos",      meaning: "word, reason, divine expression",                        lang: "G" },
    { original: "was",       script: "ἦν",         strongs: "G2258", transliteration: "ēn",         meaning: "was — imperfect continuous existence",                   lang: "G" },
    { original: "with",      script: "πρός",       strongs: "G4314", transliteration: "pros",       meaning: "with, toward, face-to-face — intimate relationship",     lang: "G" },
    { original: "God",       script: "τὸν Θεόν",   strongs: "G2316", transliteration: "Theon",      meaning: "God — with article: the Father",                         lang: "G" },
    { original: "and",       script: "καὶ",        strongs: "G2532", transliteration: "kai",        meaning: "and, also",                                              lang: "G" },
    { original: "the",       script: "ὁ",          strongs: "G3588", transliteration: "ho",         meaning: "the — definite article",                                 lang: "G" },
    { original: "Word",      script: "Λόγος",      strongs: "G3056", transliteration: "Logos",      meaning: "word, reason, divine expression",                        lang: "G" },
    { original: "was",       script: "ἦν",         strongs: "G2258", transliteration: "ēn",         meaning: "was — Colwell's Rule: θεός without article = qualitative", lang: "G" },
    { original: "God",       script: "Θεός",       strongs: "G2316", transliteration: "Theos",      meaning: "God — divine nature, without article (qualitative)",     lang: "G" },
  ],
  "John:3:16": [
    { original: "For",       script: "γάρ",        strongs: "G1063", transliteration: "gar",        meaning: "for, because — explanatory conjunction",                 lang: "G" },
    { original: "God",       script: "Θεός",       strongs: "G2316", transliteration: "Theos",      meaning: "God — the Father",                                       lang: "G" },
    { original: "so",        script: "οὕτως",      strongs: "G3779", transliteration: "houtōs",     meaning: "so, in this manner — refers to the manner of love",      lang: "G" },
    { original: "loved",     script: "ἠγάπησεν",   strongs: "G25",   transliteration: "ēgapēsen",   meaning: "loved — agapaō: unconditional, sacrificial love",         lang: "G" },
    { original: "the",       script: "τὸν",        strongs: "G3588", transliteration: "ton",        meaning: "the — definite article",                                 lang: "G" },
    { original: "world",     script: "κόσμον",     strongs: "G2889", transliteration: "kosmon",     meaning: "world, universe, mankind — all of humanity",             lang: "G" },
    { original: "that",      script: "ὥστε",       strongs: "G5620", transliteration: "hōste",      meaning: "so that, in order that — result clause",                 lang: "G" },
    { original: "he",        script: "αὐτοῦ",      strongs: "G846",  transliteration: "autou",      meaning: "his, of him — possessive pronoun",                       lang: "G" },
    { original: "gave",      script: "ἔδωκεν",     strongs: "G1325", transliteration: "edōken",     meaning: "gave — aorist: a completed, decisive act of giving",     lang: "G" },
    { original: "his",       script: "τὸν",        strongs: "G3588", transliteration: "ton",        meaning: "the — definite article",                                 lang: "G" },
    { original: "only",      script: "μονογενῆ",   strongs: "G3439", transliteration: "monogenē",   meaning: "only-begotten, one and only — unique Son",               lang: "G" },
    { original: "begotten",  script: "Υἱόν",       strongs: "G5207", transliteration: "Huion",      meaning: "Son — in the context of divine Sonship",                 lang: "G" },
    { original: "Son",       script: "Υἱόν",       strongs: "G5207", transliteration: "Huion",      meaning: "Son — the second person of the Trinity",                 lang: "G" },
    { original: "that",      script: "ἵνα",        strongs: "G2443", transliteration: "hina",       meaning: "that, in order that — purpose clause",                   lang: "G" },
    { original: "whosoever",  script: "πᾶς",       strongs: "G3956", transliteration: "pas",        meaning: "all, every, whosoever — without exception",              lang: "G" },
    { original: "believeth", script: "πιστεύων",   strongs: "G4100", transliteration: "pisteuōn",   meaning: "believes — present participle: ongoing, active faith",   lang: "G" },
    { original: "in",        script: "εἰς",        strongs: "G1519", transliteration: "eis",        meaning: "into, in — directional: faith directed toward Him",      lang: "G" },
    { original: "him",       script: "αὐτόν",      strongs: "G846",  transliteration: "auton",      meaning: "him — referring to the only-begotten Son",               lang: "G" },
    { original: "should",    script: "ἀπόληται",   strongs: "G622",  transliteration: "apolētai",   meaning: "should perish — aorist subjunctive: eternal destruction", lang: "G" },
    { original: "not",       script: "μὴ",         strongs: "G3361", transliteration: "mē",         meaning: "not — negation",                                         lang: "G" },
    { original: "perish",    script: "ἀπόληται",   strongs: "G622",  transliteration: "apolētai",   meaning: "perish, be destroyed — eternal separation from God",     lang: "G" },
    { original: "but",       script: "ἀλλά",       strongs: "G235",  transliteration: "alla",       meaning: "but, rather — strong contrast",                          lang: "G" },
    { original: "have",      script: "ἔχῃ",        strongs: "G2192", transliteration: "echē",       meaning: "have, possess — subjunctive: may have",                  lang: "G" },
    { original: "everlasting", script: "αἰώνιον",  strongs: "G166",  transliteration: "aiōnion",    meaning: "eternal, everlasting — of the age to come",              lang: "G" },
    { original: "life",      script: "ζωήν",       strongs: "G2222", transliteration: "zōēn",       meaning: "life — zōē: divine, eternal life",                       lang: "G" },
  ],
  "Psalms:23:1": [
    { original: "The",       script: "הַ",         strongs: "N/A",  transliteration: "ha-",         meaning: "Definite article",                                       lang: "H" },
    { original: "LORD",      script: "יְהוָה",     strongs: "H3068", transliteration: "YHWH",       meaning: "The LORD — the divine name, I AM WHO I AM",              lang: "H" },
    { original: "is",        script: "הוּא",       strongs: "H1931", transliteration: "hûʾ",        meaning: "is, he — third person pronoun used as copula",           lang: "H" },
    { original: "my",        script: "לִי",        strongs: "N/A",  transliteration: "lî",          meaning: "my, to me — first person possessive",                    lang: "H" },
    { original: "shepherd",  script: "רֹעִי",      strongs: "H7462", transliteration: "rōʿî",       meaning: "shepherd, to pasture, tend, feed — divine care",         lang: "H" },
    { original: "I",         script: "אֶחְסָר",    strongs: "H2637", transliteration: "ʾeḥsār",     meaning: "I shall not lack, want — first person imperfect",        lang: "H" },
    { original: "shall",     script: "לֹא",        strongs: "H3808", transliteration: "lōʾ",        meaning: "not, no — strong negation",                              lang: "H" },
    { original: "not",       script: "לֹא",        strongs: "H3808", transliteration: "lōʾ",        meaning: "not, no — negation particle",                            lang: "H" },
    { original: "want",      script: "אֶחְסָר",    strongs: "H2637", transliteration: "ʾeḥsār",     meaning: "lack, want, be without — complete provision promised",   lang: "H" },
  ],
};

// ── Bible cache ───────────────────────────────────────────────────────────────
let bibleCache: BibleData | null = null;
function getBible(): BibleData {
  if (!bibleCache) {
    bibleCache = require("../../assets/data/kjv_bible.json") as BibleData;
  }
  return bibleCache;
}

// ── Word lookup cache ─────────────────────────────────────────────────────────
let wordLookupCache: { H: Record<string, any>; G: Record<string, any> } | null = null;
function getWordLookup() {
  if (!wordLookupCache) {
    try {
      wordLookupCache = require("../../assets/data/word_lookup_v2.json");
    } catch {
      wordLookupCache = { H: {}, G: {} };
    }
  }
  return wordLookupCache!;
}

// ── Translation engine ────────────────────────────────────────────────────────
function getVerseTranslation(bookName: string, chapter: number, verseNum: number, verseText: string): WordEntry[] {
  // Check curated data first
  const key = `${bookName}:${chapter}:${verseNum}`;
  if (CURATED[key]) return CURATED[key];

  // Determine language based on book
  const lang: "H" | "G" = OT_BOOKS.has(bookName) ? "H" : "G";
  const lookup = getWordLookup();
  const map = lang === "H" ? lookup.H : lookup.G;

  return verseText.split(/\s+/).map((rawWord) => {
    const clean = rawWord.replace(/[^a-zA-Z']/g, "").toLowerCase();
    const entry = map[clean];
    if (entry) {
      return {
        original: rawWord.replace(/[^a-zA-Z'\s]/g, ""),
        script: entry.sc || "",
        strongs: entry.s || "N/A",
        transliteration: entry.tr || "",
        meaning: entry.m || "",
        lang,
      };
    }
    return {
      original: rawWord.replace(/[^a-zA-Z'\s]/g, ""),
      script: "",
      strongs: "N/A",
      transliteration: "",
      meaning: lang === "H" ? "Hebrew word — see Strong's concordance" : "Greek word — see Strong's concordance",
      lang,
    };
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BibleScreen() {
  const colors = useColors();

  const [bible, setBible] = useState<BibleData | null>(null);
  const [bookIndex, setBookIndex] = useState(0);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [transWords, setTransWords] = useState<WordEntry[]>([]);

  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [bibleVersion, setBibleVersion] = useState<BibleVersion>("KJV");
  const [showVersionPicker, setShowVersionPicker] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [highlights, setHighlights] = useState<Record<string, Highlight>>({});
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [pendingHighlightVerse, setPendingHighlightVerse] = useState<BibleVerse | null>(null);

  const [activeTab, setActiveTab] = useState<"read" | "search" | "highlights">("read");

  useEffect(() => {
    setTimeout(() => setBible(getBible()), 100);
    AsyncStorage.getItem(HIGHLIGHTS_KEY).then((raw) => {
      if (raw) setHighlights(JSON.parse(raw));
    });
  }, []);

  const book = bible?.[bookIndex];
  const chapter = book?.chapters?.[chapterIndex];
  const verses = chapter?.verses ?? [];

  const highlightKey = (bookName: string, ch: number, v: number) => `${bookName}:${ch}:${v}`;

  const saveHighlights = async (updated: Record<string, Highlight>) => {
    setHighlights(updated);
    await AsyncStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(updated));
  };

  const handleVersePress = useCallback((verse: BibleVerse) => {
    if (!book) return;
    const words = getVerseTranslation(book.book, chapterIndex + 1, verse.verse, verse.text);
    setTransWords(words);
    setSelectedVerse(verse);
  }, [book, chapterIndex]);

  const openHighlightPicker = useCallback((verse: BibleVerse) => {
    setPendingHighlightVerse(verse);
    setShowHighlightPicker(true);
  }, []);

  const applyHighlight = async (color: string) => {
    if (!pendingHighlightVerse || !book) return;
    const key = highlightKey(book.book, chapterIndex + 1, pendingHighlightVerse.verse);
    const existing = highlights[key];
    let updated: Record<string, Highlight>;
    if (existing && existing.color === color) {
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
  };

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
            results.push({ book: b.book, bookIndex: bi, chapter: ch.chapter, chapterIndex: ci, verse: v.verse, text: v.text, matchStart: idx, matchEnd: idx + query.length });
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
  };

  const s = styles(colors);
  const highlightList = Object.values(highlights).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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

      {/* Top Bar */}
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

      {/* READ TAB */}
      {activeTab === "read" && (
        <>
          <View style={[s.navBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity style={[s.pickerBtn, { borderColor: colors.border }]} onPress={() => setShowBookPicker(true)}>
              <Text style={[s.pickerText, { color: colors.foreground }]} numberOfLines={1}>{book?.book ?? "—"}</Text>
              <Text style={{ color: colors.muted, fontSize: 10 }}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.pickerBtn, { borderColor: colors.border, flex: 0.5 }]} onPress={() => setShowChapterPicker(true)}>
              <Text style={[s.pickerText, { color: colors.foreground }]}>Ch. {chapterIndex + 1}</Text>
              <Text style={{ color: colors.muted, fontSize: 10 }}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.arrowBtn, { borderColor: colors.border }]} onPress={() => setChapterIndex(Math.max(0, chapterIndex - 1))} disabled={chapterIndex === 0}>
              <Text style={[s.arrowText, { color: chapterIndex === 0 ? colors.muted : colors.primary }]}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.arrowBtn, { borderColor: colors.border }]} onPress={() => setChapterIndex(Math.min((book?.chapters.length ?? 1) - 1, chapterIndex + 1))} disabled={chapterIndex >= (book?.chapters.length ?? 1) - 1}>
              <Text style={[s.arrowText, { color: chapterIndex >= (book?.chapters.length ?? 1) - 1 ? colors.muted : colors.primary }]}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.chapterHeader, { backgroundColor: colors.background }]}>
            <Text style={[s.chapterTitle, { color: colors.foreground }]}>{book?.book} {chapterIndex + 1}</Text>
            <Text style={[s.tapHint, { color: colors.muted }]}>
              {OT_BOOKS.has(book?.book ?? "") ? "🟡 Hebrew OT" : "🔵 Greek NT"} · Tap verse to translate · 🖊 to highlight
            </Text>
          </View>

          <FlatList
            data={verses}
            keyExtractor={(item) => String(item.verse)}
            contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            renderItem={({ item }) => {
              const key = highlightKey(book?.book ?? "", chapterIndex + 1, item.verse);
              const hl = highlights[key];
              const colorDot = hl ? HIGHLIGHT_COLORS.find((c) => c.value === hl.color)?.dot : undefined;
              return (
                <View style={[s.verseRow, { borderBottomColor: colors.border }, hl ? { backgroundColor: hl.color, borderRadius: 10, marginBottom: 2, paddingHorizontal: 8 } : null]}>
                  {/* Verse number + highlight dot */}
                  <View style={{ alignItems: "center", width: 28 }}>
                    <Text style={[s.verseNum, { color: colors.primary }]}>{item.verse}</Text>
                    {hl && colorDot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colorDot, marginTop: 2 }} />}
                  </View>
                  {/* Verse text — tap to translate */}
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => handleVersePress(item)} activeOpacity={0.7}>
                    <Text style={[s.verseText, { color: colors.foreground }]}>{item.text}</Text>
                  </TouchableOpacity>
                  {/* Highlight button — always visible */}
                  <TouchableOpacity
                    style={[s.hlBtn, { borderColor: colorDot ?? colors.border, backgroundColor: hl ? hl.color : "transparent" }]}
                    onPress={() => openHighlightPicker(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 14 }}>🖊</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </>
      )}

      {/* SEARCH TAB */}
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
            <TouchableOpacity style={[s.searchBtn, { backgroundColor: colors.primary }]} onPress={doSearch} activeOpacity={0.8}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Search</Text>
            </TouchableOpacity>
          </View>
          {isSearching && <View style={{ padding: 20, alignItems: "center" }}><ActivityIndicator color={colors.primary} /></View>}
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
              <TouchableOpacity style={[s.resultRow, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigateToResult(item)} activeOpacity={0.8}>
                <Text style={[s.resultRef, { color: colors.primary }]}>{item.book} {item.chapter}:{item.verse}</Text>
                <Text style={[s.resultText, { color: colors.foreground }]} numberOfLines={3}>
                  {item.text.substring(0, item.matchStart)}
                  <Text style={{ fontWeight: "800", color: colors.primary }}>{item.text.substring(item.matchStart, item.matchEnd)}</Text>
                  {item.text.substring(item.matchEnd)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* HIGHLIGHTS TAB */}
      {activeTab === "highlights" && (
        <View style={{ flex: 1 }}>
          <View style={[s.hlHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.hlHeaderTitle, { color: colors.foreground }]}>🌟 Highlighted Verses ({highlightList.length})</Text>
            <Text style={[s.hlHeaderHint, { color: colors.muted }]}>Tap the 🖊 button on any verse to highlight it</Text>
          </View>
          {highlightList.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🌟</Text>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>No highlights yet</Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                In the Read tab, tap the 🖊 button next to any verse to highlight it in your chosen color
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
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => navigateToHighlight(item)} activeOpacity={0.8}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <View style={[s.hlDot, { backgroundColor: colorDot }]} />
                        <Text style={[s.hlRef, { color: colors.foreground }]}>{item.book} {item.chapter}:{item.verse}</Text>
                      </View>
                      <Text style={[s.hlText, { color: colors.foreground }]} numberOfLines={3}>{item.text}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.hlRemoveBtn} onPress={() => removeHighlight(key)} activeOpacity={0.7}>
                      <Text style={{ fontSize: 18, color: colors.muted }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* MODALS */}

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
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={[s.pickerItemText, { color: index === bookIndex ? colors.primary : colors.foreground }]}>{item.book}</Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>{OT_BOOKS.has(item.book) ? "OT 🟡" : "NT 🔵"}</Text>
                  </View>
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
                📌 Full NKJV, NLT, and NIV text integration coming soon. Hebrew/Greek word study works with all versions.
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
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>🖊 Highlight Verse</Text>
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
            <TouchableOpacity
              style={[s.removeHlBtn, { borderColor: colors.border }]}
              onPress={() => {
                if (!pendingHighlightVerse || !book) return;
                const key = highlightKey(book.book, chapterIndex + 1, pendingHighlightVerse.verse);
                removeHighlight(key);
                setShowHighlightPicker(false);
                setPendingHighlightVerse(null);
              }}
            >
              <Text style={{ color: colors.muted, fontSize: 13 }}>Remove Highlight</Text>
            </TouchableOpacity>
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
              {"  "}<Text style={{ fontSize: 12, color: colors.muted }}>{OT_BOOKS.has(book?.book ?? "") ? "🟡 Hebrew OT" : "🔵 Greek NT"}</Text>
            </Text>
            <Text style={[s.verseTextSmall, { color: colors.muted }]} numberOfLines={3}>{selectedVerse?.text}</Text>
            <ScrollView style={{ marginTop: 12 }}>
              {transWords.map((w, i) => {
                if (!w.original.trim()) return null;
                const isHebrew = w.lang === "H";
                const scriptColor = isHebrew ? "#C9A84C" : "#5B8DD9";
                return (
                  <View key={i} style={[s.transRow, { borderBottomColor: colors.border }]}>
                    <View style={{ width: 60, alignItems: "center" }}>
                      {w.script ? (
                        <Text style={[s.transScript, { color: scriptColor }]}>{w.script}</Text>
                      ) : (
                        <Text style={{ fontSize: 20, color: colors.muted }}>—</Text>
                      )}
                      {w.strongs !== "N/A" && (
                        <Text style={{ fontSize: 9, color: scriptColor, fontWeight: "700", marginTop: 2 }}>{w.strongs}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.transEnglish, { color: colors.foreground }]}>{w.original}</Text>
                      {w.transliteration ? (
                        <Text style={{ fontSize: 11, color: colors.muted, fontStyle: "italic", marginTop: 1 }}>{w.transliteration}</Text>
                      ) : null}
                      <Text style={[s.transMeaning, { color: colors.muted }]}>{w.meaning}</Text>
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
    topBar: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8, borderBottomWidth: 1 },
    versionBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 2, gap: 6, flex: 1 },
    versionBtnLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
    versionBtnText: { flex: 1, fontSize: 15, fontWeight: "800" },
    versionArrow: { fontSize: 12, fontWeight: "800" },
    innerTabs: { flexDirection: "row", gap: 6 },
    innerTab: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.border, backgroundColor: c.background },
    innerTabText: { fontSize: 18 },
    navBar: { flexDirection: "row", padding: 10, gap: 6, borderBottomWidth: 1, alignItems: "center" },
    pickerBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, backgroundColor: c.background, gap: 4 },
    pickerText: { fontSize: 13, fontWeight: "600", flex: 1 },
    arrowBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background },
    arrowText: { fontSize: 20, fontWeight: "700", lineHeight: 24 },
    chapterHeader: { paddingHorizontal: 16, paddingVertical: 10 },
    chapterTitle: { fontSize: 20, fontWeight: "800" },
    tapHint: { fontSize: 12, marginTop: 2 },
    verseRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 0.5, gap: 8, alignItems: "flex-start" },
    verseNum: { fontSize: 12, fontWeight: "800", marginTop: 2 },
    verseText: { fontSize: 15, lineHeight: 22 },
    hlBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 2 },
    searchBar: { flexDirection: "row", padding: 12, gap: 8, borderBottomWidth: 1 },
    searchInput: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15 },
    searchBtn: { paddingHorizontal: 16, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    resultCount: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 12 },
    resultRow: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
    resultRef: { fontSize: 13, fontWeight: "800", marginBottom: 4 },
    resultText: { fontSize: 14, lineHeight: 20 },
    hlHeader: { padding: 16, borderBottomWidth: 1 },
    hlHeaderTitle: { fontSize: 17, fontWeight: "800" },
    hlHeaderHint: { fontSize: 12, marginTop: 4 },
    hlRow: { borderRadius: 12, borderWidth: 1.5, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "flex-start" },
    hlDot: { width: 10, height: 10, borderRadius: 5 },
    hlRef: { fontSize: 13, fontWeight: "800" },
    hlText: { fontSize: 14, lineHeight: 20, marginTop: 2 },
    hlRemoveBtn: { padding: 4, marginLeft: 8 },
    hlPickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
    hlVersePreview: { fontSize: 13, lineHeight: 18, marginBottom: 16, fontStyle: "italic" },
    hlColorRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 8, marginBottom: 12 },
    hlColorBtn: { width: 56, height: 72, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 4 },
    hlColorDot: { width: 20, height: 20, borderRadius: 10 },
    removeHlBtn: { borderWidth: 1, borderRadius: 10, padding: 10, alignItems: "center", marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    pickerSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%", padding: 16 },
    transSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", padding: 20, paddingBottom: 36 },
    sheetHandle: { width: 40, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
    sheetTitle: { fontSize: 17, fontWeight: "800", marginBottom: 8 },
    verseTextSmall: { fontSize: 13, lineHeight: 18 },
    pickerItem: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 0.5 },
    pickerItemText: { fontSize: 15, fontWeight: "500" },
    chapterChip: { flex: 1, margin: 4, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
    transRow: { flexDirection: "row", gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, alignItems: "flex-start" },
    transScript: { fontSize: 24, fontWeight: "700", textAlign: "center" },
    transEnglish: { fontSize: 14, fontWeight: "600" },
    transMeaning: { fontSize: 12, marginTop: 2, lineHeight: 16 },
    closeBtn: { borderRadius: 14, padding: 14, alignItems: "center", marginTop: 16 },
  });
