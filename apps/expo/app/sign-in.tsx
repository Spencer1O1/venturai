import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { theme } from "../lib/theme";

export default function SignInScreen() {
  const { signIn } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.hint}>Loading…</Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn("password", {
        email: email.trim(),
        password,
        flow: step,
      });
      if (result.signingIn) {
        router.replace("/");
      } else if (result.redirect) {
        // OAuth/magic link – open in browser (not used for password flow)
        // Linking.openURL(result.redirect.toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Venturai</Text>
      <Text style={styles.subtitle}>
        Sign in to perform inspections and maintenance
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.textMuted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={step === "signUp" ? "new-password" : "password"}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting || !email.trim() || !password}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Please wait…" : step === "signIn" ? "Sign in" : "Sign up"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.toggle}
        onPress={() => {
          setStep((s) => (s === "signIn" ? "signUp" : "signIn"));
          setError(null);
        }}
      >
        <Text style={styles.toggleText}>
          {step === "signIn"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </Text>
      </Pressable>

      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textMuted,
    marginBottom: 32,
  },
  input: {
    backgroundColor: theme.backgroundElevated,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: theme.text,
    marginBottom: 16,
  },
  error: {
    color: theme.error,
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    alignSelf: "stretch",
    backgroundColor: theme.buttonPrimary,
    paddingVertical: theme.buttonPaddingVertical,
    paddingHorizontal: theme.buttonPaddingHorizontal,
    borderRadius: theme.buttonBorderRadius,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.background,
    fontSize: theme.buttonFontSize,
    fontWeight: theme.buttonFontWeight,
  },
  toggle: {
    marginTop: 24,
    alignItems: "center",
  },
  toggleText: {
    color: theme.accent,
    fontSize: 14,
  },
  back: {
    marginTop: 32,
    alignItems: "center",
  },
  backText: {
    color: theme.textMuted,
    fontSize: 14,
  },
  hint: {
    marginTop: 12,
    color: theme.textMuted,
    fontSize: 14,
  },
});
