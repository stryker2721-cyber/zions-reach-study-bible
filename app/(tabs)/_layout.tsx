import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";

// ── Custom Bottom Tab Bar ─────────────────────────────────────────────────────
function BottomTabBar({ state, navigation }: any) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: "index", label: "Study",    icon: "🔤" },
    { name: "bible", label: "Bible",    icon: "📖" },
    { name: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <View
      style={[
        styles.bottomBar,
        {
          backgroundColor: "#1a0533",
          paddingBottom: Math.max(insets.bottom, 12),
          borderTopColor: "rgba(255,255,255,0.15)",
        },
      ]}
    >
      {tabs.map((tab, index) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.bottomTabBtn,
              isFocused && styles.bottomTabBtnActive,
            ]}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.75}
          >
            <Text style={styles.bottomTabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.bottomTabLabel,
                { color: isFocused ? "#fff" : "rgba(255,255,255,0.5)" },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Custom Top Header ─────────────────────────────────────────────────────────
function TopHeader() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logout();
    router.replace("/login" as any);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#1a0533" }}>
      <View style={[styles.header, { paddingTop: 4 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appTitle}>📖 Original Word Bible</Text>
          {user && (
            <Text style={styles.userBadge}>
              {user.isAdmin ? "👑 " : ""}Signed in as {user.username}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#1a0533",
  },
  appTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  userBadge: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  signOutText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  bottomBar: {
    flexDirection: "row",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  bottomTabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 4,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  bottomTabBtnActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  bottomTabIcon: {
    fontSize: 24,
  },
  bottomTabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        header: () => <TopHeader />,
        headerShown: true,
      }}
    >
      <Tabs.Screen name="index"    options={{ title: "Study" }} />
      <Tabs.Screen name="bible"    options={{ title: "Bible" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
