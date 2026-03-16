# Original Word Bible — Todo

- [x] Update theme colors (gold/navy/violet brand palette)
- [x] Update app.config.ts with app name and branding
- [x] Generate app icon/logo
- [x] Build auth context (login, signup, session persistence)
- [x] Build Login screen with username/password, Apple/Google buttons
- [x] Build Sign Up screen with email/username/password
- [x] Build Study screen — Hebrew OT tab (Genesis 1:1 word cards)
- [x] Build Study screen — Greek NT tab (John 1:1 word cards)
- [x] Build Study screen — Lexicon search tab
- [x] Build Word Detail bottom sheet
- [x] Build Bible screen — book/chapter navigation
- [x] Build Bible screen — verse list with tap-to-translate
- [x] Build Settings screen — account info, theme, sign out
- [x] Build Admin Dashboard — users list, diagnostics, system info
- [x] Add PWA manifest and service worker
- [x] All tests passing (8/8)
- [x] Save checkpoint and deliver

## New Changes (Round 2)
- [x] Study tab: replace top tab buttons with a dropdown menu (Hebrew OT / Greek NT / Lexicon Search)
- [x] Bible tab: add Bible version dropdown (KJV / NKJV / NLT / NIV)
- [x] Study search: add verse lookup by book + chapter + verse (e.g. "Matthew 24:5") with word-by-word translation

## Round 3 Features
- [x] Bible tab: verse search — keyword search across all 66 books with results list
- [x] Bible tab: verse highlight system — tap-hold or button to highlight a verse in a color
- [x] Bible tab: favorites — star a verse and view all starred verses in a Highlights/Favorites section
- [x] Highlights persisted locally with AsyncStorage

## Round 4 Fixes
- [ ] Fix verse highlighter — long-press on verse not saving/showing highlight color
- [ ] Expand Hebrew word study to cover entire Old Testament (all 23,145 verses)
- [ ] Expand Greek word study to cover entire New Testament (all 7,957 verses)
- [ ] Verse lookup in Study tab works for any verse in the Bible, not just Genesis 1:1 / John 1:1

## Round 4 & 5 Features
- [x] Fix verse highlighter — add visible highlight button per verse row (works on web + native)
- [x] Full Bible word-study engine — Hebrew for OT, Greek for NT, any verse
- [x] Browse by Category tab — People, Places, Names of God, Phrases, Creation, Theology
- [x] Browse categories show Hebrew/Greek script, word count badge, and detail word list
- [x] Browse tab added to bottom tab navigator
