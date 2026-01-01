import { CommentResponseDto } from "@/services/comment.service";
import { View } from "react-native";
import { ThemedText } from "../../themed-text";
import { ReplyItem } from "./reply-item";

interface RepliesListProps {
  replies: CommentResponseDto[];
  commentLikes: Record<string, { isLiked: boolean; likesCount: number }>;
  onLike: (replyId: string) => void;
  isLoading: boolean;
}

export function RepliesList({
  replies,
  commentLikes,
  onLike,
  isLoading,
}: RepliesListProps) {
  if (isLoading) {
    return (
      <ThemedText type="subLittleText" style={{ padding: 8 }}>
        Loading replies...
      </ThemedText>
    );
  }

  if (replies.length === 0) {
    return (
      <ThemedText type="subLittleText" style={{ padding: 8, fontSize: 11 }}>
        No replies yet
      </ThemedText>
    );
  }

  return (
    <View style={{ marginLeft: 32, marginTop: 8 }}>
      {replies.map((reply) => (
        <ReplyItem
          key={reply.id}
          reply={reply}
          commentLikes={commentLikes}
          onLike={onLike}
        />
      ))}
    </View>
  );
}

