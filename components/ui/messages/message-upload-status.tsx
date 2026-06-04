import { useThemedStyles } from "@/hooks/use-theme-style";
import type { MessageResponseDto } from "@/services/messaging.service";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { SpeakableText } from "@/components/speakable-text";

interface MessageUploadStatusProps {
  message: MessageResponseDto;
  isMe?: boolean;
  onResend?: () => void;
  onDelete?: () => void;
}

export default function MessageUploadStatus({
  message,
  isMe = true,
  onResend,
  onDelete,
}: MessageUploadStatusProps) {
  const { t } = useTranslation();
  const upload = message.clientUpload;
  const styles = useThemedStyles((t) => ({
    overlay: {
      ...({
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 10,
        backgroundColor: isMe ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
        padding: 12,
        gap: 8,
        zIndex: 2,
      } as const),
    },
    progressTrack: {
      width: "80%",
      maxWidth: 160,
      height: 4,
      borderRadius: 4,
      backgroundColor: "rgba(255,255,255,0.35)",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#fff",
      borderRadius: 4,
    },
    statusText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },
    failedActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.45)",
    },
    actionLabel: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
  }));

  if (!upload) return null;

  if (upload.status === "uploading") {
    return (
      <View style={styles.overlay} pointerEvents="none">
        <ActivityIndicator size="small" color="#fff" />
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, upload.progress)}%` }]} />
        </View>
        <SpeakableText style={styles.statusText}>{t("chat.uploading")}</SpeakableText>
      </View>
    );
  }

  if (upload.status === "failed") {
    return (
      <View style={styles.overlay}>
        <Ionicons name="alert-circle-outline" size={28} color="#fff" />
        <SpeakableText style={styles.statusText}>{t("chat.uploadFailed")}</SpeakableText>
        <View style={styles.failedActions}>
          {onResend && (
            <TouchableOpacity style={styles.actionButton} onPress={onResend} accessibilityRole="button">
              <Ionicons name="refresh" size={16} color="#fff" />
              <SpeakableText style={styles.actionLabel}>{t("chat.resend")}</SpeakableText>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={onDelete} accessibilityRole="button">
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <SpeakableText style={styles.actionLabel}>{t("chat.delete")}</SpeakableText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return null;
}
