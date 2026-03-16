import { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Modal, Pressable,
  ScrollView, StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// ── Types ─────────────────────────────────────────────────────────────────────
interface WordEntry {
  word: string;
  script: string;
  transliteration: string;
  strongs: string;
  meaning: string;
  notes: string;
  lang: "H" | "G";
  reference?: string;
}

interface Category {
  id: string;
  title: string;
  subtitle: string;
  script: string;
  transliteration: string;
  icon: string;
  lang: "H" | "G" | "both";
  words: WordEntry[];
}

// ── Category Data ─────────────────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  {
    id: "names_of_god",
    title: "Names of God",
    subtitle: "Divine names and titles",
    script: "שְׁמוֹת",
    transliteration: "Shemot",
    icon: "✨",
    lang: "both",
    words: [
      { word: "Elohim", script: "אֱלֹהִים", transliteration: "ʾĕlōhîm", strongs: "H430", meaning: "God — plural of majesty, the Creator", notes: "Used 2,570 times in the OT. Plural form expressing divine majesty and fullness.", lang: "H", reference: "Genesis 1:1" },
      { word: "YHWH (LORD)", script: "יְהוָה", transliteration: "YHWH / Yahweh", strongs: "H3068", meaning: "The LORD — the personal covenant name of God", notes: "The Tetragrammaton. Means 'I AM WHO I AM' (Exodus 3:14). Used ~6,800 times.", lang: "H", reference: "Exodus 3:14" },
      { word: "El Shaddai", script: "אֵל שַׁדַּי", transliteration: "ʾĒl Šadday", strongs: "H7706", meaning: "God Almighty — the all-sufficient one", notes: "First used in Genesis 17:1. Emphasizes God's power and sufficiency.", lang: "H", reference: "Genesis 17:1" },
      { word: "Adonai", script: "אֲדֹנָי", transliteration: "ʾĂdōnāy", strongs: "H136", meaning: "Lord, Master — sovereign ruler", notes: "Used as a substitute for YHWH in Jewish tradition. Means 'my lords' (plural of majesty).", lang: "H", reference: "Psalm 8:1" },
      { word: "El Elyon", script: "אֵל עֶלְיוֹן", transliteration: "ʾĒl ʿElyôn", strongs: "H5945", meaning: "God Most High — the highest authority", notes: "Used by Melchizedek in Genesis 14:18. Emphasizes God's supremacy over all.", lang: "H", reference: "Genesis 14:18" },
      { word: "El Roi", script: "אֵל רֳאִי", transliteration: "ʾĒl Rōʾî", strongs: "H7210", meaning: "The God who sees me", notes: "Name given by Hagar in Genesis 16:13. God sees and cares for the overlooked.", lang: "H", reference: "Genesis 16:13" },
      { word: "Theos", script: "Θεός", transliteration: "Theós", strongs: "G2316", meaning: "God — the supreme divine being", notes: "Used 1,317 times in the NT. The standard Greek word for God.", lang: "G", reference: "John 1:1" },
      { word: "Kyrios", script: "Κύριος", transliteration: "Kýrios", strongs: "G2962", meaning: "Lord, Master — supreme authority", notes: "Used 717 times in the NT. Applied to both God the Father and Jesus Christ.", lang: "G", reference: "Romans 10:9" },
    ],
  },
  {
    id: "people",
    title: "People",
    subtitle: "Names of biblical figures",
    script: "אֲנָשִׁים",
    transliteration: "ʾĂnāšîm",
    icon: "👤",
    lang: "H",
    words: [
      { word: "Adam", script: "אָדָם", transliteration: "ʾĀdām", strongs: "H120", meaning: "Man, mankind — from adamah (ground/earth)", notes: "The first man. His name connects to the earth (adamah) from which he was formed.", lang: "H", reference: "Genesis 2:7" },
      { word: "Eve (Chavah)", script: "חַוָּה", transliteration: "Ḥawwāh", strongs: "H2332", meaning: "Living, life-giver", notes: "Named by Adam because she was the mother of all living (Genesis 3:20).", lang: "H", reference: "Genesis 3:20" },
      { word: "Abraham", script: "אַבְרָהָם", transliteration: "ʾAbrāhām", strongs: "H85", meaning: "Father of a multitude", notes: "Originally Abram ('exalted father'), renamed by God in Genesis 17:5.", lang: "H", reference: "Genesis 17:5" },
      { word: "Moses (Moshe)", script: "מֹשֶׁה", transliteration: "Mōšeh", strongs: "H4872", meaning: "Drawn out — from the water", notes: "Named by Pharaoh's daughter. Also may reflect Egyptian 'mose' meaning son/child.", lang: "H", reference: "Exodus 2:10" },
      { word: "David", script: "דָּוִד", transliteration: "Dāwîd", strongs: "H1732", meaning: "Beloved, dear one", notes: "Israel's greatest king. Ancestor of Jesus Christ. Author of many Psalms.", lang: "H", reference: "1 Samuel 16:13" },
      { word: "Yeshua (Jesus)", script: "יֵשׁוּעַ", transliteration: "Yēšûaʿ", strongs: "H3442", meaning: "YHWH saves, salvation", notes: "The Hebrew name of Jesus. Joshua is the OT equivalent. Matthew 1:21.", lang: "H", reference: "Matthew 1:21" },
      { word: "Iesous (Jesus)", script: "Ἰησοῦς", transliteration: "Iēsoûs", strongs: "G2424", meaning: "Jesus — the Greek form of Yeshua", notes: "Used 917 times in the NT. The name above every name (Philippians 2:9).", lang: "G", reference: "Matthew 1:1" },
      { word: "Paulos (Paul)", script: "Παῦλος", transliteration: "Paûlos", strongs: "G3972", meaning: "Small, humble", notes: "Originally Saul (Hebrew: Šāʾûl). Apostle to the Gentiles. Author of 13 NT letters.", lang: "G", reference: "Acts 13:9" },
    ],
  },
  {
    id: "places",
    title: "Places",
    subtitle: "Biblical lands and locations",
    script: "מְקוֹמוֹת",
    transliteration: "Məqômôt",
    icon: "🌍",
    lang: "H",
    words: [
      { word: "Eden", script: "עֵדֶן", transliteration: "ʿĒden", strongs: "H5731", meaning: "Delight, pleasure", notes: "The garden where God placed Adam and Eve. Location debated — possibly in Mesopotamia.", lang: "H", reference: "Genesis 2:8" },
      { word: "Jerusalem (Yerushalayim)", script: "יְרוּשָׁלַיִם", transliteration: "Yərûšālayim", strongs: "H3389", meaning: "City of peace / foundation of peace", notes: "The holy city. Capital of Israel. Site of the Temple. Called the City of David.", lang: "H", reference: "2 Samuel 5:7" },
      { word: "Zion (Tsiyon)", script: "צִיּוֹן", transliteration: "Ṣiyyôn", strongs: "H6726", meaning: "Fortress, monument — the holy hill", notes: "Originally a Jebusite fortress, became synonymous with Jerusalem and God's dwelling place.", lang: "H", reference: "Psalm 2:6" },
      { word: "Sinai", script: "סִינַי", transliteration: "Sînay", strongs: "H5514", meaning: "Thorny, possibly 'of Sin' (moon deity)", notes: "The mountain where God gave the Law to Moses. Also called Horeb.", lang: "H", reference: "Exodus 19:1" },
      { word: "Bethlehem", script: "בֵּית לֶחֶם", transliteration: "Bêt Leḥem", strongs: "H1035", meaning: "House of bread / house of food", notes: "Birthplace of David and Jesus. Micah 5:2 prophesied the Messiah would come from here.", lang: "H", reference: "Micah 5:2" },
      { word: "Jordan (Yarden)", script: "יַרְדֵּן", transliteration: "Yardēn", strongs: "H3383", meaning: "Descender — the river that flows down", notes: "The major river of Israel. Site of Israel's crossing into Canaan and Jesus' baptism.", lang: "H", reference: "Joshua 3:17" },
      { word: "Nazareth", script: "Ναζαρέθ", transliteration: "Nazaréth", strongs: "G3478", meaning: "Branch, sprout — possibly from netzer", notes: "Hometown of Jesus. Fulfills Isaiah 11:1 — the Branch (netzer) from Jesse's root.", lang: "G", reference: "Matthew 2:23" },
      { word: "Golgotha", script: "Γολγοθᾶ", transliteration: "Golgothâ", strongs: "G1115", meaning: "Place of the skull", notes: "The site of Jesus' crucifixion. Also called Calvary (from Latin calvaria, skull).", lang: "G", reference: "John 19:17" },
    ],
  },
  {
    id: "creation",
    title: "Creation",
    subtitle: "Words from Genesis 1",
    script: "בְּרֵאשִׁית",
    transliteration: "Bərēʾšît",
    icon: "🌎",
    lang: "H",
    words: [
      { word: "Bara (Created)", script: "בָּרָא", transliteration: "bārāʾ", strongs: "H1254", meaning: "To create — to shape, form, bring into existence", notes: "Used exclusively of divine creation. Only God can 'bara'. Never used of human making.", lang: "H", reference: "Genesis 1:1" },
      { word: "Reshit (Beginning)", script: "רֵאשִׁית", transliteration: "rēʾšît", strongs: "H7225", meaning: "First, beginning, chief — from rosh (head)", notes: "The very first word of the Hebrew Bible. Implies God existed before the beginning.", lang: "H", reference: "Genesis 1:1" },
      { word: "Shamayim (Heavens)", script: "שָׁמַיִם", transliteration: "šāmayim", strongs: "H8064", meaning: "Sky, heavens, cosmos — dual form", notes: "Always plural in Hebrew. May refer to the atmosphere and the starry heavens.", lang: "H", reference: "Genesis 1:1" },
      { word: "Eretz (Earth)", script: "אֶרֶץ", transliteration: "ʾereṣ", strongs: "H776", meaning: "Earth, land, ground, territory", notes: "Used 2,504 times in the OT. Can mean the whole earth or a specific land/country.", lang: "H", reference: "Genesis 1:1" },
      { word: "Tohu va-Vohu", script: "תֹהוּ וָבֹהוּ", transliteration: "tōhû wābōhû", strongs: "H8414", meaning: "Formless and void — chaos and emptiness", notes: "Describes the earth's initial state. The phrase appears again in Isaiah 34:11 and Jeremiah 4:23.", lang: "H", reference: "Genesis 1:2" },
      { word: "Ruach (Spirit/Wind)", script: "רוּחַ", transliteration: "rûaḥ", strongs: "H7307", meaning: "Spirit, wind, breath — the animating force", notes: "The Spirit of God hovering over the waters. Same word for breath, wind, and spirit.", lang: "H", reference: "Genesis 1:2" },
      { word: "Or (Light)", script: "אוֹר", transliteration: "ʾôr", strongs: "H216", meaning: "Light — illumination, daylight", notes: "God's first spoken creation. Light exists before the sun (created on day 4).", lang: "H", reference: "Genesis 1:3" },
      { word: "Yom (Day)", script: "יוֹם", transliteration: "yôm", strongs: "H3117", meaning: "Day — a period of time, a solar day", notes: "Used 2,301 times in the OT. In Genesis 1 it refers to the six days of creation.", lang: "H", reference: "Genesis 1:5" },
    ],
  },
  {
    id: "theology",
    title: "Theology",
    subtitle: "Key doctrinal words",
    script: "תֵּאוֹלוֹגִיָּה",
    transliteration: "Tēʾôlôgiyyāh",
    icon: "📜",
    lang: "both",
    words: [
      { word: "Chesed (Lovingkindness)", script: "חֶסֶד", transliteration: "ḥesed", strongs: "H2617", meaning: "Steadfast love, mercy, kindness, loyalty", notes: "One of the richest Hebrew words. Describes God's covenant love — loyal, unfailing, unconditional.", lang: "H", reference: "Psalm 136" },
      { word: "Shalom (Peace)", script: "שָׁלוֹם", transliteration: "šālôm", strongs: "H7965", meaning: "Peace, wholeness, completeness, well-being", notes: "Far richer than the English 'peace'. Encompasses total well-being, harmony, and restoration.", lang: "H", reference: "Numbers 6:26" },
      { word: "Emunah (Faith)", script: "אֱמוּנָה", transliteration: "ʾĕmûnāh", strongs: "H530", meaning: "Faithfulness, steadfastness, reliability", notes: "The OT word for faith emphasizes faithfulness and trustworthiness, not just belief.", lang: "H", reference: "Habakkuk 2:4" },
      { word: "Tsedaqah (Righteousness)", script: "צְדָקָה", transliteration: "ṣĕdāqāh", strongs: "H6666", meaning: "Righteousness, justice, rightness", notes: "Relational concept — being right in one's relationships with God and others.", lang: "H", reference: "Genesis 15:6" },
      { word: "Agape (Love)", script: "ἀγάπη", transliteration: "agápē", strongs: "G26", meaning: "Unconditional, self-sacrificial love", notes: "The highest form of love in Greek. God's love for humanity. Used in John 3:16.", lang: "G", reference: "1 John 4:8" },
      { word: "Pistis (Faith)", script: "πίστις", transliteration: "pístis", strongs: "G4102", meaning: "Faith, belief, trust, conviction", notes: "Used 243 times in the NT. Active trust and reliance on God, not merely intellectual belief.", lang: "G", reference: "Hebrews 11:1" },
      { word: "Charis (Grace)", script: "χάρις", transliteration: "cháris", strongs: "G5485", meaning: "Grace, favor, goodwill — unmerited kindness", notes: "The defining word of the NT. God's undeserved favor toward sinners. Used 155 times.", lang: "G", reference: "Ephesians 2:8" },
      { word: "Soteria (Salvation)", script: "σωτηρία", transliteration: "sōtēría", strongs: "G4991", meaning: "Salvation, deliverance, preservation", notes: "Comprehensive term for God's rescue of humanity from sin, death, and judgment.", lang: "G", reference: "Romans 1:16" },
    ],
  },
  {
    id: "phrases",
    title: "Phrases",
    subtitle: "Famous biblical expressions",
    script: "פְּרָזוֹת",
    transliteration: "Pərāzôt",
    icon: "💬",
    lang: "both",
    words: [
      { word: "Shema Yisrael", script: "שְׁמַע יִשְׂרָאֵל", transliteration: "Šəmaʿ Yiśrāʾēl", strongs: "H8085", meaning: "Hear, O Israel — the central Jewish declaration of faith", notes: "Deuteronomy 6:4. The foundational confession of Judaism. Jesus called it the greatest commandment.", lang: "H", reference: "Deuteronomy 6:4" },
      { word: "Hallelujah", script: "הַלְלוּיָהּ", transliteration: "Halləlûyāh", strongs: "H1984", meaning: "Praise the LORD — hallel (praise) + Yah (YHWH)", notes: "Used 24 times in Psalms. Appears in Revelation 19:1-6 in the NT. Universal praise word.", lang: "H", reference: "Psalm 150:1" },
      { word: "Amen", script: "אָמֵן", transliteration: "ʾāmēn", strongs: "H543", meaning: "So be it, truly, verily — affirmation of truth", notes: "From the root aman (to be firm, faithful). Jesus uniquely said 'Amen, amen' before speaking.", lang: "H", reference: "Deuteronomy 27:15" },
      { word: "Hosanna", script: "הוֹשִׁיעָה נָּא", transliteration: "Hôšîʿāh-nāʾ", strongs: "H3467", meaning: "Save now! Please save! — a cry for deliverance", notes: "From Psalm 118:25. Shouted at Jesus' triumphal entry. Became a word of praise.", lang: "H", reference: "Psalm 118:25" },
      { word: "Maranatha", script: "μαράνα θά", transliteration: "marana tha", strongs: "G3134", meaning: "Our Lord, come! — Aramaic prayer", notes: "One of the few Aramaic phrases in the NT (1 Corinthians 16:22). An early Christian prayer.", lang: "G", reference: "1 Corinthians 16:22" },
      { word: "Logos (Word)", script: "Λόγος", transliteration: "Lógos", strongs: "G3056", meaning: "Word, reason, divine expression", notes: "John 1:1. In Greek philosophy: the rational principle of the universe. In John: the pre-incarnate Christ.", lang: "G", reference: "John 1:1" },
    ],
  },
  {
    id: "covenants",
    title: "Covenants",
    subtitle: "God's binding agreements",
    script: "בְּרִיתוֹת",
    transliteration: "Bərîtôt",
    icon: "🤝",
    lang: "both",
    words: [
      { word: "Berit (Covenant)", script: "בְּרִית", transliteration: "bərît", strongs: "H1285", meaning: "Covenant, agreement, treaty, alliance", notes: "The foundational concept of God's relationship with humanity. Used 287 times in the OT.", lang: "H", reference: "Genesis 9:9" },
      { word: "Noahic Covenant", script: "קֶשֶׁת", transliteration: "qešet", strongs: "H7198", meaning: "Rainbow — the sign of the covenant with Noah", notes: "Genesis 9:8-17. God's promise never to destroy the earth by flood again.", lang: "H", reference: "Genesis 9:13" },
      { word: "Abrahamic Covenant", script: "מִילָה", transliteration: "mîlāh", strongs: "H4139", meaning: "Circumcision — the sign of the Abrahamic covenant", notes: "Genesis 17. God promises land, descendants, and blessing to Abraham and his seed.", lang: "H", reference: "Genesis 17:10" },
      { word: "Torah (Law)", script: "תּוֹרָה", transliteration: "tôrāh", strongs: "H8451", meaning: "Law, instruction, teaching — the Mosaic covenant", notes: "The 613 commandments given at Sinai. More than 'law' — it means divine instruction and guidance.", lang: "H", reference: "Exodus 24:12" },
      { word: "Diatheke (Covenant)", script: "διαθήκη", transliteration: "diathḗkē", strongs: "G1242", meaning: "Covenant, testament, will", notes: "Used 33 times in the NT. The New Covenant in Jesus' blood (Luke 22:20).", lang: "G", reference: "Hebrews 8:6" },
      { word: "Haima (Blood)", script: "αἷμα", transliteration: "haîma", strongs: "G129", meaning: "Blood — the seal of the new covenant", notes: "The blood of Jesus ratifies the New Covenant (Matthew 26:28). Central to atonement theology.", lang: "G", reference: "Matthew 26:28" },
    ],
  },
  {
    id: "worship",
    title: "Worship",
    subtitle: "Words of praise and prayer",
    script: "עֲבוֹדָה",
    transliteration: "ʿĂbôdāh",
    icon: "🙏",
    lang: "both",
    words: [
      { word: "Tehillah (Praise)", script: "תְּהִלָּה", transliteration: "tĕhillāh", strongs: "H8416", meaning: "Praise, song of praise, hymn", notes: "The plural Tehillim is the Hebrew name for the book of Psalms (songs of praise).", lang: "H", reference: "Psalm 22:3" },
      { word: "Yadah (Praise)", script: "יָדָה", transliteration: "yādāh", strongs: "H3034", meaning: "To praise, give thanks, confess — with extended hands", notes: "The root of Judah (Yehudah). Worship expressed through raised hands and confession.", lang: "H", reference: "Psalm 138:1" },
      { word: "Shabach (Praise)", script: "שָׁבַח", transliteration: "šābaḥ", strongs: "H7623", meaning: "To praise loudly, shout, commend", notes: "Exuberant, vocal praise. The kind of praise that cannot be contained or silenced.", lang: "H", reference: "Psalm 63:3" },
      { word: "Tefillah (Prayer)", script: "תְּפִלָּה", transliteration: "tĕpillāh", strongs: "H8605", meaning: "Prayer, intercession", notes: "The standard Hebrew word for prayer. The Temple was called 'a house of prayer' (Isaiah 56:7).", lang: "H", reference: "1 Kings 8:28" },
      { word: "Proskuneo (Worship)", script: "προσκυνέω", transliteration: "proskynéō", strongs: "G4352", meaning: "To worship, bow down, do obeisance", notes: "Literally 'to kiss toward'. Used 60 times in the NT. The primary NT word for worship.", lang: "G", reference: "John 4:24" },
      { word: "Eucharistia (Thanksgiving)", script: "εὐχαριστία", transliteration: "eucharistía", strongs: "G2169", meaning: "Thanksgiving, gratitude", notes: "Root of 'Eucharist' (the Lord's Supper). Paul commands giving thanks in all circumstances.", lang: "G", reference: "1 Thessalonians 5:18" },
    ],
  },
];

