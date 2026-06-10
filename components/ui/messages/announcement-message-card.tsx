import { useThemedStyles } from "@/hooks/use-theme-style";
import { MessageResponseDto } from "@/services/messaging.service";
import type { MessageReactionItemDto } from "@/types";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { SpeakableText } from "@/components/speakable-text";
import { TouchableOpacity, View } from "react-native";
import { CopyIcon, PencilIcon, TrashIcon } from "../icons/messages-icons";
import MessagePinAction from "./message-pin-action";
import ReactionRow from "./reaction-row";

interface AnnouncementMessageCardProps {
  message: MessageResponseDto;
  isMe?: boolean;
  translatedContent?: string;
  isTranslating?: boolean;
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

export default function AnnouncementMessageCard({
  message,
  isMe = false,
  translatedContent,
  isTranslating,
  onEdit,
  onDelete,
  onCopy,
  onReaction,
  onPin,
  onUnpin,
  messageTime,
  reactions,
  myReaction,
}: AnnouncementMessageCardProps) {

  const { theme, colorScheme } = useStore((state) => state);

  const styles = useThemedStyles((t) => ({
    container: {
      backgroundColor: t.panel,
      borderRadius: 12,
      padding: 14,
      maxWidth: "85%",
      minWidth: 250,
      borderWidth: 1.5,
      borderColor: "#46A0C3",
    },
    announcementTag: {
      backgroundColor: "rgba(169, 210, 227, 0.25)",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: "flex-start",
      borderWidth: 0.5,
      borderColor: "#A9D2E3",
      marginBottom: 12,
    },
    announcementTagText: {
      color: colorScheme === "dark" ? "#A9D2E3" : "#18709D",
      fontSize: 12,
      fontWeight: "400",
      letterSpacing: 0.2,
    },
    content: {
      fontSize: 15,
      color: t.text,
      lineHeight: 22,
      marginBottom: 10,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 2,
    },
    timestamp: {
      fontSize: 11,
      color: t.subText,
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

  const contentDisplay = isTranslating && translatedContent === undefined
    ? "…"
    : (translatedContent ?? message.content ?? "");

  return (
    <View style={styles.container}>
      {/* Announcement Tag */}
      <View style={styles.announcementTag}>
        <SpeakableText style={styles.announcementTagText}>Announcement</SpeakableText>
      </View>

      {/* Message Content */}
      <SpeakableText style={styles.content} readString={contentDisplay}>
        {contentDisplay}
      </SpeakableText>

      {reactions && reactions.length > 0 && (
        <ReactionRow reactions={reactions} myReaction={myReaction} />
      )}

      {/* Footer with timestamp and actions */}
      <View style={styles.footer}>
        <SpeakableText style={styles.timestamp}>{messageTime}</SpeakableText>
        {isMe ? (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={onEdit}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <PencilIcon size={12} color={theme.subText} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={onDelete}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <TrashIcon size={12} color={theme.subText} />
              </TouchableOpacity>
            )}
            <MessagePinAction
              onPin={onPin}
              onUnpin={onUnpin}
              color={theme.subText}
            />
          </View>
        ) : (
          (onCopy || onReaction || onPin || onUnpin) && (
            <View style={styles.actions}>
              {onCopy && (
                <TouchableOpacity style={styles.actionIcon} onPress={onCopy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <CopyIcon size={12} color={theme.subText} />
                </TouchableOpacity>
              )}
              {onReaction && (
                <TouchableOpacity style={styles.actionIcon} onPress={onReaction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="heart-outline" size={12} color={theme.subText} />
                </TouchableOpacity>
              )}
              <MessagePinAction
                onPin={onPin}
                onUnpin={onUnpin}
                color={theme.subText}
              />
            </View>
          )
        )}
      </View>
    </View>
  );
}
