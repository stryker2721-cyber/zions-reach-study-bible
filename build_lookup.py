"""
Build English-word-keyed lookup tables for both Hebrew and Greek lexicons,
plus curated verse data for key OT and NT passages.
"""
import json

# ── Load full Strong's lexicons ────────────────────────────────────────────
with open("strongs_hebrew_lexicon.json", "r", encoding="utf-8") as f:
    hebrew_lex = json.load(f)

with open("strongs_greek_lexicon.json", "r", encoding="utf-8") as f:
    greek_lex = json.load(f)

# ── Curated Genesis 1:1 (Hebrew OT) ───────────────────────────────────────
genesis_1_1 = [
    {
        "original": "In",
        "strongs": "N/A",
        "script": "בְּ",
        "transliteration": "bə-",
        "meaning": "in, at, within",
        "kjv": "in",
        "notes": "Preposition prefix attached to the following word"
    },
    {
        "original": "the",
        "strongs": "N/A",
        "script": "",
        "transliteration": "hā-",
        "meaning": "Definite article",
        "kjv": "the",
        "notes": "Definite article prefix (הַ) — attached to noun, not a standalone word"
    },
    {
        "original": "beginning",
        "strongs": "H7225",
        "script": "רֵאשִׁית",
        "transliteration": "rêʼshîyth",
        "meaning": "first, beginning, chief",
        "kjv": "beginning, firstfruits, first, chief",
        "notes": "Root: ראש (rosh = head/chief). Feminine noun, construct state."
    },
    {
        "original": "created",
        "strongs": "H1254",
        "script": "בָּרָא",
        "transliteration": "bārāʼ",
        "meaning": "to create, shape, form",
        "kjv": "create, creator, choose, cut down, dispatch, do, make",
        "notes": "Divine creation — only God is subject of bārāʼ. Qal perfect, 3ms."
    },
    {
        "original": "God",
        "strongs": "H430",
        "script": "אֱלֹהִים",
        "transliteration": "ʼĕlôhîym",
        "meaning": "God, gods, divine beings",
        "kjv": "God, gods, judges, angels",
        "notes": "Plural of majesty (grammatically plural, theologically singular here). Subject of bārāʼ."
    },
    {
        "original": "the",
        "strongs": "N/A",
        "script": "הַ",
        "transliteration": "hā-",
        "meaning": "Definite article",
        "kjv": "the",
        "notes": "Definite article prefix attached to שָּׁמַיִם"
    },
    {
        "original": "heavens",
        "strongs": "H8064",
        "script": "שָּׁמַיִם",
        "transliteration": "shāmayim",
        "meaning": "sky, heaven, cosmos",
        "kjv": "air, astrologers, heaven, sky",
        "notes": "Always plural in Hebrew (dual form). Encompasses sky, atmosphere, and cosmic realm."
    },
    {
        "original": "and",
        "strongs": "H5771",
        "script": "וְ",
        "transliteration": "wə-",
        "meaning": "and, also, even",
        "kjv": "and, also, even, then",
        "notes": "Waw conjunctive — prefix connecting words and clauses"
    },
    {
        "original": "the",
        "strongs": "N/A",
        "script": "הָ",
        "transliteration": "hā-",
        "meaning": "Definite article",
        "kjv": "the",
        "notes": "Definite article prefix attached to אָרֶץ"
    },
    {
        "original": "earth",
        "strongs": "H776",
        "script": "אָרֶץ",
        "transliteration": "ʼerets",
        "meaning": "earth, land, ground, country",
        "kjv": "common, country, earth, field, ground, land, nations, way, wilderness, world",
        "notes": "Feminine noun. Can mean the whole earth or a specific land/territory by context."
    }
]

