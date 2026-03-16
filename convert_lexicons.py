"""
Convert Strong's Hebrew and Greek JS dictionary files to clean JSON lexicons
suitable for the Hebrew Word Study Flask app.
"""
import json
import re

def extract_dict_from_js(filepath, var_name):
    """Extract the JSON object from a JS var declaration."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    # Find the start of the JSON object
    pattern = rf'var\s+{var_name}\s*=\s*(\{{.*\}})\s*;?\s*$'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        return json.loads(match.group(1))
    # Fallback: find first { to last }
    start = content.index('{')
    end = content.rindex('}') + 1
    return json.loads(content[start:end])

print("Converting Hebrew lexicon...")
hebrew_raw = extract_dict_from_js("strongs_hebrew_raw.js", "strongsHebrewDictionary")
print(f"  Loaded {len(hebrew_raw)} Hebrew entries")

print("Converting Greek lexicon...")
greek_raw = extract_dict_from_js("strongs_greek_raw.js", "strongsGreekDictionary")
print(f"  Loaded {len(greek_raw)} Greek entries")

def build_hebrew_entry(key, data):
    """Build a clean Hebrew lexicon entry."""
    lemma = data.get("lemma", "")
    xlit = data.get("xlit", "")
    pron = data.get("pron", "")
    strongs_def = data.get("strongs_def", "").strip().lstrip(";, ").strip("{}")
    kjv_def = data.get("kjv_def", "").strip()
    derivation = data.get("derivation", "").strip()

    # Build a concise notes string
    notes_parts = []
    if xlit:
        notes_parts.append(f"Transliteration: {xlit}")
    if pron:
        notes_parts.append(f"Pronunciation: {pron}")
    if derivation and len(derivation) < 120:
        notes_parts.append(f"Derivation: {derivation}")

    return {
        "strongs": key,
        "hebrew": lemma,
        "transliteration": xlit,
        "pronunciation": pron,
        "meaning": strongs_def if strongs_def else kjv_def,
        "kjv": kjv_def,
        "notes": "; ".join(notes_parts) if notes_parts else ""
    }

def build_greek_entry(key, data):
    """Build a clean Greek lexicon entry."""
    lemma = data.get("lemma", "")
    translit = data.get("translit", "")
    strongs_def = data.get("strongs_def", "").strip().lstrip(";, ").strip("{}")
    kjv_def = data.get("kjv_def", "").strip()
    derivation = data.get("derivation", "").strip()

    notes_parts = []
    if translit:
        notes_parts.append(f"Transliteration: {translit}")
    if derivation and len(derivation) < 120:
        notes_parts.append(f"Derivation: {derivation}")

    return {
        "strongs": key,
        "greek": lemma,
        "transliteration": translit,
        "meaning": strongs_def if strongs_def else kjv_def,
        "kjv": kjv_def,
        "notes": "; ".join(notes_parts) if notes_parts else ""
    }

# Build clean dictionaries keyed by Strong's number
hebrew_lexicon = {}
for key, data in hebrew_raw.items():
    hebrew_lexicon[key] = build_hebrew_entry(key, data)

greek_lexicon = {}
for key, data in greek_raw.items():
    greek_lexicon[key] = build_greek_entry(key, data)

# Save
with open("strongs_hebrew_lexicon.json", "w", encoding="utf-8") as f:
    json.dump(hebrew_lexicon, f, ensure_ascii=False, indent=2)
print(f"Saved strongs_hebrew_lexicon.json ({len(hebrew_lexicon)} entries)")

with open("strongs_greek_lexicon.json", "w", encoding="utf-8") as f:
    json.dump(greek_lexicon, f, ensure_ascii=False, indent=2)
print(f"Saved strongs_greek_lexicon.json ({len(greek_lexicon)} entries)")

# Also build a word-keyed lookup for the translate endpoint
# Hebrew: keyed by English word (lowercase) -> list of possible matches
# We'll build a simple transliteration-to-strongs map for lookup
print("\nSample Hebrew entries:")
for k in list(hebrew_lexicon.keys())[:3]:
    print(f"  {k}: {hebrew_lexicon[k]}")

print("\nSample Greek entries:")
for k in list(greek_lexicon.keys())[:3]:
    print(f"  {k}: {greek_lexicon[k]}")

print("\nDone!")
