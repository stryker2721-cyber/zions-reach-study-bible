import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

export default function SignupScreen() {
  const { signup } = useAuth();
  const router = useRouter();
  const colors = useColors();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await signup(username.trim(), email.trim(), password);
    setLoading(false);
    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setError(result.error ?? "Sign up failed.");
    }
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Back */}
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <Text style={s.backText}>← Back to Sign In</Text>
          </TouchableOpacity>

          {/* Title */}
          <View style={s.hero}>
            <Text style={s.title}>Create Account</Text>
            <Text style={s.subtitle}>Join Original Word Bible</Text>
          </View>

          {/* Form Card */}
          <View style={s.card}>
            {error ? <Text style={s.errorText}>{error}</Text> : null}

            <Text style={s.label}>Username</Text>
            <TextInput
              style={s.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password (min 6 chars)"
              placeholderTextColor={colors.muted}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignup}
            />

            <TouchableOpacity
              style={[s.primaryBtn, loading && s.btnDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={s.primaryBtnText}>{loading ? "Creating account…" : "Create Account"}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={s.footerLink}>Sign In</Text>
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
    back: { marginBottom: 16 },
    backText: { color: c.primary, fontSize: 14, fontWeight: "600" },
    hero: { alignItems: "center", marginBottom: 28 },
    title: { fontSize: 26, fontWeight: "800", color: c.foreground },
    subtitle: { fontSize: 14, color: c.muted, marginTop: 4 },
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
    label: { fontSize: 13, fontWeight: "600", color: c.muted, marginBottom: 6, marginTop: 12 },
    input: {
      backgroundColor: c.background,
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
    footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
    footerText: { color: c.muted, fontSize: 14 },
    footerLink: { color: c.primary, fontSize: 14, fontWeight: "700" },
  });
