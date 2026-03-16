"""
Build a comprehensive English-word → Strong's entry lookup map.
Strategy:
  1. Load all Hebrew (OT) and Greek (NT) Strong's entries.
  2. For each entry, extract the KJV renderings (English words the word was translated as).
  3. Build a map: english_word → [list of Strong's entries sorted by frequency].
  4. Also build a direct Strong's number lookup.
  5. Save as word_lookup.json (English→Strongs) and keep hebrew.json/greek.json as-is.
"""
import json, re, collections

print("Loading lexicons...")
with open("assets/data/hebrew.json", encoding="utf-8") as f:
    hebrew = json.load(f)   # H1..H8674

with open("assets/data/greek.json", encoding="utf-8") as f:
    greek = json.load(f)    # G1..G5624

# OT books (1-39) are Hebrew; NT books (40-66) are Greek
OT_BOOKS = {
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
    "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
    "Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
    "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
    "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi"
}

NT_BOOKS = {
    "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians",
    "Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians",
    "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter",
    "1 John","2 John","3 John","Jude","Revelation"
}

def clean_kjv(kjv_str):
    """Extract individual English words from KJV rendering string."""
    if not kjv_str:
        return []
    # Remove parenthetical notes, brackets, special chars
    s = re.sub(r'\([^)]*\)', '', kjv_str)
    s = re.sub(r'\[[^\]]*\]', '', s)
    # Split on commas, semicolons, slashes, hyphens between words
    parts = re.split(r'[,;/]', s)
    words = []
    for part in parts:
        part = part.strip()
        # Take first 1-3 words of each part
        sub = part.split()[:3]
        for w in sub:
            w = re.sub(r'[^a-zA-Z\']', '', w).lower().strip("'")
            if len(w) >= 2:
                words.append(w)
    return words

print("Building English → Strong's lookup map...")

# word → list of (strongs_id, entry_dict, lang)
word_to_strongs = collections.defaultdict(list)

# Process Hebrew
for sid, entry in hebrew.items():
    kjv_words = clean_kjv(entry.get("kjv", ""))
    for w in kjv_words:
        word_to_strongs[w].append({
            "strongs": sid,
            "script": entry.get("hebrew", ""),
            "transliteration": entry.get("transliteration", ""),
            "meaning": entry.get("meaning", ""),
            "kjv": entry.get("kjv", ""),
            "notes": entry.get("notes", ""),
            "lang": "H"
        })

# Process Greek
for sid, entry in greek.items():
    kjv_words = clean_kjv(entry.get("kjv", ""))
    for w in kjv_words:
        word_to_strongs[w].append({
            "strongs": sid,
            "script": entry.get("greek", ""),
            "transliteration": entry.get("transliteration", ""),
            "meaning": entry.get("meaning", ""),
            "kjv": entry.get("kjv", ""),
            "notes": entry.get("notes", ""),
            "lang": "G"
        })

# Deduplicate (keep first occurrence per strongs number per word)
deduped = {}
for word, entries in word_to_strongs.items():
    seen = set()
    unique = []
    for e in entries:
        if e["strongs"] not in seen:
            seen.add(e["strongs"])
            unique.append(e)
    deduped[word] = unique

print(f"  Total unique English words mapped: {len(deduped)}")

# Save word lookup
out_path = "assets/data/word_lookup.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(deduped, f, ensure_ascii=False, separators=(',', ':'))

import os
size_mb = os.path.getsize(out_path) / 1024 / 1024
print(f"  Saved to {out_path} ({size_mb:.1f} MB)")

# Also build a compact Strong's direct lookup (number → entry)
print("Building Strong's direct lookup...")
strongs_lookup = {}
for sid, entry in hebrew.items():
    strongs_lookup[sid] = {
        "strongs": sid,
        "script": entry.get("hebrew", ""),
        "transliteration": entry.get("transliteration", ""),
        "meaning": entry.get("meaning", ""),
        "kjv": entry.get("kjv", ""),
        "notes": entry.get("notes", ""),
        "lang": "H"
    }
for sid, entry in greek.items():
    strongs_lookup[sid] = {
        "strongs": sid,
        "script": entry.get("greek", ""),
        "transliteration": entry.get("transliteration", ""),
        "meaning": entry.get("meaning", ""),
        "kjv": entry.get("kjv", ""),
        "notes": entry.get("notes", ""),
        "lang": "G"
    }

strongs_path = "assets/data/strongs_lookup.json"
with open(strongs_path, "w", encoding="utf-8") as f:
    json.dump(strongs_lookup, f, ensure_ascii=False, separators=(',', ':'))

size2 = os.path.getsize(strongs_path) / 1024 / 1024
print(f"  Saved to {strongs_path} ({size2:.1f} MB)")

# Quick test
test_words = ["love", "god", "created", "beginning", "light", "faith", "grace", "holy", "lord", "spirit"]
print("\nSample lookups:")
for w in test_words:
    entries = deduped.get(w, [])
    if entries:
        e = entries[0]
        print(f"  '{w}' → {e['strongs']} ({e['lang']}) {e['script']} = {e['meaning'][:50]}")
    else:
        print(f"  '{w}' → NOT FOUND")

print("\nDone!")
