import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import type { PinnedMessageItemDto } from "@/types";
import {
  getPinnedMessagePreview,
  getPinnedMessageSenderLabel,
} from "@/utils/pinned-message";
import { Ionicons } from "@expo/vector-icons";
import { PushPin, PushPinSlash } from "phosphor-react-native";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SpeakableText } from "@/components/speakable-text";

interface PinnedMessagesBannerProps {
  pins: PinnedMessageItemDto[];
  onPressPin: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  canManagePins?: boolean;
}

const LEADING_BADGE_PADDING = 4;
const LEADING_ICON_SIZE = 14;
const LEADING_SLOT_WIDTH = LEADING_BADGE_PADDING * 2 + LEADING_ICON_SIZE;
const TRAILING_SLOT_WIDTH = 26;
const ROW_GAP = 8;
const ROW_HORIZONTAL_PADDING = 12;
const EXPAND_DURATION_MS = 250;

function pinTypeLabel(type: PinnedMessageItemDto["message"]["type"]): string {
  if (type === "announcement") return "Announcement";
  if (type === "image") return "Photo";
  if (type === "video") return "Video";
  if (type === "audio") return "Voice";
  if (type === "file") return "File";
  if (type === "poll") return "Poll";
  return "Message";
}

export default function PinnedMessagesBanner({
  pins,
  onPressPin,
  onUnpin,
  canManagePins = false,
}: PinnedMessagesBannerProps) {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme);
  const [expanded, setExpanded] = useState(false);
  const progress = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  const toggleExpanded = useCallback(() => {
    setExpanded((current) => {
      const next = !current;
      progress.value = withTiming(next ? 1 : 0, {
        duration: EXPAND_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
      return next;
    });
  }, [progress]);

  const animatedListStyle = useAnimatedStyle(() => ({
    height: contentHeight.value * progress.value,
    opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.85, 1]),
  }));

  const animatedLeadingStyle = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [LEADING_SLOT_WIDTH, 0]),
    marginRight: interpolate(progress.value, [0, 1], [ROW_GAP, 0]),
    opacity: interpolate(progress.value, [0, 0.5], [1, 0]),
    overflow: "hidden",
  }));

  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  const styles = useThemedStyles((theme) => {
    const borderColor = theme.border ?? "rgba(0,0,0,0.08)";
    return {
    wrapper: {
      marginTop: 4,
      marginBottom: 6,
      flexShrink: 0,
      zIndex: 2,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: ROW_HORIZONTAL_PADDING,
    },
    header: {
      paddingVertical: 10,
      alignItems: "center",
    },
    leadingSlot: {
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      width: LEADING_SLOT_WIDTH,
      height: LEADING_SLOT_WIDTH,
      padding: LEADING_BADGE_PADDING,
      borderRadius: 8,
      backgroundColor: (theme.tint ?? "#1976D2") + "22",
      alignItems: "center",
      justifyContent: "center",
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
      marginRight: ROW_GAP,
    },
    trailingSlot: {
      width: TRAILING_SLOT_WIDTH,
      alignItems: "center",
      justifyContent: "center",
      minHeight: LEADING_SLOT_WIDTH,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      flexShrink: 1,
    },
    item: {
      paddingVertical: 10,
    },
    itemBody: {
      flex: 1,
      minWidth: 0,
      marginRight: ROW_GAP,
      gap: 3,
    },
    typeLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.tint ?? "#1976D2",
      textTransform: "uppercase",
    },
    preview: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      lineHeight: 19,
    },
    sender: {
      fontSize: 12,
      color: theme.subText ?? theme.text,
      opacity: 0.75,
    },
    listMeasure: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    },
  };
  });

  if (pins.length === 0) return null;

  const collapsedLabel =
    pins.length === 1
      ? t("chat.pinnedCountOne")
      : t("chat.pinnedCount", { count: pins.length });

  return (
    <View style={[styles.wrapper, !expanded && styles.divider]}>
      <TouchableOpacity
        style={[styles.row, styles.header, expanded && styles.divider]}
        onPress={toggleExpanded}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={expanded ? t("chat.pinnedCollapse") : collapsedLabel}
      >
        <Animated.View style={[styles.leadingSlot, animatedLeadingStyle]}>
          <View style={styles.badge}>
            <PushPin
              size={LEADING_ICON_SIZE}
              color={theme.tint ?? "#1976D2"}
              weight="fill"
            />
          </View>
        </Animated.View>
        <View style={styles.rowBody}>
          <SpeakableText style={styles.headerTitle} numberOfLines={1}>
            {expanded ? t("chat.pinnedTitle") : collapsedLabel}
          </SpeakableText>
        </View>
        <View style={styles.trailingSlot}>
          <Animated.View style={animatedChevronStyle}>
            <Ionicons
              name="chevron-down"
              size={18}
              color={styles.sender.color as string}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      <Animated.View
        style={[animatedListStyle, { overflow: "hidden" }]}
        pointerEvents={expanded ? "auto" : "none"}
      >
        <View
          style={styles.listMeasure}
          collapsable={false}
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            if (height > 0) {
              contentHeight.value = height;
            }
          }}
        >
          {pins.map((pin) => {
            const preview = getPinnedMessagePreview(pin.message);
            const sender = getPinnedMessageSenderLabel(pin.message);
            return (
              <View key={pin.id} style={[styles.item, styles.divider]}>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.itemBody}
                    onPress={() => onPressPin(pin.messageId)}
                    activeOpacity={0.75}
                  >
                    <SpeakableText style={styles.typeLabel}>
                      {pinTypeLabel(pin.message.type)}
                    </SpeakableText>
                    <SpeakableText style={styles.preview} numberOfLines={2}>
                      {preview}
                    </SpeakableText>
                    {sender ? (
                      <SpeakableText style={styles.sender} numberOfLines={1}>
                        {sender}
                      </SpeakableText>
                    ) : null}
                  </TouchableOpacity>
                  <View style={styles.trailingSlot}>
                    {canManagePins && onUnpin ? (
                      <TouchableOpacity
                        onPress={() => onUnpin(pin.messageId)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel={t("chat.unpinMessage")}
                      >
                        <PushPinSlash
                          size={18}
                          color={styles.sender.color as string}
                          weight="regular"
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}
