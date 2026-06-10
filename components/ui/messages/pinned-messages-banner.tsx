import { useThemedStyles } from "@/hooks/use-theme-style";
import type { PinnedMessageItemDto } from "@/types";
import {
  getPinnedMessagePreview,
  getPinnedMessageSenderLabel,
} from "@/utils/pinned-message";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { SpeakableText } from "@/components/speakable-text";

interface PinnedMessagesBannerProps {
  pins: PinnedMessageItemDto[];
  onPressPin: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  canManagePins?: boolean;
}

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
  const [expanded, setExpanded] = useState(false);

  const styles = useThemedStyles((theme) => ({
    wrapper: {
      marginHorizontal: 12,
      marginTop: 8,
      marginBottom: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border ?? "rgba(0,0,0,0.08)",
      backgroundColor: theme.panel ?? "rgba(0,0,0,0.03)",
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: (theme.tint ?? "#1976D2") + "22",
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.tint ?? "#1976D2",
      letterSpacing: 0.4,
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      flexShrink: 1,
    },
    item: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border ?? "rgba(0,0,0,0.06)",
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    itemBody: {
      flex: 1,
      gap: 3,
    },
    typeLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.tint ?? "#1976D2",
      textTransform: "uppercase",
      letterSpacing: 0.3,
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
    unpinButton: {
      padding: 4,
    },
  }));

  if (pins.length === 0) return null;

  const collapsedLabel =
    pins.length === 1
      ? t("chat.pinnedCountOne")
      : t("chat.pinnedCount", { count: pins.length });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((value) => !value)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={expanded ? t("chat.pinnedCollapse") : collapsedLabel}
      >
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <SpeakableText style={styles.badgeText}>PIN</SpeakableText>
          </View>
          <SpeakableText style={styles.headerTitle} numberOfLines={1}>
            {expanded ? t("chat.pinnedTitle") : collapsedLabel}
          </SpeakableText>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={styles.sender.color as string}
        />
      </TouchableOpacity>

      {expanded
        ? pins.map((pin) => {
            const preview = getPinnedMessagePreview(pin.message);
            const sender = getPinnedMessageSenderLabel(pin.message);
            return (
              <View key={pin.id} style={styles.item}>
                <View style={styles.itemRow}>
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
                  {canManagePins && onUnpin ? (
                    <TouchableOpacity
                      style={styles.unpinButton}
                      onPress={() => onUnpin(pin.messageId)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={t("chat.unpinMessage")}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={20}
                        color={styles.sender.color as string}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        : null}
    </View>
  );
}
