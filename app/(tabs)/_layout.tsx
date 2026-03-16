import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";

function TopTabBar({ state, descriptors, navigation }: any) {
  const colors = useColors();
  const { user, logout } = useAuth();
  const router = useRouter();

  const tabs = [
    { name: "index", label: "Study", icon: "🔤" },
    { name: "bible", label: "Bible", icon: "📖" },
    { name: "settings", label: "Settings", icon: "⚙️" },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace("/login" as any);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
      {/* App Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.appTitle, { color: colors.foreground }]}>📖 Original Word Bible</Text>
        <TouchableOpacity onPress={handleLogout} style={[styles.signOutBtn, { borderColor: colors.border }]}>
          <Text style={[styles.signOutText, { color: colors.muted }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Username badge */}
      {user && (
        <View style={[styles.userBar, { backgroundColor: colors.surface }]}>
          <Text style={[styles.userText, { color: colors.muted }]}>
            {user.isAdmin ? "👑 " : ""}Signed in as <Text style={{ color: colors.primary, fontWeight: "700" }}>{user.username}</Text>
          </Text>
        </View>
      )}

      {/* Tab Buttons */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {tabs.map((tab, index) => {
          const isFocused = state.index === index;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: isFocused ? colors.primary : colors.background,
                  borderColor: isFocused ? colors.primary : colors.border,
                },
              ]}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.8}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, { color: isFocused ? "#fff" : colors.muted }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  appTitle: { fontSize: 17, fontWeight: "800" },
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  signOutText: { fontSize: 12, fontWeight: "600" },
  userBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  userText: { fontSize: 12 },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 44,
  },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontSize: 13, fontWeight: "700" },
});

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      tabBar={(props) => <TopTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Study" }} />
      <Tabs.Screen name="bible" options={{ title: "Bible" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
