import { CommentResponseDto } from "@/services/comment.service";
import { useStore } from "@/store";
import { EvilIcons, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../themed-text";
import { formatTimeAgoShort } from "@/utils/format-time-ago";

interface ReplyItemProps {
  reply: CommentResponseDto;
  commentLikes: Record<string, { isLiked: boolean; likesCount: number }>;
  onLike: (replyId: string) => void;
}

export function ReplyItem({ reply, commentLikes, onLike }: ReplyItemProps) {
  const theme = useStore((state) => state.theme);

  const isLiked = commentLikes[reply.id]?.isLiked ?? reply.isLiked ?? false;
  const likesCount =
    commentLikes[reply.id]?.likesCount ?? reply.likesCount ?? 0;

  const authorName =
    reply.author.firstName && reply.author.lastName
      ? `${reply.author.firstName} ${reply.author.lastName}`
      : reply.author.firstName ||
        reply.author.lastName ||
        reply.author.email ||
        "Unknown";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
        paddingRight: 16,
      }}
    >
      {reply.author.profilePicture ? (
        <Image
          source={{ uri: reply.author.profilePicture }}
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            marginRight: 8,
          }}
        />
      ) : (
        <Ionicons
          name="person-circle"
          size={20}
          style={{
            marginRight: 8,
          }}
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
              style={{ fontSize: 12, marginRight: 4 }}
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
              {formatTimeAgoShort(reply.createdAt)}
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
          <ThemedText type="subText" style={{ flex: 1 }}>
            {reply.content}
          </ThemedText>

          <TouchableOpacity
            onPress={() => onLike(reply.id)}
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 4,
              paddingTop: 2,
            }}
          >
            <EvilIcons
              name="heart"
              size={14}
              color={isLiked ? theme.tint : theme.subText}
            />
            <ThemedText
              type="subLittleText"
              style={{
                fontSize: 11,
                position: "absolute",
                bottom: -18,
                width: 40,
                textAlign: "center",
                color: theme.subText,
              }}
            >
              {likesCount}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

