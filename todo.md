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

## Round 6: PWA, Search Fixes, and Stripe Membership
- [ ] Finish PWA: add install banner to root layout
- [ ] Fix Lexicon search functionality
- [ ] Fix Study tab search functionality
- [ ] Set up Stripe account and get API keys
- [ ] Build membership database schema (users, subscriptions, trials)
- [ ] Integrate Stripe payment processing
- [ ] Build membership pricing page with three tiers
- [ ] Build subscription checkout flow
- [ ] Implement 3-day free trial with auto-renewal
- [ ] Build membership account/subscription management UI
- [ ] Set up custom domain hosting
- [ ] Deploy to custom domain

## Manus AI Mentor Feature
- [x] Set up Grok API key (xai-BUGGHqI4U5HpwJITEbo5W6praWQie5bh7uVYrTnqVM38d88RqxnQC6vokFRm3fsex13cOLyzboVAiZpy)
- [x] Validate Grok API key format and connectivity
- [x] Update database schema for mentor conversations and chat history
- [x] Build backend API endpoint `/api/mentor/chat` with context retrieval
- [x] Integrate Grok API (grok-4-latest) with streaming
- [x] Build frontend: Mentor tab with chat interface
- [x] Build chat UI with real-time message streaming
- [x] Add suggested prompts for Bible study
- [x] Add context from lexicons and current verse
- [ ] Test end-to-end mentor conversations and save checkpoint


## Bug Fixes (PRIORITY)
- [x] Fix Hebrew/Greek lexicon: load full lexicon data, not just one verse
- [x] Fix lexicon search: search queries returning no results (aligned JSON keys)
- [x] Fix Mentor AI: Enter key not sending messages (added onSubmitEditing)
- [x] Test all three fixes end-to-end

## Monetization & Feature Gating (Phase 5-8)
- [ ] Update database schema: user_subscriptions, ai_usage_tracking tables
- [ ] Stripe API key setup and product/price creation (monthly, yearly, lifetime)
- [ ] Backend: Stripe webhook handlers (subscription created/updated/deleted, payment success)
- [ ] Backend: Checkout session creation endpoint with trial_period_days: 3
- [ ] Backend: Track daily AI Mentor usage per user (reset daily)
- [ ] Backend: Check user plan and enforce feature access (highlights, AI limit)
- [ ] Frontend: Pricing page with comparison table (Free vs Paid)
- [ ] Frontend: "Start 3-Day Free Trial" buttons (monthly/yearly)
- [ ] Frontend: "Buy Lifetime for $99.99" button
- [ ] Frontend: Disable highlight UI entirely on free tier
- [ ] Frontend: Show upgrade modal when free user exceeds 3 AI chats/day
- [ ] Frontend: Premium verse explanation feature (click verse for AI explanation)
- [ ] Frontend: Upgrade prompts and friendly UX messaging
- [ ] Test end-to-end: free tier limits, trial signup, payment, webhook events
