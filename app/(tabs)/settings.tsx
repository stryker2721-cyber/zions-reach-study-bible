import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal, Pressable,
  StyleSheet, FlatList, TextInput, Alert, Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";

interface UserRecord {
  username: string;
  email: string;
  createdAt: string;
  disabled?: boolean;
}

interface DiagCode {
  code: string;
  username: string;
  createdAt: string;
  resolved: boolean;
  note: string;
}

const USERS_KEY = "owb_users";
const DIAG_KEY = "owb_diagnostics";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "OWB-";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function SettingsScreen() {
  const colors = useColors();
  const { user, logout } = useAuth();
  const router = useRouter();

  const [adminTab, setAdminTab] = useState<"users" | "diag" | "system">("users");
  const [showAdmin, setShowAdmin] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [diags, setDiags] = useState<DiagCode[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [issueNote, setIssueNote] = useState("");
  const [showIssueModal, setShowIssueModal] = useState(false);

  useEffect(() => {
    if (user?.isAdmin) loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    const list: UserRecord[] = Object.entries(stored).map(([username, val]: any) => ({
      username,
      email: val.email,
      createdAt: val.createdAt,
      disabled: val.disabled ?? false,
    }));
    setUsers(list);

    const diagRaw = await AsyncStorage.getItem(DIAG_KEY);
    setDiags(diagRaw ? JSON.parse(diagRaw) : []);
  };

  const toggleUser = async (username: string) => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[username].disabled = !stored[username].disabled;
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(stored));
    loadAdminData();
  };

  const resolveCode = async (code: string) => {
    const updated = diags.map((d) => d.code === code ? { ...d, resolved: true } : d);
    await AsyncStorage.setItem(DIAG_KEY, JSON.stringify(updated));
    setDiags(updated);
  };

  const handleGenerateCode = async () => {
    const code = generateCode();
    const entry: DiagCode = {
      code,
      username: user?.username ?? "unknown",
      createdAt: new Date().toISOString(),
      resolved: false,
      note: issueNote,
    };
    const raw = await AsyncStorage.getItem(DIAG_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(entry);
    await AsyncStorage.setItem(DIAG_KEY, JSON.stringify(existing));
    setGeneratedCode(code);
    setIssueNote("");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login" as any);
  };

  const s = styles(colors);

  return (
    <ScreenContainer edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Account Card */}
        <View style={[s.card, { borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.muted }]}>Account</Text>
          <View style={s.row}>
            <Text style={[s.rowLabel, { color: colors.foreground }]}>Username</Text>
            <Text style={[s.rowValue, { color: colors.primary }]}>{user?.username}</Text>
          </View>
          <View style={[s.row, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
            <Text style={[s.rowLabel, { color: colors.foreground }]}>Email</Text>
            <Text style={[s.rowValue, { color: colors.muted }]}>{user?.email}</Text>
          </View>
          <View style={[s.row, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
            <Text style={[s.rowLabel, { color: colors.foreground }]}>Role</Text>
            <Text style={[s.rowValue, { color: user?.isAdmin ? colors.hebrew : colors.muted }]}>
              {user?.isAdmin ? "👑 Administrator" : "Member"}
            </Text>
          </View>
          <View style={[s.row, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
            <Text style={[s.rowLabel, { color: colors.foreground }]}>Member since</Text>
            <Text style={[s.rowValue, { color: colors.muted }]}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </Text>
          </View>
        </View>

        {/* About Card */}
        <View style={[s.card, { borderColor: colors.border, marginTop: 16 }]}>
          <Text style={[s.sectionTitle, { color: colors.muted }]}>About</Text>
          <View style={s.row}>
            <Text style={[s.rowLabel, { color: colors.foreground }]}>App</Text>
            <Text style={[s.rowValue, { color: colors.muted }]}>Original Word Bible</Text>
          </View>
          <View style={[s.row, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
            <Text style={[s.rowLabel, { color: colors.foreground }]}>Hebrew Lexicon</Text>
            <Text style={[s.rowValue, { color: colors.muted }]}>Strong's (8,674 entries)</Text>
          </View>
          <View style={[s.row, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
            <Text style={[s.rowLabel, { color: colors.foreground }]}>Greek Lexicon</Text>
            <Text style={[s.rowValue, { color: colors.muted }]}>Strong's (5,523 entries)</Text>
          </View>
          <View style={[s.row, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
            <Text style={[s.rowLabel, { color: colors.foreground }]}>Bible Text</Text>
            <Text style={[s.rowValue, { color: colors.muted }]}>King James Version (KJV)</Text>
          </View>
        </View>

        {/* Report Issue */}
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}
          onPress={() => setShowIssueModal(true)}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>🛠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionTitle, { color: colors.foreground }]}>Report an Issue</Text>
            <Text style={[s.actionSub, { color: colors.muted }]}>Generate a diagnostic code to share with support</Text>
          </View>
          <Text style={{ color: colors.muted }}>›</Text>
        </TouchableOpacity>

        {/* Admin Dashboard — only visible to admin */}
        {user?.isAdmin && (
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: "rgba(245,158,11,0.1)", borderColor: colors.hebrew, marginTop: 12 }]}
            onPress={() => { loadAdminData(); setShowAdmin(true); }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>👑</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.actionTitle, { color: colors.hebrew }]}>Admin Dashboard</Text>
              <Text style={[s.actionSub, { color: colors.muted }]}>Manage users, view diagnostics, system info</Text>
            </View>
            <Text style={{ color: colors.muted }}>›</Text>
          </TouchableOpacity>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: "rgba(248,113,113,0.08)", borderColor: colors.error, marginTop: 12 }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>🚪</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionTitle, { color: colors.error }]}>Sign Out</Text>
            <Text style={[s.actionSub, { color: colors.muted }]}>Signed in as {user?.username}</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* Report Issue Modal */}
      <Modal visible={showIssueModal} transparent animationType="slide" onRequestClose={() => setShowIssueModal(false)}>
        <Pressable style={s.overlay} onPress={() => setShowIssueModal(false)}>
          <Pressable style={[s.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={s.handle} />
            <Text style={[s.sheetTitle, { color: colors.foreground }]}>🛠️ Report an Issue</Text>
            <Text style={[s.sheetSub, { color: colors.muted }]}>
              Generate a diagnostic code and share it with support. The code helps identify your account and issue.
            </Text>

            <Text style={[s.label, { color: colors.muted }]}>Describe the issue (optional)</Text>
            <TextInput
              style={[s.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={issueNote}
              onChangeText={setIssueNote}
              placeholder="Describe what went wrong…"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleGenerateCode}
              activeOpacity={0.8}
            >
              <Text style={s.primaryBtnText}>Generate Diagnostic Code</Text>
            </TouchableOpacity>

            {generatedCode ? (
              <View style={[s.codeBox, { backgroundColor: "rgba(124,58,237,0.1)", borderColor: colors.primary }]}>
                <Text style={[s.codeLabel, { color: colors.muted }]}>Your Diagnostic Code</Text>
                <Text style={[s.codeText, { color: colors.primary }]}>{generatedCode}</Text>
                <Text style={[s.codeHint, { color: colors.muted }]}>
                  Share this code with support. They can look it up in the Admin Dashboard.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity style={[s.closeBtn, { borderColor: colors.border }]} onPress={() => { setShowIssueModal(false); setGeneratedCode(""); }}>
              <Text style={{ color: colors.muted, fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Admin Dashboard Modal */}
      <Modal visible={showAdmin} transparent animationType="slide" onRequestClose={() => setShowAdmin(false)}>
        <Pressable style={s.overlay} onPress={() => setShowAdmin(false)}>
          <Pressable style={[s.adminSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={s.handle} />
            <Text style={[s.sheetTitle, { color: colors.hebrew }]}>👑 Admin Dashboard</Text>

            {/* Admin Tabs */}
            <View style={s.adminTabBar}>
              {(["users", "diag", "system"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.adminTabBtn, { backgroundColor: adminTab === t ? colors.primary : colors.background, borderColor: adminTab === t ? colors.primary : colors.border }]}
                  onPress={() => setAdminTab(t)}
                >
                  <Text style={{ color: adminTab === t ? "#fff" : colors.muted, fontSize: 12, fontWeight: "700" }}>
                    {t === "users" ? "👥 Users" : t === "diag" ? "🔍 Diagnostics" : "⚙️ System"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Users Tab */}
            {adminTab === "users" && (
              <FlatList
                data={users}
                keyExtractor={(item) => item.username}
                style={{ marginTop: 8 }}
                ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: "center", marginTop: 20 }}>No users yet</Text>}
                renderItem={({ item }) => (
                  <View style={[s.userRow, { borderBottomColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.userName, { color: colors.foreground }]}>{item.username}</Text>
                      <Text style={[s.userEmail, { color: colors.muted }]}>{item.email}</Text>
                      <Text style={[s.userDate, { color: colors.muted }]}>
                        Joined {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[s.toggleBtn, { backgroundColor: item.disabled ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)", borderColor: item.disabled ? colors.error : colors.success }]}
                      onPress={() => toggleUser(item.username)}
                    >
                      <Text style={{ color: item.disabled ? colors.error : colors.success, fontSize: 11, fontWeight: "700" }}>
                        {item.disabled ? "Disabled" : "Active"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}

            {/* Diagnostics Tab */}
            {adminTab === "diag" && (
              <FlatList
                data={diags}
                keyExtractor={(item) => item.code}
                style={{ marginTop: 8 }}
                ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: "center", marginTop: 20 }}>No diagnostic codes yet</Text>}
                renderItem={({ item }) => (
                  <View style={[s.diagRow, { borderBottomColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.diagCode, { color: colors.primary }]}>{item.code}</Text>
                      <Text style={[s.diagUser, { color: colors.foreground }]}>User: {item.username}</Text>
                      <Text style={[s.diagDate, { color: colors.muted }]}>{new Date(item.createdAt).toLocaleString()}</Text>
                      {item.note ? <Text style={[s.diagNote, { color: colors.muted }]}>Note: {item.note}</Text> : null}
                    </View>
                    {!item.resolved ? (
                      <TouchableOpacity
                        style={[s.resolveBtn, { backgroundColor: colors.success }]}
                        onPress={() => resolveCode(item.code)}
                      >
                        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>Resolve</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[s.resolveBtn, { backgroundColor: "rgba(52,211,153,0.15)" }]}>
                        <Text style={{ color: colors.success, fontSize: 11, fontWeight: "700" }}>✓ Done</Text>
                      </View>
                    )}
                  </View>
                )}
              />
            )}

            {/* System Tab */}
            {adminTab === "system" && (
              <ScrollView style={{ marginTop: 8 }}>
                {[
                  ["App Name", "Original Word Bible"],
                  ["Version", "1.0.0"],
                  ["Hebrew Lexicon", "Strong's — 8,674 entries"],
                  ["Greek Lexicon", "Strong's — 5,523 entries"],
                  ["Bible Text", "KJV — 66 books"],
                  ["Total Users", String(users.length)],
                  ["Open Diagnostics", String(diags.filter(d => !d.resolved).length)],
                ].map(([label, value]) => (
                  <View key={label} style={[s.sysRow, { borderBottomColor: colors.border }]}>
                    <Text style={[s.sysLabel, { color: colors.muted }]}>{label}</Text>
                    <Text style={[s.sysValue, { color: colors.foreground }]}>{value}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity style={[s.closeBtn, { borderColor: colors.border, marginTop: 12 }]} onPress={() => setShowAdmin(false)}>
              <Text style={{ color: colors.muted, fontWeight: "600" }}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1,
      overflow: "hidden",
    },
    sectionTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, padding: 12, paddingBottom: 4 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12 },
    rowLabel: { fontSize: 14, fontWeight: "500" },
    rowValue: { fontSize: 14 },
    actionBtn: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
    actionTitle: { fontSize: 15, fontWeight: "700" },
    actionSub: { fontSize: 12, marginTop: 2 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: "80%" },
    adminSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: "90%", flex: 1 },
    handle: { width: 40, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
    sheetTitle: { fontSize: 18, fontWeight: "800", marginBottom: 6 },
    sheetSub: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
    label: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
    textArea: { borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, minHeight: 80, textAlignVertical: "top", marginBottom: 16 },
    primaryBtn: { borderRadius: 14, padding: 14, alignItems: "center", marginBottom: 16 },
    primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    codeBox: { borderRadius: 14, padding: 16, borderWidth: 1.5, alignItems: "center", marginBottom: 16 },
    codeLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
    codeText: { fontSize: 24, fontWeight: "900", letterSpacing: 2, marginBottom: 8 },
    codeHint: { fontSize: 12, textAlign: "center", lineHeight: 16 },
    closeBtn: { borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1 },
    adminTabBar: { flexDirection: "row", gap: 6, marginBottom: 8 },
    adminTabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1 },
    userRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, gap: 10 },
    userName: { fontSize: 14, fontWeight: "700" },
    userEmail: { fontSize: 12, marginTop: 2 },
    userDate: { fontSize: 11, marginTop: 2 },
    toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
    diagRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 0.5, gap: 10 },
    diagCode: { fontSize: 15, fontWeight: "800", letterSpacing: 1 },
    diagUser: { fontSize: 13, marginTop: 2 },
    diagDate: { fontSize: 11, marginTop: 2 },
    diagNote: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
    resolveBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginTop: 4 },
    sysRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 0.5 },
    sysLabel: { fontSize: 13 },
    sysValue: { fontSize: 13, fontWeight: "600" },
  });
