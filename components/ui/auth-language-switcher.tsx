import i18n from "@/i18n";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { GlobeIcon } from "./icons/settings-icons";

const LANGUAGES = ["en", "fr", "es"] as const;
const LANGUAGE_LABELS: Record<(typeof LANGUAGES)[number], string> = {
  en: "English",
  fr: "Français",
  es: "Español",
};

export default function AuthLanguageSwitcher() {
  const theme = useStore((state) => state.theme);
  const appLanguage = useStore((state) => state.appLanguage);
  const setAppLanguage = useStore((state) => state.setAppLanguage);
  const [open, setOpen] = useState(false);

  const currentLanguage = LANGUAGES.includes(appLanguage as (typeof LANGUAGES)[number])
    ? (appLanguage as (typeof LANGUAGES)[number])
    : "en";

  const switchLanguage = (lang: (typeof LANGUAGES)[number]) => {
    setAppLanguage(lang);
    i18n.changeLanguage(lang);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open language selector"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 999,
          backgroundColor: theme.panel,
          paddingHorizontal: 12,
          paddingVertical: 6,
          // elevation: 6,
          // shadowColor: "#000",
          // shadowOpacity: 0.18,
          // shadowRadius: 8,
          // shadowOffset: { width: 0, height: 3 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 6
        }}
      >
        <GlobeIcon size={12} />
        <Text style={{ color: theme.text, fontWeight: "700", fontSize: 12 }}>
          {currentLanguage.toUpperCase()}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity
            onPress={() => setOpen(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            accessibilityRole="button"
            accessibilityLabel="Close language selector"
          />

          <View
            style={{
              borderRadius: 16,
              backgroundColor: theme.panel,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 16,
              elevation: 8,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16, marginBottom: 10 }}>
              Select language
            </Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => switchLanguage(lang)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: 10,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  marginBottom: 6,
                  backgroundColor: currentLanguage === lang ? `${theme.tint}33` : "transparent",
                }}
                accessibilityRole="button"
                accessibilityLabel={`Set language ${LANGUAGE_LABELS[lang]}`}
              >
                <Text style={{ color: theme.text, fontSize: 15 }}>
                  {LANGUAGE_LABELS[lang]}
                </Text>
                {currentLanguage === lang ? (
                  <Ionicons name="checkmark-circle" size={20} color={theme.tint} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

