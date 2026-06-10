import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { SpeakableText } from "@/components/speakable-text";
import { TouchableOpacity, View } from "react-native";

interface ChatStickyAudioPlayerProps {
  senderLabel: string;
  position: number;
  duration: number;
  isPlaying: boolean;
  onScrollToMessage: () => void;
  onTogglePlay: () => void;
  formatDuration: (seconds: number) => string;
}

export default function ChatStickyAudioPlayer({
  senderLabel,
  position,
  duration,
  isPlaying,
  onScrollToMessage,
  onTogglePlay,
  formatDuration,
}: ChatStickyAudioPlayerProps) {
  const theme = useStore((state) => state.theme);

  const styles = useThemedStyles((t) => ({
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: t.panel || t.bg,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.tint,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      gap: 6,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    senderLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: t.text,
    },
    duration: {
      fontSize: 12,
      color: t.subText || t.text,
      minWidth: 36,
      textAlign: "right",
    },
    progressTrack: {
      height: 3,
      borderRadius: 2,
      backgroundColor: t.border,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: t.tint,
      borderRadius: 2,
    },
    scrollHint: {
      padding: 4,
    },
  }));

  const progressPct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  const timeLabel =
    duration > 0
      ? formatDuration(Math.max(0, duration - position))
      : formatDuration(position);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.playButton}
        onPress={onTogglePlay}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? "Pause voice message" : "Play voice message"}
      >
        <Ionicons name={isPlaying ? "pause" : "play"} size={18} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.content}
        onPress={onScrollToMessage}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Go to voice message"
      >
        <View style={styles.labelRow}>
          <SpeakableText style={styles.senderLabel} numberOfLines={1}>
            {senderLabel}
          </SpeakableText>
          <SpeakableText style={styles.duration}>{timeLabel}</SpeakableText>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.scrollHint}
        onPress={onScrollToMessage}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Scroll to voice message"
      >
        <Ionicons name="chevron-down" size={20} color={theme.subText || theme.text} />
      </TouchableOpacity>
    </View>
  );
}
