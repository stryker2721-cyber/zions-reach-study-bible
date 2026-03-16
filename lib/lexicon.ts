// Lexicon data service
// Loads Strong's Hebrew and Greek dictionaries from bundled JSON assets

export interface LexEntry {
  strongs: string;
  lemma: string;
  xlit: string;      // transliteration
  pron: string;      // pronunciation
  derivation: string;
  strongs_def: string;
  kjv_def: string;
  lang: "H" | "G";
}

export interface WordData {
  original: string;
  hebrew?: string;
  greek?: string;
  script: string;
  strongs: string;
  meaning: string;
  notes: string;
  transliteration: string;
  kjv_def?: string;
  lang: "H" | "G" | "none";
}

// Curated Genesis 1:1 data
export const GENESIS_1_1: WordData[] = [
  {
    original: "In", script: "בְּ", strongs: "N/A",
    meaning: "in, at, within", notes: "Preposition prefix",
    transliteration: "bə", lang: "H",
  },
  {
    original: "the", script: "", strongs: "N/A",
    meaning: "Definite article", notes: "",
    transliteration: "", lang: "none",
  },
  {
    original: "beginning", script: "רֵאשִׁית", strongs: "H7225",
    meaning: "first, start, beginning", notes: "Root: ראש (head)",
    transliteration: "rēʾšîṯ", lang: "H",
  },
  {
    original: "created", script: "בָּרָא", strongs: "H1254",
    meaning: "to create, shape, form", notes: "Divine creation — only God can 'bara'",
    transliteration: "bārāʾ", lang: "H",
  },
  {
    original: "God", script: "אֱלֹהִים", strongs: "H430",
    meaning: "God, plural of majesty", notes: "Plural form indicating divine authority and fullness",
    transliteration: "ʾĕlōhîm", lang: "H",
  },
  {
    original: "the", script: "הַ", strongs: "N/A",
    meaning: "Definite article", notes: "Hebrew definite article prefix",
    transliteration: "ha", lang: "H",
  },
  {
    original: "heavens", script: "שָּׁמַיִם", strongs: "H8064",
    meaning: "sky, cosmos, heavenly realm", notes: "Dual/plural form — sky and outer space",
    transliteration: "šāmayim", lang: "H",
  },
  {
    original: "and", script: "וְ", strongs: "H5771",
    meaning: "and, also, together with", notes: "Vav conjunctive — connects words and clauses",
    transliteration: "wə", lang: "H",
  },
  {
    original: "the", script: "הָ", strongs: "N/A",
    meaning: "Definite article", notes: "Hebrew definite article prefix",
    transliteration: "hā", lang: "H",
  },
  {
    original: "earth", script: "אָרֶץ", strongs: "H776",
    meaning: "earth, land, ground, territory", notes: "Physical earth, land, or ground",
    transliteration: "ʾāreṣ", lang: "H",
  },
];

// Curated John 1:1 data
export const JOHN_1_1: WordData[] = [
  {
    original: "In", script: "Ἐν", strongs: "G1722",
    meaning: "in, within, among", notes: "Greek preposition ἐν",
    transliteration: "en", lang: "G",
  },
  {
    original: "the", script: "τῇ", strongs: "G3588",
    meaning: "the (definite article, dative feminine)", notes: "Greek definite article",
    transliteration: "tē", lang: "G",
  },
  {
    original: "beginning", script: "ἀρχῇ", strongs: "G746",
    meaning: "beginning, origin, first cause", notes: "Same word used in Septuagint for Genesis 1:1",
    transliteration: "archē", lang: "G",
  },
  {
    original: "was", script: "ἦν", strongs: "G1510",
    meaning: "was, existed (imperfect — continuous past)", notes: "Imperfect tense: the Word already existed",
    transliteration: "ēn", lang: "G",
  },
  {
    original: "the", script: "ὁ", strongs: "G3588",
    meaning: "the (definite article, nominative masculine)", notes: "Greek definite article",
    transliteration: "ho", lang: "G",
  },
  {
    original: "Word", script: "Λόγος", strongs: "G3056",
    meaning: "word, reason, divine expression", notes: "Logos — the divine creative Word; reason and expression of God",
    transliteration: "Logos", lang: "G",
  },
  {
    original: "and", script: "καὶ", strongs: "G2532",
    meaning: "and, also, even", notes: "Greek conjunction kai",
    transliteration: "kai", lang: "G",
  },
  {
    original: "the", script: "ὁ", strongs: "G3588",
    meaning: "the (definite article)", notes: "Greek definite article",
    transliteration: "ho", lang: "G",
  },
  {
    original: "Word", script: "Λόγος", strongs: "G3056",
    meaning: "word, reason, divine expression", notes: "Logos — repeated for emphasis",
    transliteration: "Logos", lang: "G",
  },
  {
    original: "was", script: "ἦν", strongs: "G1510",
    meaning: "was, existed", notes: "Imperfect tense — continuous existence",
    transliteration: "ēn", lang: "G",
  },
  {
    original: "with", script: "πρὸς", strongs: "G4314",
    meaning: "with, toward, face to face", notes: "Pros — intimate personal relationship, not just proximity",
    transliteration: "pros", lang: "G",
  },
  {
    original: "God", script: "τὸν Θεόν", strongs: "G2316",
    meaning: "God (with article — the Father)", notes: "Θεόν with article refers to the Father",
    transliteration: "ton Theon", lang: "G",
  },
  {
    original: "and", script: "καὶ", strongs: "G2532",
    meaning: "and, also", notes: "Greek conjunction",
    transliteration: "kai", lang: "G",
  },
  {
    original: "the", script: "ὁ", strongs: "G3588",
    meaning: "the (definite article)", notes: "Greek definite article",
    transliteration: "ho", lang: "G",
  },
  {
    original: "Word", script: "Λόγος", strongs: "G3056",
    meaning: "word, reason, divine expression", notes: "Logos — third occurrence",
    transliteration: "Logos", lang: "G",
  },
  {
    original: "was", script: "ἦν", strongs: "G1510",
    meaning: "was, existed", notes: "Imperfect tense",
    transliteration: "ēn", lang: "G",
  },
  {
    original: "God", script: "Θεός", strongs: "G2316",
    meaning: "God (divine nature)", notes: "Without article — Colwell's rule: predicate nominative before verb = definite. The Word shares God's divine nature.",
    transliteration: "Theos", lang: "G",
  },
];
