import { useThemedStyles } from "@/hooks/use-theme-style";
import { MessageResponseDto } from "@/services/messaging.service";
import type { MessageReactionItemDto } from "@/types";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { SpeakableText } from "@/components/speakable-text";
import { Image, TouchableOpacity, View } from "react-native";
import { EmojiIcon, TrashIcon } from "../icons/messages-icons";
import MessagePinAction from "./message-pin-action";
import ReactionRow from "./reaction-row";

/** Matches image attachments and chat bubble content width. */
const VIDEO_THUMB_WIDTH = 200;
const VIDEO_THUMB_HEIGHT = Math.round((VIDEO_THUMB_WIDTH * 9) / 16);

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
  onPin?: () => void;
  onUnpin?: () => void;
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
  onPin,
  onUnpin,
  reactions,
  myReaction,
}: VideoMessageCardProps) {
  const { theme } = useStore((state) => state);

  const styles = useThemedStyles((t) => ({
    root: {
      alignSelf: "flex-start",
      maxWidth: "100%",
    },
    videoWrapper: {
      width: VIDEO_THUMB_WIDTH,
      height: VIDEO_THUMB_HEIGHT,
      borderRadius: 8,
      marginTop: 5,
      overflow: "hidden",
    },
    videoThumbnail: {
      width: VIDEO_THUMB_WIDTH,
      height: VIDEO_THUMB_HEIGHT,
    },
    playIconContainer: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: "center",
      alignItems: "center",
      opacity: 0.9,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
      gap: 8,
      width: VIDEO_THUMB_WIDTH,
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
    <View style={styles.root}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.videoWrapper}
        onPress={() => onVideoPress?.(message.mediaUrl!)}
      >
        <Image
          source={{ uri: thumbnailUrl }}
          style={styles.videoThumbnail}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel="Video thumbnail"
        />
        <View style={styles.playIconContainer} pointerEvents="none">
          <Ionicons name="play-circle" size={48} color="#fff" />
        </View>
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
          (onReaction || onPin || onUnpin) && (
            <View style={styles.footerRight}>
              <View style={styles.actions}>

                {onReaction && (
                  <TouchableOpacity style={styles.actionIcon} onPress={onReaction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <EmojiIcon size={12} color={theme.subText ?? "#666"} />
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
    </View>
  );
}
