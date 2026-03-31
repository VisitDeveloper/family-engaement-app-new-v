import AuthLanguageSwitcher from "@/components/ui/auth-language-switcher";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { ApiError } from "@/services/api";
import { authService } from "@/services/auth.service";
import { useStore } from "@/store";
import { trackAuthEvent } from "@/utils/analytics";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const theme = useStore((state) => state.theme);

  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const colorScheme = useStore((state) => state.colorScheme);


  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const isEmailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail),
    [normalizedEmail]
  );

  useEffect(() => {
    trackAuthEvent("forgot_password_screen_view");
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSend = async () => {
    if (!isEmailValid) {
      Alert.alert(t("auth.common.invalidEmailTitle"), t("auth.common.invalidEmailMessage"));
      return;
    }

    setLoading(true);
    trackAuthEvent("forgot_password_request_attempt");
    try {
      const response = await authService.forgetPassword(normalizedEmail);
      setSent(true);
      setCooldown(30);
      trackAuthEvent("forgot_password_request_success");
      Alert.alert(
        t("auth.forgot.successTitle"),
        response.message || t("auth.forgot.successMessage")
      );
    } catch (err) {
      const apiError = err as ApiError;
      trackAuthEvent("forgot_password_request_failed", { status: apiError.status ?? null });
      Alert.alert(t("auth.common.requestFailedTitle"), apiError.message || t("auth.common.tryAgain"));
    } finally {
      setLoading(false);
    }
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
      borderRadius: 16,
      padding: 18,
      backgroundColor: t.panel,
    },
    logo: {
      width: "82%",
      maxWidth: 220,
      height: 56,
      alignSelf: "center",
      marginTop: 4,
    },
    title: {
      color: t.text,
      fontWeight: "700",
      textAlign: "center",
    },
    subtitle: {
      marginTop: 8,
      color: t.subText,
      textAlign: "center",
    },
    inputRow: {
      marginTop: 18,
      borderWidth: 1,
      borderRadius: 10,
      borderColor: t.border,
      backgroundColor: t.bg,
      minHeight: 46,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      gap: 8,
    },
    inputIcon: {
      color: t.subText,
    },
    input: {
      flex: 1,
      height: 46,
      color: t.text,
      paddingHorizontal: 8,
    },
    helper: {
      marginTop: 10,
      color: t.subText,
      textAlign: "center",
      fontSize: 12,
    },
    button: {
      marginTop: 16,
      borderRadius: 10,
      minHeight: 46,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.tint,
      flexDirection: "row",
      gap: 8,
    },
    secondary: {
      marginTop: 10,
      borderRadius: 10,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.bg,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.card}>

        <Image
          source={
            colorScheme === "dark"
              ? require("./../../assets/images/LOGO-light.png")
              : require("./../../assets/images/LOGO-primary.png")
          }
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Family App Logo"
        />


        <ThemedText type="middleTitle" style={styles.title}>
          {t("auth.forgot.title")}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {t("auth.forgot.subtitle")}
        </ThemedText>

        <View style={styles.inputRow}>
          <Feather name="mail" size={18} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t("placeholders.email")}
            placeholderTextColor={theme.subText}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            accessibilityLabel="Email"
            accessibilityHint={t("auth.forgot.emailHint")}
          />
        </View>

        <ThemedText type="subText" style={styles.helper}>
          {sent
            ? t("auth.forgot.successHelper")
            : t("auth.forgot.helper")}
        </ThemedText>

        <TouchableOpacity
          style={[styles.button, { opacity: loading || !isEmailValid || cooldown > 0 ? 0.7 : 1 }]}
          onPress={handleSend}
          disabled={loading || !isEmailValid || cooldown > 0}
          accessibilityRole="button"
          accessibilityLabel={loading ? t("auth.forgot.sending") : t("auth.forgot.sendButton")}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700" }}>{t("auth.forgot.sending")}</Text>
            </>
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {cooldown > 0
                ? t("auth.forgot.cooldown", { seconds: cooldown })
                : t("auth.forgot.sendButton")}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondary}
          onPress={() => router.push("/(auth)/reset-password")}
          accessibilityRole="button"
          accessibilityLabel={t("auth.forgot.haveToken")}
        >
          <Text style={{ color: theme.text, fontWeight: "700" }}>{t("auth.forgot.haveToken")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondary}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("auth.common.backToLogin")}
        >
          <Text style={{ color: theme.text, fontWeight: "700" }}>{t("auth.common.backToLogin")}</Text>
        </TouchableOpacity>
      </View>
      <View>
        <AuthLanguageSwitcher />
      </View>
    </View>
  );
}
