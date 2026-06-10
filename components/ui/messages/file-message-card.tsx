import { useThemedStyles } from "@/hooks/use-theme-style";
import { MessageResponseDto } from "@/services/messaging.service";
import type { MessageReactionItemDto } from "@/types";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { SpeakableText } from "@/components/speakable-text";
import { TouchableOpacity, View } from "react-native";
import { CopyIcon, TrashIcon } from "../icons/messages-icons";
import MessagePinAction from "./message-pin-action";
import ReactionRow from "./reaction-row";

interface FileMessageCardProps {
  message: MessageResponseDto;
  isMe?: boolean;
  isPoll?: boolean;
  messageTime: string;
  reactions?: MessageReactionItemDto[] | null;
  myReaction?: string | null;
  onFilePress?: (url: string) => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onReaction?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
}

export default function FileMessageCard({
  message,
  isMe = false,
  isPoll = false,
  messageTime,
  onFilePress,
  onDelete,
  onCopy,
  onReaction,
  onPin,
  onUnpin,
  reactions,
  myReaction,
}: FileMessageCardProps) {
  const { theme } = useStore((state) => state);

  const styles = useThemedStyles((t) => ({
    fileContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 5,
      minWidth: 200,
      backgroundColor: isMe ? "rgba(255, 255, 255, 0.1)" : t.panel,
      padding: 10,
      borderRadius: 8,
    },
    fileName: {
      flex: 1,
    },
    fileNameText: {
      color: isMe ? "#fff" : t.text,
      fontSize: 14,
    },
    fileSizeText: {
      fontSize: 10,
      color: isMe ? "#fff" : "#666",
      marginTop: 2,
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

  const fileSizeKB = message.fileSize
    ? (Number(message.fileSize) / 1024).toFixed(1)
    : null;

  return (
    <>
      <TouchableOpacity
        style={styles.fileContainer}
        onPress={() => message.mediaUrl && onFilePress?.(message.mediaUrl)}
      >
        <Ionicons
          name="document-text"
          size={24}
          color={isMe ? "#fff" : theme.text}
        />
        <View style={styles.fileName}>
          <SpeakableText narrationDisabled style={styles.fileNameText}>
            {message.fileName || "File"}
          </SpeakableText>
          {fileSizeKB && (
            <SpeakableText narrationDisabled style={styles.fileSizeText}>{fileSizeKB} KB</SpeakableText>
          )}
        </View>
        <Ionicons
          name="download-outline"
          size={20}
          color={isMe ? "#fff" : theme.text}
        />
      </TouchableOpacity>
      {reactions && reactions.length > 0 && (
        <ReactionRow reactions={reactions} myReaction={myReaction} />
      )}
      <View style={styles.footer}>
        <SpeakableText style={styles.timestamp}>{messageTime}</SpeakableText>
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
              <MessagePinAction
                onPin={onPin}
                onUnpin={onUnpin}
                color={isPoll ? (theme.subText ?? "#666") : "#fff"}
              />
            </View>
          </View>
        ) : (
          (onCopy || onReaction || onPin || onUnpin) && (
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
                <MessagePinAction
                  onPin={onPin}
                  onUnpin={onUnpin}
                  color={theme.subText ?? "#666"}
                />
              </View>
            </View>
          )
        )}
      </View>
    </>
  );
}
