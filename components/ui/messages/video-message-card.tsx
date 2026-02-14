import { useThemedStyles } from "@/hooks/use-theme-style";
import { MessageResponseDto } from "@/services/messaging.service";
import type { MessageReactionItemDto } from "@/types";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { EmojiIcon, TrashIcon } from "../icons/messages-icons";
import ReactionRow from "./reaction-row";

interface VideoMessageCardProps {
  message: MessageResponseDto;
  isMe?: boolean;
  isPoll?: boolean;
  messageTime: string;
  reactions?: MessageReactionItemDto[] | null;
  myReaction?: string | null;
  onVideoPress?: (uri: string) => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onReaction?: () => void;
}

export default function VideoMessageCard({
  message,
  isMe = false,
  isPoll = false,
  messageTime,
  onVideoPress,
  onDelete,
  onCopy,
  onReaction,
  reactions,
  myReaction,
}: VideoMessageCardProps) {
  const { theme } = useStore((state) => state);

  const styles = useThemedStyles((t) => ({
    videoThumbnail: {
      width: 150,
      height: 100,
      borderRadius: 8,
      marginTop: 5,
    },
    playIconContainer: {
      position: "absolute",
      alignSelf: "center",
      top: "35%",
      opacity: 0.9,
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
      color: isPoll ? (t.subText ?? "#666") : isMe ? "#fff" : "#666",
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

  const thumbnailUrl = message.thumbnailUrl ?? message.mediaUrl;

  return (
    <>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onVideoPress?.(message.mediaUrl!)}
      >
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.videoThumbnail}
          accessibilityRole="image"
          accessibilityLabel="Video thumbnail"
        />
        <View style={styles.playIconContainer}>
          <Ionicons name="play-circle" size={48} color="#fff" />
        </View>
      </TouchableOpacity>
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
                  <TrashIcon
                    size={12}
                    color={isPoll ? (theme.subText ?? "#666") : "#fff"}
                  />
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
