import { CommentResponseDto } from "@/services/comment.service";
import { useStore } from "@/store";
import { EvilIcons, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../themed-text";
import { formatTimeAgoShort } from "@/utils/format-time-ago";

interface CommentItemProps {
  comment: CommentResponseDto;
  commentLikes: Record<string, { isLiked: boolean; likesCount: number }>;
  onLike: (commentId: string) => void;
  onReply: (commentId: string) => void;
  onToggleReplies: (commentId: string) => void;
  showReplies: boolean;
  hasReplies: boolean;
  repliesCount: number;
}

export function CommentItem({
  comment,
  commentLikes,
  onLike,
  onReply,
  onToggleReplies,
  showReplies,
  hasReplies,
  repliesCount,
}: CommentItemProps) {
  const theme = useStore((state) => state.theme);

  const isLiked =
    commentLikes[comment.id]?.isLiked ?? comment.isLiked ?? false;
  const likesCount =
    commentLikes[comment.id]?.likesCount ?? comment.likesCount ?? 0;

  const authorName =
    comment.author.firstName && comment.author.lastName
      ? `${comment.author.firstName} ${comment.author.lastName}`
      : comment.author.firstName ||
        comment.author.lastName ||
        comment.author.email ||
        "Unknown";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 12,
      }}
    >
      {comment?.author?.profilePicture ? (
        <Image
          source={{ uri: comment?.author?.profilePicture }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            marginRight: 8,
          }}
        />
      ) : (
        <Ionicons
          name="person-circle"
          size={20}
          style={{ marginRight: 8 }}
          color={theme.subText}
        />
      )}
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <ThemedText
              type="defaultSemiBold"
              style={{ fontSize: 11, marginRight: 4 }}
            >
              {authorName}
            </ThemedText>
            <ThemedText
              type="subLittleText"
              style={{
                fontSize: 9,
                color: theme.subText,
                marginRight: 4,
              }}
            >
              {formatTimeAgoShort(comment.createdAt)}
            </ThemedText>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginTop: 0,
          }}
        >
          <ThemedText type="subText" style={{ fontSize: 12 }}>
            {comment.content}
          </ThemedText>

          <TouchableOpacity
            onPress={() => onLike(comment.id)}
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EvilIcons
              name="heart"
              size={18}
              color={isLiked ? theme.tint : theme.subText}
            />
            <ThemedText
              type="subLittleText"
              style={{ fontSize: 10, color: theme.subText }}
            >
              {likesCount}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 0,
            gap: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => onReply(comment.id)}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <ThemedText
              type="subLittleText"
              style={{
                fontSize: 12,
                color: theme.subText,
              }}
            >
              Reply
            </ThemedText>
          </TouchableOpacity>

          {hasReplies && (
            <TouchableOpacity onPress={() => onToggleReplies(comment.id)}>
              <ThemedText
                type="subLittleText"
                style={{ fontSize: 12, color: theme.subText }}
              >
                {showReplies ? "Hide" : "View"} {repliesCount}{" "}
                {repliesCount === 1 ? "reply" : "replies"}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

