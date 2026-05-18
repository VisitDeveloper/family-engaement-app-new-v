import { useFeedbackUiStore } from "@/store/feedback-ui";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SpeakableText } from "@/components/speakable-text";
import type { FeedbackAlertButton, FeedbackAlertButtonStyle } from "@/store/feedback-ui";

const PRIMARY_TEXT = "#ffffff";

function buttonLabelColor(
  style: FeedbackAlertButtonStyle | undefined,
  theme: { text: string; tint: string; emergencyColor: string }
) {
  if (style === "destructive") return theme.emergencyColor;
  if (style === "cancel") return theme.text;
  return PRIMARY_TEXT;
}

function buttonSurface(
  btn: FeedbackAlertButton,
  theme: { tint: string; emergencyColor: string; bg: string; border: string }
) {
  if (btn.style === "destructive") {
    return {
      backgroundColor: `${theme.emergencyColor}18`,
      borderColor: `${theme.emergencyColor}50`,
    };
  }
  if (btn.style === "cancel") {
    return {
      backgroundColor: theme.bg,
      borderColor: theme.border,
    };
  }
  return {
    backgroundColor: theme.tint,
    borderColor: theme.tint,
  };
}

export function ThemedAlertModal() {
  const theme = useStore((s) => s.theme);
  const colorScheme = useStore((s) => s.colorScheme);
  const visible = useFeedbackUiStore((s) => s.alertVisible);
  const title = useFeedbackUiStore((s) => s.alertTitle);
  const message = useFeedbackUiStore((s) => s.alertMessage);
  const buttons = useFeedbackUiStore((s) => s.alertButtons);
  const dismissAlert = useFeedbackUiStore((s) => s.dismissAlert);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 36, 368);

  const hasDestructive = useMemo(() => buttons.some((b) => b.style === "destructive"), [buttons]);

  const headerIcon = useMemo(() => {
    if (hasDestructive) {
      return { name: "warning" as const, color: theme.emergencyColor };
    }
    return { name: "information-circle" as const, color: theme.tint };
  }, [hasDestructive, theme.emergencyColor, theme.tint]);

  const onButtonPress = useCallback(
    (btn: FeedbackAlertButton) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      dismissAlert();
      queueMicrotask(() => btn.onPress?.());
    },
    [dismissAlert]
  );

  const isRow = buttons.length === 2;
  const blurTint = colorScheme === "dark" ? "dark" : "light";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismissAlert}>
      <View style={viewStyles.root}>
        {Platform.OS !== "web" ? (
          <BlurView
            intensity={colorScheme === "dark" ? 48 : 32}
            tint={blurTint}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <View style={[viewStyles.dim, colorScheme === "dark" && viewStyles.dimDark]} />

        <View style={viewStyles.centerWrap} pointerEvents="box-none">
          <View
            style={[
              viewStyles.card,
              viewStyles.cardShadow,
              {
                width: cardWidth,
                backgroundColor: theme.panel,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={viewStyles.cardInner}>
              <View
                style={[
                  viewStyles.iconOrb,
                  {
                    backgroundColor: `${headerIcon.color}${colorScheme === "dark" ? "28" : "18"}`,
                  },
                ]}
              >
                <Ionicons name={headerIcon.name} size={32} color={headerIcon.color} />
              </View>

              <SpeakableText style={[textStyles.title, { color: theme.text }]}>{title}</SpeakableText>
              {message ? (
                <SpeakableText style={[textStyles.message, { color: theme.subText }]}>{message}</SpeakableText>
              ) : null}

              <View style={[viewStyles.actions, isRow && viewStyles.actionsRow]}>
                {buttons.map((btn, i) => {
                  const surface = buttonSurface(btn, theme);
                  const pill = !isRow && btn.style !== "cancel";
                  return (
                    <TouchableOpacity
                      key={`${btn.text}-${i}`}
                      onPress={() => onButtonPress(btn)}
                      style={[
                        viewStyles.button,
                        isRow && viewStyles.buttonRow,
                        !isRow && viewStyles.buttonStacked,
                        pill && viewStyles.buttonPill,
                        { backgroundColor: surface.backgroundColor, borderColor: surface.borderColor },
                      ]}
                      activeOpacity={0.85}
                    >
                      <SpeakableText
                        style={[
                          textStyles.buttonLabel,
                          { color: buttonLabelColor(btn.style, theme) },
                          btn.style === "destructive" && textStyles.buttonDestructiveWeight,
                        ]}
                      >
                        {btn.text}
                      </SpeakableText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const viewStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 16, 28, 0.42)",
  },
  dimDark: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  card: {
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardShadow:
    Platform.OS === "ios"
      ? {
          shadowColor: "#1a0a24",
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.28,
          shadowRadius: 36,
        }
      : { elevation: 16 },
  cardInner: {
    paddingTop: 22,
    paddingHorizontal: 24,
    paddingBottom: 22,
    alignItems: "center",
  },
  iconOrb: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  actions: {
    gap: 11,
    marginTop: 8,
    width: "100%",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 11,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },
  buttonPill: {
    borderRadius: 999,
  },
  buttonRow: {
    flex: 1,
  },
  buttonStacked: {
    width: "100%",
  },
});

const textStyles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.15,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.25,
  },
  buttonDestructiveWeight: {
    fontWeight: "800",
  },
});
