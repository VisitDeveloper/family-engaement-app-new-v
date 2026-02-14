import { useThemedStyles } from "@/hooks/use-theme-style";
import { MessageResponseDto } from "@/services/messaging.service";
import type { MessageReactionItemDto } from "@/types";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { EmojiIcon, TrashIcon } from "../icons/messages-icons";
import ReactionRow from "./reaction-row";

interface AudioMessageCardProps {
  message: MessageResponseDto;
  isMe?: boolean;
  messageTime: string;
  reactions?: MessageReactionItemDto[] | null;
  myReaction?: string | null;
  playingAudioId?: string | null;
  audioPositions?: Record<string, number>;
  audioDurations?: Record<string, number>;
  onPlay?: (audioUrl: string, messageId: string, durationSeconds?: number) => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onReaction?: () => void;
  formatAudioDuration?: (seconds: number) => string;
}

export default function AudioMessageCard({
  message,
  isMe = false,
  messageTime,
  reactions,
  myReaction,
  playingAudioId,
  audioPositions = {},
  audioDurations = {},
  onPlay,
  onDelete,
  onCopy,
  onReaction,
  formatAudioDuration,
}: AudioMessageCardProps) {
  const { theme } = useStore((state) => state);

  const styles = useThemedStyles((t) => ({
    audioPlayer: {
      borderRadius: 12,
      minWidth: 200,
    },
    audioPlayerContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    audioPlayButton: {
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    audioProgressContainer: {
      flex: 1,
      height: 4,
      backgroundColor: isMe ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.1)",
      borderRadius: 50,
      overflow: "hidden",
    },
    audioProgressFill: {
      height: "100%",
      backgroundColor: isMe ? "#fff" : t.tint,
      borderRadius: 2,
    },
    audioDuration: {
      fontSize: 12,
      color: isMe ? "#fff" : "#666",
      minWidth: 40,
      textAlign: "right",
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
      gap: 8,
    },
    footerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    timestamp: {
      fontSize: 10,
      color: isMe ? "#fff" : "#666",
      opacity: isMe ? 0.9 : 1,
    },
    readStatusContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    actionIcon: {
      padding: 2,
    },
  }));

  if (!message.mediaUrl) return null;

  const duration =
    audioDurations[message.id] ||
    (message.duration ? Number(message.duration) : 0);
  const position = audioPositions[message.id] || 0;
  const progressWidth = duration > 0 ? `${(position / duration) * 100}%` : "0%";

  const displayDuration = formatAudioDuration
    ? duration > 0
      ? formatAudioDuration(duration)
      : message.duration
        ? formatAudioDuration(Number(message.duration))
        : "0:00"
    : "0:00";

  return (
    <>
      <View style={styles.audioPlayer}>
        <View style={styles.audioPlayerContent}>
          <TouchableOpacity
            style={styles.audioPlayButton}
            onPress={() =>
              onPlay?.(
                message.mediaUrl!,
                message.id,
                message.duration ? Number(message.duration) : undefined
              )
            }
          >
            <Ionicons
              name={playingAudioId === message.id ? "pause" : "play-outline"}
              size={20}
              color={isMe ? "#fff" : theme.text}
            />
          </TouchableOpacity>
          <View style={styles.audioProgressContainer}>
            <View
              style={[
                styles.audioProgressFill,
                {
                  width: progressWidth as unknown as number,
                },
              ]}
            />
          </View>
          <Text style={styles.audioDuration}>{displayDuration}</Text>
        </View>
      </View>
      {reactions && reactions.length > 0 && (
        <ReactionRow reactions={reactions} myReaction={myReaction} />
      )}
      <View style={styles.footer}>
        <Text style={styles.timestamp}>{messageTime}</Text>
        {isMe ? (
          <View style={styles.footerRight}>
            <View style={styles.actions}>
              {onDelete && (
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={onDelete}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <TrashIcon size={12} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          (onReaction) && (
            <View style={styles.footerRight}>
              <View style={styles.actions}>
                {onReaction && (
                  <TouchableOpacity style={styles.actionIcon} onPress={onReaction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <EmojiIcon size={12} color={theme.subText ?? "#666"} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        )}
      </View>
    </>
  );
}
