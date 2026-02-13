import { useThemedStyles } from "@/hooks/use-theme-style";
import { MessageResponseDto } from "@/services/messaging.service";
import { useStore } from "@/store";
import { Text, TouchableOpacity, View } from "react-native";
import { CopyIcon, EmojiIcon, PencilIcon, TrashIcon } from "../icons/messages-icons";

interface TextMessageCardProps {
  message: MessageResponseDto;
  isMe?: boolean;
  translatedContent?: string;
  isTranslating?: boolean;
  isPoll?: boolean;
  messageTime: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onReaction?: () => void;
}

export default function TextMessageCard({
  message,
  isMe = false,
  translatedContent,
  isTranslating,
  isPoll = false,
  messageTime,
  onEdit,
  onDelete,
  onCopy,
  onReaction,
}: TextMessageCardProps) {
  const { theme } = useStore((state) => state);

  const styles = useThemedStyles((t) => ({
    content: {
      fontSize: 15,
      color: isMe ? "#fff" : t.text,
      lineHeight: 22,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
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

  const contentDisplay =
    isTranslating && translatedContent === undefined
      ? "…"
      : translatedContent ?? message.content ?? "";

  return (
    <>
      <Text style={styles.content}>{contentDisplay}</Text>
      <View style={styles.footer}>
        <Text style={styles.timestamp}>{messageTime}</Text>
        {isMe ? (
          <View style={styles.footerRight}>
            <View style={styles.actions}>
              {onEdit && (
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={onEdit}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <PencilIcon
                    size={12}
                    color={isPoll ? (theme.subText ?? "#666") : "#fff"}
                  />
                </TouchableOpacity>
              )}
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
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={onCopy}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <CopyIcon size={12} color={theme.subText ?? "#666"} />
                  </TouchableOpacity>
                )}
                {onReaction && (
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={onReaction}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <EmojiIcon
                      size={12}
                      color={theme.subText ?? "#666"}
                    />
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
