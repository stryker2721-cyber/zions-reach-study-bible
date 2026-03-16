"""
Download all 66 KJV Bible books from aruljohn/Bible-kjv and combine into one JSON.
Structure: { "Genesis": { "1": { "1": "In the beginning...", "2": "..." }, ... }, ... }
"""
import json, urllib.request, time, os

BASE = "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master"

# All 66 book names as they appear in the repo
BOOKS = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
    "1Samuel","2Samuel","1Kings","2Kings","1Chronicles","2Chronicles","Ezra","Nehemiah",
    "Esther","Job","Psalms","Proverbs","Ecclesiastes","SongofSolomon","Isaiah","Jeremiah",
    "Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah",
    "Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
    "Matthew","Mark","Luke","John","Acts","Romans","1Corinthians","2Corinthians",
    "Galatians","Ephesians","Philippians","Colossians","1Thessalonians","2Thessalonians",
    "1Timothy","2Timothy","Titus","Philemon","Hebrews","James","1Peter","2Peter",
    "1John","2John","3John","Jude","Revelation"
]

# Display names (with spaces)
DISPLAY_NAMES = [
    "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
    "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah",
    "Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah",
    "Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah",
    "Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
    "Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians",
    "Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians",
    "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter",
    "1 John","2 John","3 John","Jude","Revelation"
]

bible = {}
book_list = []

for i, (slug, name) in enumerate(zip(BOOKS, DISPLAY_NAMES)):
    url = f"{BASE}/{slug}.json"
    print(f"[{i+1}/66] Downloading {name}...", end=" ", flush=True)
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            data = json.loads(r.read())
        chapters = {}
        for ch in data["chapters"]:
            ch_num = str(ch["chapter"])
            verses = {}
            for v in ch["verses"]:
                verses[str(v["verse"])] = v["text"]
            chapters[ch_num] = verses
        bible[name] = chapters
        book_list.append({"name": name, "slug": slug, "chapters": len(chapters)})
        print(f"✓ ({len(chapters)} chapters)")
    except Exception as e:
        print(f"✗ ERROR: {e}")
    time.sleep(0.1)

print(f"\nTotal books: {len(bible)}")
out_path = "/home/ubuntu/hebrew-word-study/kjv_bible.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(bible, f, ensure_ascii=False, separators=(",", ":"))

meta_path = "/home/ubuntu/hebrew-word-study/bible_books_meta.json"
with open(meta_path, "w", encoding="utf-8") as f:
    json.dump(book_list, f, indent=2)

print(f"Bible saved to {out_path} ({os.path.getsize(out_path)//1024} KB)")
print(f"Book metadata saved to {meta_path}")
