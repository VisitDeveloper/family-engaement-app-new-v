// app/feed/[id].tsx
import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import TimelineItem from "@/components/reptitive-component/timeline-item";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { CommentResponseDto, commentService } from "@/services/comment.service";
import { likeService } from "@/services/like.service";
import { PostResponseDto, postService } from "@/services/post.service";
import { saveService } from "@/services/save.service";
import { useStore } from "@/store";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FeedDetailScreen = () => {
  const param = usePathname();
  const pathID = param.split("/");
  const id = pathID.pop();

  const theme = useStore((s) => s.theme);
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<PostResponseDto | null>(null);
  const [comments, setComments] = useState<CommentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Fetch post by ID
  const fetchPost = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const postData = await postService.getById(id);
      setPost(postData);
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to load post. Please try again.";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
      console.error("Error fetching post:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!id) return;

    try {
      setCommentsLoading(true);
      const response = await commentService.getPostComments(id, {
        page: 1,
        limit: 100,
        sort: "newest",
      });
      setComments(response || []);
    } catch (err: any) {
      console.error("Error fetching comments:", err);
      // Don't show alert for comments error, just log it
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  // Refresh both post and comments
  const refreshData = useCallback(async () => {
    await Promise.all([fetchPost(), fetchComments()]);
  }, [fetchPost, fetchComments]);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id, fetchPost, fetchComments]);

  const styles = useThemedStyles(
    (t) =>
      ({
        container: { flex: 1, backgroundColor: t.bg },
        scroll: {
          paddingBottom: insets.bottom + 30,
          paddingHorizontal: 16,
        },
        commentsSection: {
          padding: 15,
          borderTopWidth: 1,
          borderColor: t.border,
          marginTop: 10,
        },
        commentsTitle: {
          fontSize: 18,
          fontWeight: "600",
          color: t.text,
          marginBottom: 15,
        },
        commentItem: {
          flexDirection: "row",
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: t.border,
        },
        commentAvatar: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: t.panel,
          marginRight: 10,
          borderWidth: 1,
          borderColor: t.border,
        },
        commentContent: {
          flex: 1,
        },
        commentAuthor: {
          fontSize: 14,
          fontWeight: "600",
          color: t.text,
          marginBottom: 4,
        },
        commentText: {
          fontSize: 14,
          color: t.text,
          marginBottom: 4,
        },
        commentMeta: {
          flexDirection: "row",
          alignItems: "center",
          gap: 15,
          marginTop: 4,
        },
        commentAction: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        commentTime: {
          fontSize: 12,
          color: t.subText,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        },
        errorContainer: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        },
      } as const)
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderInnerPage title="Back to Timeline" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
          <ThemedText type="subText" style={{ marginTop: 10 }}>
            Loading post...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.container}>
        <HeaderInnerPage title="Back to Timeline" />
        <View style={styles.errorContainer}>
          <ThemedText
            type="default"
            style={{ color: "#ff4444", textAlign: "center", marginBottom: 10 }}
          >
            {error || "Post not found"}
          </ThemedText>
          <TouchableOpacity
            onPress={fetchPost}
            style={{
              backgroundColor: theme.tint,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <ThemedText style={{ color: "#fff" }}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const authorName =
    post.author.firstName && post.author.lastName
      ? `${post.author.firstName} ${post.author.lastName}`
      : post.author.firstName ||
        post.author.lastName ||
        post.author.email ||
        "Unknown";

  const renderComment = ({ item }: { item: CommentResponseDto }) => {
    const commentAuthorName =
      item.author.firstName && item.author.lastName
        ? `${item.author.firstName} ${item.author.lastName}`
        : item.author.firstName ||
          item.author.lastName ||
          item.author.email ||
          "Unknown";

    return (
      <View style={styles.commentItem}>
        {item.author.profilePicture ? (
          <Image
            source={{ uri: item.author.profilePicture }}
            style={styles.commentAvatar}
          />
        ) : (
          <View style={styles.commentAvatar}>
            <Ionicons name="person-circle" size={32} color={theme.subText} />
          </View>
        )}
        <View style={styles.commentContent}>
          <ThemedText type="defaultSemiBold" style={styles.commentAuthor}>
            {commentAuthorName}
          </ThemedText>
          <ThemedText type="subText" style={styles.commentText}>
            {item.content}
          </ThemedText>
          <View style={styles.commentMeta}>
            <ThemedText type="subLittleText" style={styles.commentTime}>
              {formatTimeAgo(item.createdAt)}
            </ThemedText>
            <TouchableOpacity
              style={styles.commentAction}
              onPress={async () => {
                try {
                  if (item.isLiked) {
                    await likeService.unlikeComment(item.id);
                  } else {
                    await likeService.likeComment(item.id);
                  }
                  await fetchComments();
                } catch (err) {
                  console.error("Error toggling comment like:", err);
                }
              }}
            >
              <AntDesign
                name={item.isLiked ? "heart" : ("hearto" as any)}
                size={14}
                color={item.isLiked ? theme.tint : theme.subText}
              />
              <ThemedText type="subLittleText" style={{ color: theme.subText }}>
                {item.likesCount}
              </ThemedText>
            </TouchableOpacity>
            {item.repliesCount > 0 && (
              <ThemedText type="subLittleText" style={{ color: theme.subText }}>
                {item.repliesCount}{" "}
                {item.repliesCount === 1 ? "reply" : "replies"}
              </ThemedText>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderInnerPage title="Back to Timeline" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <TimelineItem
          postId={post.id}
          name={authorName}
          author={post.author}
          seen={formatTimeAgo(post.createdAt)}
          desc={post.description}
          numberOfComment={post.commentsCount}
          numberOfLike={post.likesCount}
          tags={post.tags || []}
          images={post.images || []}
          files={post.files || []}
          recommended={post.recommended}
          isLiked={post.isLiked}
          isSaved={post.isSaved}
          comments={post.comments || []}
          hasMoreComments={post.hasMoreComments || false}
          onLike={async () => {
            try {
              await likeService.likePost(post.id);
              await refreshData();
            } catch (error) {
              console.error("Error toggling like:", error);
            }
          }}
          onSave={async () => {
            try {
              await saveService.savePost(post.id);
              await refreshData();
            } catch (error) {
              console.error("Error toggling save:", error);
            }
          }}
          onCommentAdded={async () => {
            await refreshData();
          }}
        />

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <ThemedText type="subtitle" style={styles.commentsTitle}>
            Comments ({comments?.length || 0})
          </ThemedText>
          {commentsLoading ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={theme.tint} />
            </View>
          ) : comments.length === 0 ? (
            <ThemedText
              type="subText"
              style={{ textAlign: "center", padding: 20 }}
            >
              No comments yet. Be the first to comment!
            </ThemedText>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default FeedDetailScreen;
