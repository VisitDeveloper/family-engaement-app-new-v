import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ApiError } from "@/services/api";
import { authService } from "@/services/auth.service";
import { useStore } from "@/store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; fallback?: string }>();
  const theme = useStore((state) => state.theme);
  const setLoggedIn = useStore((s) => s.setLoggedIn);
  const [code, setCode] = useState(typeof params.code === "string" ? params.code : "");
  const [loading, setLoading] = useState(false);
  const [triedAuto, setTriedAuto] = useState(false);

  const normalizedCode = useMemo(() => code.replace(/\D/g, "").slice(0, 6), [code]);

  const verify = async (candidateCode: string) => {
    const finalCode = candidateCode.replace(/\D/g, "").slice(0, 6);
    if (finalCode.length !== 6) {
      Alert.alert("Invalid code", "Verification code must be 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const response = await authService.verifyEmail(finalCode);
      if (response.user) {
        useStore.getState().setUser({
          ...response.user,
          name:
            response.user.firstName || response.user.lastName
              ? `${response.user.firstName || ""} ${response.user.lastName || ""}`.trim()
              : response.user.email.split("@")[0],
        });
        useStore.getState().setRole(response.user.role);
      }
      setLoggedIn(true);
      router.replace("/(protected)/(tabs)");
    } catch (err) {
      const apiError = err as ApiError;
      Alert.alert("Verification failed", apiError.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (triedAuto) return;
    if (normalizedCode.length !== 6) return;
    setTriedAuto(true);
    void verify(normalizedCode);
  }, [normalizedCode, triedAuto]);

  const openFallback = async () => {
    if (typeof params.fallback !== "string" || !params.fallback) return;
    const canOpen = await Linking.canOpenURL(params.fallback);
    if (canOpen) await Linking.openURL(params.fallback);
  };

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: t.bg,
    },
    card: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      padding: 20,
      backgroundColor: t.panel,
    },
    input: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: t.text,
      backgroundColor: t.bg,
    },
    button: {
      marginTop: 16,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: t.tint,
      opacity: loading ? 0.7 : 1,
    },
    secondary: {
      marginTop: 10,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: t.border,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="middleTitle" style={{ color: theme.text }}>
          Verify your email
        </ThemedText>
        <ThemedText style={{ marginTop: 8, color: theme.subText }}>
          Enter the 6-digit code from your email.
        </ThemedText>
        <TextInput
          style={styles.input}
          value={normalizedCode}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
          placeholderTextColor={theme.subText}
        />
        <TouchableOpacity
          style={styles.button}
          disabled={loading || normalizedCode.length !== 6}
          onPress={() => void verify(normalizedCode)}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "600" }}>Verify</Text>
          )}
        </TouchableOpacity>
        {typeof params.fallback === "string" && params.fallback ? (
          <TouchableOpacity style={styles.secondary} onPress={() => void openFallback()}>
            <Text style={{ color: theme.text, fontWeight: "600" }}>Open web verification</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