// ── Featured verse at top ─────────────────────────────────────────────────────
const FEATURED = {
  script: "שְׁמַע יִשְׂרָאֵל",
  transliteration: "Shema Yisrael",
  english: '"Hear, O Israel"',
  reference: "Deuteronomy 6:4",
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function BrowseScreen() {
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null);

  const s = styles(colors);

  return (
    <ScreenContainer edges={["left", "right", "bottom"]} containerClassName="flex-1">
      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[s.exploreLabel, { color: colors.primary }]}>EXPLORE</Text>
              <Text style={[s.headerTitle, { color: colors.foreground }]}>Browse by Category</Text>
            </View>

            {/* Featured Verse Banner */}
            <View style={[s.featuredCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.featuredScript, { color: "#C9A84C" }]}>{FEATURED.script}</Text>
              <Text style={[s.featuredTranslit, { color: colors.primary }]}>{FEATURED.transliteration}</Text>
              <Text style={[s.featuredEnglish, { color: colors.foreground }]}>{FEATURED.english}</Text>
              <Text style={[s.featuredRef, { color: colors.muted }]}>— {FEATURED.reference}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.categoryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setSelectedCategory(item)}
            activeOpacity={0.8}
          >
            <View style={[s.categoryIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.categoryTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[s.categorySubtitle, { color: colors.muted }]}>{item.subtitle}</Text>
              <Text style={[s.categoryScript, { color: "#C9A84C" }]}>{item.script}</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <View style={[s.countBadge, { backgroundColor: colors.primary }]}>
                <Text style={s.countText}>{item.words.length}</Text>
              </View>
              <Text style={[s.chevron, { color: colors.muted }]}>›</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8, marginHorizontal: 16 }} />}
      />

      {/* Category Word List Modal */}
      <Modal
        visible={selectedCategory !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCategory(null)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setSelectedCategory(null)}>
          <Pressable style={[s.categorySheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            {selectedCategory && (
              <>
                <View style={s.sheetHeaderRow}>
                  <Text style={{ fontSize: 28 }}>{selectedCategory.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sheetTitle, { color: colors.foreground }]}>{selectedCategory.title}</Text>
                    <Text style={[s.sheetScript, { color: "#C9A84C" }]}>{selectedCategory.script}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedCategory(null)} style={s.closeX}>
                    <Text style={{ color: colors.muted, fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={selectedCategory.words}
                  keyExtractor={(item) => item.strongs + item.word}
                  contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[s.wordRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => setSelectedWord(item)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <Text style={[s.wordScript, { color: item.lang === "H" ? "#C9A84C" : "#5B8DD9" }]}>{item.script}</Text>
                          <View style={[s.langBadge, { backgroundColor: item.lang === "H" ? "rgba(201,168,76,0.15)" : "rgba(91,141,217,0.15)" }]}>
                            <Text style={{ fontSize: 10, fontWeight: "700", color: item.lang === "H" ? "#C9A84C" : "#5B8DD9" }}>
                              {item.lang === "H" ? "Hebrew" : "Greek"}
                            </Text>
                          </View>
                        </View>
                        <Text style={[s.wordEnglish, { color: colors.foreground }]}>{item.word}</Text>
                        <Text style={[s.wordTranslit, { color: colors.muted }]}>{item.transliteration}</Text>
                        <Text style={[s.wordMeaning, { color: colors.muted }]} numberOfLines={2}>{item.meaning}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <Text style={[s.strongsNum, { color: colors.primary }]}>{item.strongs}</Text>
                        <Text style={[s.chevron, { color: colors.muted }]}>›</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Word Detail Modal */}
      <Modal
        visible={selectedWord !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedWord(null)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setSelectedWord(null)}>
          <Pressable style={[s.wordDetailSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            {selectedWord && (
              <ScrollView>
                {/* Script display */}
                <View style={[s.scriptBlock, { backgroundColor: selectedWord.lang === "H" ? "rgba(201,168,76,0.1)" : "rgba(91,141,217,0.1)", borderColor: selectedWord.lang === "H" ? "#C9A84C" : "#5B8DD9" }]}>
                  <Text style={[s.detailScript, { color: selectedWord.lang === "H" ? "#C9A84C" : "#5B8DD9" }]}>{selectedWord.script}</Text>
                  <Text style={[s.detailTranslit, { color: colors.muted }]}>{selectedWord.transliteration}</Text>
                </View>

                {/* Info rows */}
                <View style={s.detailRows}>
                  <View style={[s.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[s.detailLabel, { color: colors.muted }]}>English</Text>
                    <Text style={[s.detailValue, { color: colors.foreground }]}>{selectedWord.word}</Text>
                  </View>
                  <View style={[s.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[s.detailLabel, { color: colors.muted }]}>Language</Text>
                    <View style={[s.langBadge, { backgroundColor: selectedWord.lang === "H" ? "rgba(201,168,76,0.15)" : "rgba(91,141,217,0.15)" }]}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: selectedWord.lang === "H" ? "#C9A84C" : "#5B8DD9" }}>
                        {selectedWord.lang === "H" ? "Biblical Hebrew" : "Biblical Greek"}
                      </Text>
                    </View>
                  </View>
                  <View style={[s.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[s.detailLabel, { color: colors.muted }]}>Strong's</Text>
                    <Text style={[s.detailValue, { color: colors.primary, fontWeight: "800" }]}>{selectedWord.strongs}</Text>
                  </View>
                  <View style={[s.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[s.detailLabel, { color: colors.muted }]}>Meaning</Text>
                    <Text style={[s.detailValue, { color: colors.foreground, flex: 1 }]}>{selectedWord.meaning}</Text>
                  </View>
                  {selectedWord.reference && (
                    <View style={[s.detailRow, { borderBottomColor: colors.border }]}>
                      <Text style={[s.detailLabel, { color: colors.muted }]}>Reference</Text>
                      <Text style={[s.detailValue, { color: colors.primary }]}>{selectedWord.reference}</Text>
                    </View>
                  )}
                  <View style={[s.detailRow, { borderBottomColor: "transparent" }]}>
                    <Text style={[s.detailLabel, { color: colors.muted }]}>Notes</Text>
                    <Text style={[s.detailValue, { color: colors.foreground, flex: 1, lineHeight: 20 }]}>{selectedWord.notes}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[s.closeBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedWord(null)}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    header: { padding: 20, paddingTop: 16, borderBottomWidth: 1 },
    exploreLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
    headerTitle: { fontSize: 28, fontWeight: "900" },
    featuredCard: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center" },
    featuredScript: { fontSize: 36, fontWeight: "700", textAlign: "center", lineHeight: 48 },
    featuredTranslit: { fontSize: 16, fontStyle: "italic", marginTop: 4 },
    featuredEnglish: { fontSize: 15, fontWeight: "600", marginTop: 8, textAlign: "center" },
    featuredRef: { fontSize: 12, marginTop: 4 },
    categoryRow: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
    categoryIcon: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    categoryTitle: { fontSize: 17, fontWeight: "800" },
    categorySubtitle: { fontSize: 12, marginTop: 2 },
    categoryScript: { fontSize: 14, fontWeight: "600", marginTop: 4 },
    countBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, minWidth: 28, alignItems: "center" },
    countText: { color: "#fff", fontSize: 12, fontWeight: "800" },
    chevron: { fontSize: 22, fontWeight: "300" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    categorySheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "85%", paddingTop: 16 },
    sheetHandle: { width: 40, height: 4, backgroundColor: "#ccc", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
    sheetHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
    sheetTitle: { fontSize: 20, fontWeight: "800" },
    sheetScript: { fontSize: 16, fontWeight: "600", marginTop: 2 },
    closeX: { padding: 8 },
    wordRow: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 },
    wordScript: { fontSize: 22, fontWeight: "700" },
    langBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    wordEnglish: { fontSize: 15, fontWeight: "700", marginTop: 2 },
    wordTranslit: { fontSize: 12, fontStyle: "italic", marginTop: 2 },
    wordMeaning: { fontSize: 12, marginTop: 4, lineHeight: 17 },
    strongsNum: { fontSize: 12, fontWeight: "800" },
    wordDetailSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "85%", padding: 20, paddingBottom: 36 },
    scriptBlock: { borderRadius: 16, borderWidth: 1.5, padding: 20, alignItems: "center", marginBottom: 20 },
    detailScript: { fontSize: 48, fontWeight: "700", textAlign: "center" },
    detailTranslit: { fontSize: 16, fontStyle: "italic", marginTop: 6 },
    detailRows: { gap: 0 },
    detailRow: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 0.5, gap: 12, alignItems: "flex-start" },
    detailLabel: { width: 80, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, paddingTop: 2 },
    detailValue: { fontSize: 14, lineHeight: 20 },
    closeBtn: { borderRadius: 14, padding: 14, alignItems: "center", marginTop: 20 },
  });
