import { useThemedStyles } from "@/hooks/use-theme-style";
import { MessageResponseDto } from "@/services/messaging.service";
import type { MessageReactionItemDto } from "@/types";
import { useStore } from "@/store";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { EmojiIcon, TrashIcon } from "../icons/messages-icons";
import ReactionRow from "./reaction-row";

interface ImageMessageCardProps {
  message: MessageResponseDto;
  isMe?: boolean;
  isPoll?: boolean;
  messageTime: string;
  reactions?: MessageReactionItemDto[] | null;
  myReaction?: string | null;
  onImagePress?: (uri: string) => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onReaction?: () => void;
}

export default function ImageMessageCard({
  message,
  isMe = false,
  isPoll = false,
  messageTime,
  onImagePress,
  onDelete,
  onCopy,
  onReaction,
  reactions,
  myReaction,
}: ImageMessageCardProps) {
  const { theme } = useStore((state) => state);

  const styles = useThemedStyles((t) => ({
    imageThumbnail: {
      width: 200,
      height: 150,
      borderRadius: 8,
      marginTop: 5,
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

  return (
    <>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onImagePress?.(message.mediaUrl!)}
      >
        <Image
          source={{ uri: message.mediaUrl }}
          style={styles.imageThumbnail}
          accessibilityRole="image"
          accessibilityLabel="Image attachment"
        />
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
