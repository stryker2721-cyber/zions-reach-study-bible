# Original Word Bible — Mobile App Design

## Brand Identity
- **App Name:** Original Word Bible
- **Tagline:** Study Scripture in its original languages
- **Color Palette:**
  - Background: Deep navy/indigo `#0a0812`
  - Surface: Dark purple `#13102a`
  - Hebrew accent: Gold `#f59e0b`
  - Greek accent: Sky blue `#38bdf8`
  - Primary action: Violet `#7c3aed`
  - Text: Off-white `#e8e5f5`
  - Muted: Slate `#8b85b0`

## Screen List

1. **Login Screen** — Username/password, Sign up link, Apple/Google OAuth buttons
2. **Sign Up Screen** — Email, username, password fields
3. **Study Screen (Home Tab)** — Language switcher (Hebrew OT / Greek NT / Lexicon), verse banner with tappable words, word cards grid, detail bottom sheet
4. **Bible Screen (Bible Tab)** — Book selector, chapter selector, verse list, tap-to-translate drawer
5. **Settings Screen (Settings Tab)** — Account info, theme, report issue, admin dashboard (admin only)
6. **Admin Dashboard** — User list, diagnostic codes, system info (modal/screen)
7. **Word Detail Sheet** — Hebrew/Greek script, Strong's number, transliteration, meaning, notes

## Key User Flows

### First Launch
Login Screen → (new user) Sign Up Screen → Study Screen
Login Screen → (existing user) enter credentials → Study Screen

### Word Study
Study Screen → tap word chip in verse banner → Word Detail Sheet slides up
Study Screen → tap word card → Word Detail Sheet slides up
Study Screen → switch to Greek NT → John 1:1 word cards load
Study Screen → Lexicon tab → search by English or Strong's number → results list → tap result → Word Detail Sheet

### Bible Reading
Bible Tab → select book from dropdown → select chapter → scroll verses → tap verse → Translation Drawer slides up showing each word with Hebrew/Greek

### Admin Flow
Settings Tab → Admin Dashboard (only visible to SNL2721) → Users tab / Diagnostics tab / System tab

## Navigation Structure
Bottom tab bar (3 tabs):
- 🔤 Study (default)
- 📖 Bible
- ⚙️ Settings

## Typography
- Hebrew: Frank Ruhl Libre (serif, RTL)
- Greek: GFS Didot (serif)
- UI: System font (SF Pro on iOS, Roboto on Android)

## Data Architecture
- `lexicon/hebrew.json` — 8,674 Strong's Hebrew entries
- `lexicon/greek.json` — 5,523 Strong's Greek entries
- `lexicon/genesis1_1.json` — curated Genesis 1:1 word data
- `lexicon/john1_1.json` — curated John 1:1 word data
- `bible/kjv.json` — full KJV Bible (66 books)
- Local storage: user session, last read position, bookmarks
- Backend (Flask API): auth, user management, diagnostics
