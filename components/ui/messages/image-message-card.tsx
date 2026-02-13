import { useThemedStyles } from "@/hooks/use-theme-style";
import { MessageResponseDto } from "@/services/messaging.service";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { CopyIcon, TrashIcon } from "../icons/messages-icons";

interface ImageMessageCardProps {
  message: MessageResponseDto;
  isMe?: boolean;
  isPoll?: boolean;
  messageTime: string;
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
          (onCopy || onReaction) && (
            <View style={styles.footerRight}>
              <View style={styles.actions}>
                {onCopy && (
                  <TouchableOpacity style={styles.actionIcon} onPress={onCopy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <CopyIcon size={12} color={theme.subText ?? "#666"} />
                  </TouchableOpacity>
                )}
                {onReaction && (
                  <TouchableOpacity style={styles.actionIcon} onPress={onReaction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="heart-outline" size={12} color={theme.subText ?? "#666"} />
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
