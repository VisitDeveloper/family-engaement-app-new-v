import { useThemedStyles } from "@/hooks/use-theme-style";
import { MessageResponseDto } from "@/services/messaging.service";
import type { MessageReactionItemDto } from "@/types";
import { useStore } from "@/store";
import { SpeakableText } from "@/components/speakable-text";
import { TouchableOpacity, View } from "react-native";
import { CopyIcon, EmojiIcon, PencilIcon, TrashIcon } from "../icons/messages-icons";
import MessagePinAction from "./message-pin-action";
import ReactionRow from "./reaction-row";

interface TextMessageCardProps {
  message: MessageResponseDto;
  isMe?: boolean;
  translatedContent?: string;
  isTranslating?: boolean;
  isPoll?: boolean;
  messageTime: string;
  reactions?: MessageReactionItemDto[] | null;
  myReaction?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onReaction?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
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
  onPin,
  onUnpin,
  reactions,
  myReaction,
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
      <SpeakableText style={styles.content} readString={contentDisplay}>
        {contentDisplay}
      </SpeakableText>
      {reactions && reactions.length > 0 && (
        <ReactionRow reactions={reactions} myReaction={myReaction} />
      )}
      <View style={styles.footer}>
        <SpeakableText style={styles.timestamp}>{messageTime}</SpeakableText>
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
              {onReaction && (
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={onReaction}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <EmojiIcon
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
