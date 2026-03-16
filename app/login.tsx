import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const colors = useColors();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setError(result.error ?? "Login failed.");
    }
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo / Title */}
          <View style={s.hero}>
            <Text style={s.logoText}>📖</Text>
            <Text style={s.title}>Original Word Bible</Text>
            <Text style={s.subtitle}>Study Scripture in its original languages</Text>
          </View>

          {/* Login Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Sign In</Text>

            {error ? <Text style={s.errorText}>{error}</Text> : null}

            <Text style={s.label}>Username</Text>
            <TextInput
              style={s.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              style={[s.primaryBtn, loading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={s.primaryBtnText}>{loading ? "Signing in…" : "Sign In"}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or continue with</Text>
              <View style={s.dividerLine} />
            </View>

            {/* OAuth buttons */}
            <TouchableOpacity
              style={s.oauthBtn}
              onPress={() => Linking.openURL("https://accounts.google.com/o/oauth2/v2/auth")}
              activeOpacity={0.8}
            >
              <Text style={s.oauthIcon}>G</Text>
              <Text style={s.oauthText}>Sign in with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.oauthBtn, s.appleBtn]}
              onPress={() => Linking.openURL("https://appleid.apple.com/auth/authorize")}
              activeOpacity={0.8}
            >
              <Text style={[s.oauthIcon, { color: "#fff" }]}>🍎</Text>
              <Text style={[s.oauthText, { color: "#fff" }]}>Sign in with Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/signup" as any)}>
              <Text style={s.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { flexGrow: 1, padding: 24, justifyContent: "center" },
    hero: { alignItems: "center", marginBottom: 32 },
    logoText: { fontSize: 64, marginBottom: 12 },
    title: { fontSize: 26, fontWeight: "800", color: c.foreground, textAlign: "center" },
    subtitle: { fontSize: 14, color: c.muted, textAlign: "center", marginTop: 6 },
    card: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    cardTitle: { fontSize: 20, fontWeight: "700", color: c.foreground, marginBottom: 20 },
    label: { fontSize: 13, fontWeight: "600", color: c.muted, marginBottom: 6, marginTop: 12 },
    input: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: c.foreground,
      borderWidth: 1,
      borderColor: c.border,
    },
    errorText: {
      color: c.error,
      fontSize: 13,
      marginBottom: 8,
      backgroundColor: "rgba(248,113,113,0.1)",
      padding: 10,
      borderRadius: 8,
    },
    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      marginTop: 20,
    },
    btnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
    dividerText: { color: c.muted, fontSize: 12, marginHorizontal: 12 },
    oauthBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 12,
    },
    appleBtn: { backgroundColor: "#1a1a1a", borderColor: "#333" },
    oauthIcon: { fontSize: 18, fontWeight: "800", color: c.foreground },
    oauthText: { fontSize: 15, fontWeight: "600", color: c.foreground },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 24, flexWrap: "wrap" },
    footerText: { color: c.muted, fontSize: 14 },
    footerLink: { color: c.primary, fontSize: 14, fontWeight: "700" },
  });
