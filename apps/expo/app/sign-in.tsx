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
        <ActivityIndicator size="large" color="#ffffff" />
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
        placeholderTextColor="#94a3b8"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
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
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#ffffff",
    marginBottom: 16,
  },
  error: {
    color: "#f87171",
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  toggle: {
    marginTop: 24,
    alignItems: "center",
  },
  toggleText: {
    color: "#60a5fa",
    fontSize: 14,
  },
  back: {
    marginTop: 32,
    alignItems: "center",
  },
  backText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  hint: {
    marginTop: 12,
    color: "#94a3b8",
    fontSize: 14,
  },
});
