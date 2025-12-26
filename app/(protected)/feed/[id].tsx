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
import { usePathname, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FeedDetailScreen = () => {
  const param = usePathname();
  const router = useRouter();
  const pathID = param.split("/");
  const id = pathID.pop();

  const theme = useStore((s) => s.theme);
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<PostResponseDto | null>(null);
  const [comments, setComments] = useState<CommentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
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
      const response = await commentService.getPostComments(id, {
        page: 1,
        limit: 100,
        sort: "newest",
      });
      setComments(response || []);
    } catch (err: any) {
      console.error("Error fetching comments:", err);
      // Don't show alert for comments error, just log it
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
          comments={comments.length > 0 ? comments : (post.comments || [])}
          hasMoreComments={post.hasMoreComments || false}
          showAllCommentsByDefault={true}
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
          onEdit={() => {
            router.push({
              pathname: "/create-post",
              params: {
                postId: post.id,
                description: post.description,
                tags: post.tags?.join(",") || "",
                recommended: post.recommended ? "true" : "false",
                visibility: post.visibility,
                images: post.images?.join(",") || "",
                files: post.files?.join(",") || "",
              },
            });
          }}
          onDelete={async () => {
            try {
              await postService.delete(post.id);
              Alert.alert("Success", "Post deleted successfully");
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete post");
              console.error("Error deleting post:", error);
            }
          }}
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default FeedDetailScreen;