# ── Curated John 1:1 (Greek NT) ───────────────────────────────────────────
john_1_1 = [
    {
        "original": "In",
        "strongs": "G1722",
        "script": "Ἐν",
        "transliteration": "En",
        "meaning": "in, on, at, by, with",
        "kjv": "in, by, with, among, at",
        "notes": "Preposition governing the dative case. Indicates location or sphere."
    },
    {
        "original": "the",
        "strongs": "G3588",
        "script": "τῇ",
        "transliteration": "tē",
        "meaning": "the (definite article)",
        "kjv": "the, this, that, one, he, she, it",
        "notes": "Definite article, dative feminine singular, agreeing with ἀρχῇ"
    },
    {
        "original": "beginning",
        "strongs": "G746",
        "script": "ἀρχῇ",
        "transliteration": "archē",
        "meaning": "beginning, origin, first cause, ruler",
        "kjv": "beginning, principality, corner, first, magistrate, power, principle, rule",
        "notes": "Dative singular of ἀρχή. Echoes Genesis 1:1 (LXX: ἐν ἀρχῇ). Denotes absolute beginning."
    },
    {
        "original": "was",
        "strongs": "G2258",
        "script": "ἦν",
        "transliteration": "ēn",
        "meaning": "was, existed, had been",
        "kjv": "was, were, had been, taught, when",
        "notes": "Imperfect active indicative of εἰμί (to be). Indicates continuous pre-existence, not a beginning."
    },
    {
        "original": "the",
        "strongs": "G3588",
        "script": "ὁ",
        "transliteration": "ho",
        "meaning": "the (definite article)",
        "kjv": "the, this, that, one, he, she, it",
        "notes": "Definite article, nominative masculine singular, identifying ὁ Λόγος as a specific person."
    },
    {
        "original": "Word",
        "strongs": "G3056",
        "script": "Λόγος",
        "transliteration": "Logos",
        "meaning": "word, reason, discourse, the divine Word",
        "kjv": "word, saying, account, cause, communication, doctrine, fame, intent, matter, mouth, preaching, question, reason, reckon, remove, say, shew, speech, talk, thing, tidings, treatise, utterance",
        "notes": "Nominative masculine singular. In Greek philosophy: divine reason/order. John uses it for the pre-incarnate Christ."
    },
    {
        "original": "and",
        "strongs": "G2532",
        "script": "καὶ",
        "transliteration": "kai",
        "meaning": "and, also, even, indeed",
        "kjv": "and, also, even, so then, too",
        "notes": "Coordinating conjunction. Used three times in John 1:1 for emphasis."
    },
    {
        "original": "the",
        "strongs": "G3588",
        "script": "ὁ",
        "transliteration": "ho",
        "meaning": "the (definite article)",
        "kjv": "the",
        "notes": "Definite article, nominative masculine singular"
    },
    {
        "original": "Word",
        "strongs": "G3056",
        "script": "Λόγος",
        "transliteration": "Logos",
        "meaning": "word, reason, discourse, the divine Word",
        "kjv": "word",
        "notes": "Repeated for emphasis — the same Word that was in the beginning was with God."
    },
    {
        "original": "was",
        "strongs": "G2258",
        "script": "ἦν",
        "transliteration": "ēn",
        "meaning": "was, existed",
        "kjv": "was",
        "notes": "Imperfect active indicative — continuous past existence"
    },
    {
        "original": "with",
        "strongs": "G4314",
        "script": "πρός",
        "transliteration": "pros",
        "meaning": "toward, with, face to face",
        "kjv": "with, toward, among, at, because of, before, between, by, for, in, into, nigh unto, of, at, pertaining to, that, to, throughout, till, unto, up, upon, where",
        "notes": "Preposition with accusative. Implies intimate, face-to-face relationship — not merely 'alongside'."
    },
    {
        "original": "God",
        "strongs": "G2316",
        "script": "θεόν",
        "transliteration": "Theon",
        "meaning": "God, deity, divine being",
        "kjv": "God, god, godly, godward",
        "notes": "Accusative singular of θεός. Here anarthrous (no article) — emphasizes the divine nature/quality."
    },
    {
        "original": "and",
        "strongs": "G2532",
        "script": "καὶ",
        "transliteration": "kai",
        "meaning": "and, also, even",
        "kjv": "and",
        "notes": "Coordinating conjunction"
    },
    {
        "original": "the",
        "strongs": "G3588",
        "script": "ὁ",
        "transliteration": "ho",
        "meaning": "the (definite article)",
        "kjv": "the",
        "notes": "Definite article — identifies the Logos as a specific, known person"
    },
    {
        "original": "Word",
        "strongs": "G3056",
        "script": "Λόγος",
        "transliteration": "Logos",
        "meaning": "word, reason, discourse, the divine Word",
        "kjv": "Word",
        "notes": "Third occurrence — the climactic statement: ὁ Λόγος was θεός (God)."
    },
    {
        "original": "was",
        "strongs": "G2258",
        "script": "ἦν",
        "transliteration": "ēn",
        "meaning": "was, existed",
        "kjv": "was",
        "notes": "Imperfect active indicative"
    },
    {
        "original": "God",
        "strongs": "G2316",
        "script": "θεός",
        "transliteration": "Theos",
        "meaning": "God, deity",
        "kjv": "God",
        "notes": "Predicate nominative without article — emphasizes divine nature/quality of the Logos. Colwell's rule applies."
    }
]

# ── Save curated verse data ────────────────────────────────────────────────
curated = {
    "genesis_1_1": {
        "reference": "Genesis 1:1",
        "language": "hebrew",
        "text": "In the beginning created God the heavens and the earth",
        "words": genesis_1_1
    },
    "john_1_1": {
        "reference": "John 1:1",
        "language": "greek",
        "text": "In the beginning was the Word and the Word was with God and the Word was God",
        "words": john_1_1
    }
}

with open("curated_verses.json", "w", encoding="utf-8") as f:
    json.dump(curated, f, ensure_ascii=False, indent=2)
print(f"Saved curated_verses.json")
print(f"  Genesis 1:1: {len(genesis_1_1)} words")
print(f"  John 1:1: {len(john_1_1)} words")

# ── Build a transliteration-keyed lookup for dynamic translation ──────────
# Map lowercase transliteration -> strongs entry (Hebrew)
heb_translit_map = {}
for key, entry in hebrew_lex.items():
    t = entry.get("transliteration", "").lower().strip("ʼʻ'")
    if t:
        heb_translit_map[t] = key

# Map lowercase transliteration -> strongs entry (Greek)
grk_translit_map = {}
for key, entry in greek_lex.items():
    t = entry.get("transliteration", "").lower().strip()
    if t:
        grk_translit_map[t] = key

with open("heb_translit_map.json", "w", encoding="utf-8") as f:
    json.dump(heb_translit_map, f, ensure_ascii=False)
with open("grk_translit_map.json", "w", encoding="utf-8") as f:
    json.dump(grk_translit_map, f, ensure_ascii=False)

print(f"\nBuilt Hebrew transliteration map: {len(heb_translit_map)} entries")
print(f"Built Greek transliteration map: {len(grk_translit_map)} entries")
print("\nAll done!")
