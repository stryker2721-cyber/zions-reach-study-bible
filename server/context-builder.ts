/**
 * Context Builder Service
 * Enriches Mentor responses with Hebrew/Greek lexicon data and Bible verses
 */

interface LexiconEntry {
  strongsNumber: string;
  word: string;
  transliteration: string;
  definition: string;
  kjvTranslation: string;
  frequency?: number;
}

interface VerseContext {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  hebrew?: string;
  greek?: string;
}

/**
 * Build context string from verse reference and lexicon data
 */
export function buildMentorContext(
  verseReference?: string,
  selectedWords?: string[],
  hebrewLexicon?: Record<string, LexiconEntry>,
  greekLexicon?: Record<string, LexiconEntry>
): string {
  let context = "";

  if (verseReference) {
    context += `Current Study: ${verseReference}\n`;
  }

  if (selectedWords && selectedWords.length > 0) {
    context += `\nSelected Words for Study:\n`;

    selectedWords.forEach((word) => {
      // Try to find in Hebrew lexicon first
      const hebrewEntry = hebrewLexicon?.[word];
      if (hebrewEntry) {
        context += `- ${hebrewEntry.word} (${hebrewEntry.transliteration})\n`;
        context += `  Strong's: ${hebrewEntry.strongsNumber}\n`;
        context += `  Definition: ${hebrewEntry.definition}\n`;
        context += `  KJV: ${hebrewEntry.kjvTranslation}\n`;
      }

      // Try Greek lexicon
      const greekEntry = greekLexicon?.[word];
      if (greekEntry) {
        context += `- ${greekEntry.word} (${greekEntry.transliteration})\n`;
        context += `  Strong's: ${greekEntry.strongsNumber}\n`;
        context += `  Definition: ${greekEntry.definition}\n`;
        context += `  KJV: ${greekEntry.kjvTranslation}\n`;
      }
    });
  }

  return context;
}

/**
 * Extract Bible references from user question
 * Looks for patterns like "John 3:16", "Genesis 1:1", etc.
 */
export function extractBibleReferences(question: string): string[] {
  const bibleBooks = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job", "Psalm", "Psalms",
    "Proverbs", "Ecclesiastes", "Isaiah", "Jeremiah", "Lamentations",
    "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah",
    "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
    "Haggai", "Zechariah", "Malachi", "Matthew", "Mark",
    "Luke", "John", "Acts", "Romans", "1 Corinthians",
    "2 Corinthians", "Galatians", "Ephesians", "Philippians",
    "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
    "James", "1 Peter", "2 Peter", "1 John", "2 John",
    "3 John", "Jude", "Revelation"
  ];

  const references: string[] = [];
  const pattern = new RegExp(
    `(${bibleBooks.join("|")})\\s+(\\d+):(\\d+)(?:-(\\d+))?`,
    "gi"
  );

  let match;
  while ((match = pattern.exec(question)) !== null) {
    references.push(match[0]);
  }

  return references;
}

/**
 * Extract Hebrew/Greek words from user question
 * Looks for words in Hebrew or Greek script
 */
export function extractScriptWords(question: string): string[] {
  const hebrewPattern = /[\u0590-\u05FF]+/g;
  const greekPattern = /[\u0370-\u03FF]+/g;

  const hebrewWords = question.match(hebrewPattern) || [];
  const greekWords = question.match(greekPattern) || [];

  return [...new Set([...hebrewWords, ...greekWords])];
}

/**
 * Generate suggested follow-up questions based on current context
 */
export function generateSuggestedQuestions(
  verseReference?: string,
  word?: string
): string[] {
  const suggestions: string[] = [];

  if (verseReference) {
    suggestions.push(`What is the theological significance of ${verseReference}?`);
    suggestions.push(`What are the cross-references for ${verseReference}?`);
    suggestions.push(`How does ${verseReference} connect to other passages?`);
  }

  if (word) {
    suggestions.push(`What is the Hebrew/Greek meaning of "${word}"?`);
    suggestions.push(`Where else is "${word}" used in Scripture?`);
    suggestions.push(`What is the theological importance of "${word}"?`);
  }

  // Default suggestions if no context
  if (!verseReference && !word) {
    suggestions.push("What does this passage teach about God's character?");
    suggestions.push("How does this relate to the gospel?");
    suggestions.push("What is the historical context of this passage?");
  }

  return suggestions;
}

/**
 * Format lexicon entry for display in chat
 */
export function formatLexiconEntry(entry: LexiconEntry): string {
  return `
**${entry.word}** (${entry.transliteration})
Strong's: ${entry.strongsNumber}
Definition: ${entry.definition}
KJV Translation: ${entry.kjvTranslation}
${entry.frequency ? `Frequency: ${entry.frequency} times in Scripture` : ""}
  `.trim();
}
