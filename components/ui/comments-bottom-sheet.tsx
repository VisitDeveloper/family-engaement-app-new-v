import { useThemedStyles } from "@/hooks/use-theme-style";
import { CommentResponseDto, commentService } from "@/services/comment.service";
import { likeService } from "@/services/like.service";
import { useStore } from "@/store";
import { EvilIcons, Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface CommentsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  initialComments?: CommentResponseDto[];
  onCommentAdded?: () => void;
}

export default function CommentsBottomSheet({
  visible,
  onClose,
  postId,
  initialComments = [],
  onCommentAdded,
}: CommentsBottomSheetProps) {
  const theme = useStore((state) => state.theme);
  const user = useStore((state) => state.user);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Helper function to format time ago
  const formatTimeAgoShort = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const [comments, setComments] =
    useState<CommentResponseDto[]>(initialComments);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentLikes, setCommentLikes] = useState<
    Record<string, { isLiked: boolean; likesCount: number }>
  >({});
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [showReplyInput, setShowReplyInput] = useState<Record<string, boolean>>(
    {}
  );
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<
    Record<string, boolean>
  >({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>(
    {}
  );
  const [commentReplies, setCommentReplies] = useState<
    Record<string, CommentResponseDto[]>
  >({});

  // Snap points for bottom sheet - only 90%
  const snapPoints = useMemo(() => ["90%"], []);

  // Handle sheet changes
  useEffect(() => {
    console.log("Bottom sheet visible changed:", visible);
    if (visible) {
      // Use setTimeout to ensure the sheet is mounted
      setTimeout(() => {
        console.log("Presenting bottom sheet");
        bottomSheetRef.current?.present();
      }, 100);
    } else {
      console.log("Dismissing bottom sheet");
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  // Fetch comments when sheet opens
  const fetchComments = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      const response = await commentService.getPostComments(postId, {
        page: 1,
        limit: 100,
        sort: "newest",
      });
      setComments(response || []);
    } catch (err: any) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (visible && postId) {
      fetchComments();
    }
  }, [visible, postId, fetchComments]);

  // Initialize comment likes state
  useEffect(() => {
    const likesState: Record<string, { isLiked: boolean; likesCount: number }> =
      {};
    comments.forEach((comment) => {
      likesState[comment.id] = {
        isLiked: comment.isLiked || false,
        likesCount: comment.likesCount || 0,
      };
      // Also initialize likes for replies if they exist
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach((reply) => {
          likesState[reply.id] = {
            isLiked: reply.isLiked || false,
            likesCount: reply.likesCount || 0,
          };
        });
      }
    });
    setCommentLikes(likesState);
  }, [comments]);

  // Fetch replies for a comment
  const fetchReplies = async (commentId: string) => {
    if (loadingReplies[commentId] || commentReplies[commentId]) return;

    try {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
      const response = await commentService.getCommentReplies(commentId, {
        page: 1,
        limit: 50,
        sort: "newest",
      });
      const fetchedReplies = response.replies || [];
      setCommentReplies((prev) => ({
        ...prev,
        [commentId]: fetchedReplies,
      }));
      // Initialize likes state for fetched replies
      setCommentLikes((prev) => {
        const updated = { ...prev };
        fetchedReplies.forEach((reply) => {
          updated[reply.id] = {
            isLiked: reply.isLiked || false,
            likesCount: reply.likesCount || 0,
          };
        });
        return updated;
      });
    } catch (err: any) {
      console.error("Error fetching replies:", err);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  // Toggle show replies
  const toggleShowReplies = (commentId: string) => {
    const newState = !showReplies[commentId];
    setShowReplies((prev) => ({ ...prev, [commentId]: newState }));

    // Fetch replies if showing for the first time
    if (newState && !commentReplies[commentId]) {
      const comment = comments.find((c) => c.id === commentId);
      if (comment && comment.replies && comment.replies.length > 0) {
        const existingReplies = comment.replies || [];
        setCommentReplies((prev) => ({
          ...prev,
          [commentId]: existingReplies,
        }));
        // Initialize likes state for existing replies
        setCommentLikes((prev) => {
          const updated = { ...prev };
          existingReplies.forEach((reply) => {
            updated[reply.id] = {
              isLiked: reply.isLiked || false,
              likesCount: reply.likesCount || 0,
            };
          });
          return updated;
        });
      } else {
        fetchReplies(commentId);
      }
    }
  };

  // Handle comment submission
  const handleSubmitComment = async () => {
    const commentText = comment.trim();
    if (!commentText || !postId) return;

    try {
      setIsSubmittingComment(true);
      await commentService.createComment(postId, {
        content: commentText,
      });

      setComment("");
      await fetchComments();
      if (onCommentAdded) {
        onCommentAdded();
      }
      // Keep bottom sheet open - don't close it
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to post comment");
      console.error("Error posting comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle reply submission
  const handleReply = async (commentId: string) => {
    const replyText = replyInputs[commentId]?.trim();
    if (!replyText || !postId) return;

    try {
      setIsSubmittingReply((prev) => ({ ...prev, [commentId]: true }));
      await commentService.replyToComment(commentId, {
        content: replyText,
      });

      setReplyInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[commentId];
        return newInputs;
      });
      setShowReplyInput((prev) => ({
        ...prev,
        [commentId]: false,
      }));

      if (showReplies[commentId]) {
        await fetchReplies(commentId);
      }

      await fetchComments();
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to post reply");
      console.error("Error posting reply:", err);
    } finally {
      setIsSubmittingReply((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  // Handle comment like
  const handleCommentLike = async (commentId: string) => {
    // Find the comment or reply to get initial state
    let comment = comments.find((c) => c.id === commentId);

    // If not found in main comments, check in replies
    if (!comment) {
      for (const parentCommentId of Object.keys(commentReplies)) {
        const reply = commentReplies[parentCommentId].find(
          (r) => r.id === commentId
        );
        if (reply) {
          comment = reply;
          break;
        }
      }
    }

    const currentState = commentLikes[commentId] || {
      isLiked: comment?.isLiked || false,
      likesCount: comment?.likesCount || 0,
    };

    const isLiked = currentState.isLiked;

    // Optimistic update
    setCommentLikes((prev) => ({
      ...prev,
      [commentId]: {
        isLiked: !isLiked,
        likesCount: isLiked
          ? (prev[commentId]?.likesCount || currentState.likesCount) - 1
          : (prev[commentId]?.likesCount || currentState.likesCount) + 1,
      },
    }));

    try {
      await likeService.likeComment(commentId);

      // Don't refetch comments - optimistic update is already done
      // Update the comment in the comments array (for main comments)
      setComments((prevComments) =>
        prevComments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: !isLiked,
                likesCount: isLiked
                  ? (c.likesCount || 0) - 1
                  : (c.likesCount || 0) + 1,
              }
            : c
        )
      );
      // Also update replies if they are loaded (for both main comments and replies)
      setCommentReplies((prevReplies) => {
        const updatedReplies = { ...prevReplies };
        Object.keys(updatedReplies).forEach((parentCommentId) => {
          updatedReplies[parentCommentId] = updatedReplies[parentCommentId].map(
            (reply) =>
              reply.id === commentId
                ? {
                    ...reply,
                    isLiked: !isLiked,
                    likesCount: isLiked
                      ? (reply.likesCount || 0) - 1
                      : (reply.likesCount || 0) + 1,
                  }
                : reply
          );
        });
        return updatedReplies;
      });
    } catch (err: any) {
      // Revert on error - revert both commentLikes, comments, and commentReplies
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: currentState,
      }));
      // Revert comments array
      setComments((prevComments) =>
        prevComments.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: currentState.isLiked,
                likesCount: currentState.likesCount,
              }
            : c
        )
      );
      // Also revert replies if they were updated
      setCommentReplies((prevReplies) => {
        const updatedReplies = { ...prevReplies };
        Object.keys(updatedReplies).forEach((parentCommentId) => {
          updatedReplies[parentCommentId] = updatedReplies[parentCommentId].map(
            (reply) =>
              reply.id === commentId
                ? {
                    ...reply,
                    isLiked: currentState.isLiked,
                    likesCount: currentState.likesCount,
                  }
                : reply
          );
        });
        return updatedReplies;
      });
      console.error("Error toggling comment like:", err);
      Alert.alert("Error", err.message || "Failed to toggle like");
    }
  };

  const styles = useThemedStyles(
    (t) =>
      ({
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 16,
          // borderBottomWidth: 1,
          // borderBottomColor: t.border,
        },
        commentRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          padding: 12,
          //   borderBottomWidth: 1,
          //   borderBottomColor: t.border,
        },
        replyContainer: {
          marginLeft: 32,
          marginTop: 8,
        },
        replyItem: {
          flexDirection: "row",
          alignItems: "flex-start",
          marginBottom: 8,
        },
        replyInputContainer: {
          marginLeft: 32,
          marginTop: 8,
          padding: 8,
          paddingRight: 16,
          //   backgroundColor: t.panel,
          borderRadius: 8,
        },
        commentInput: {
          flex: 1,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 10,
          color: t.text,
          backgroundColor: t.panel,
        },
        inputContainer: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: t.border,
          backgroundColor: t.bg,
        },
      } as const)
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      console.log("Sheet index changed:", index);
      // Only close if user explicitly closes (index === -1)
      // Don't close on other index changes
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <View
        {...props}
        style={[
          props.style,
          {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        ]}
      />
    ),
    []
  );

  if (!visible) {
    return null;
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: theme.bg,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
      handleIndicatorStyle={{ backgroundColor: theme.subText }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="none"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={{ flex: 1, height: "100%" }}>
        <View style={styles.header}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>
            Comments
          </ThemedText>
          {/* <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity> */}
        </View>

        <BottomSheetScrollView
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={{ flex: 1 }}
        >
          {loading ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ThemedText type="subText">Loading comments...</ThemedText>
            </View>
          ) : comments.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ThemedText type="subText">No comments yet</ThemedText>
            </View>
          ) : (
            comments.map((commentItem) => {
              const replies =
                commentReplies[commentItem.id] || commentItem.replies || [];
              const isShowingReplies = showReplies[commentItem.id] || false;
              const hasReplies =
                commentItem.repliesCount > 0 ||
                (commentItem.replies && commentItem.replies.length > 0) ||
                replies.length > 0;

              return (
                <View key={commentItem.id}>
                  <View style={styles.commentRow}>
                    {commentItem.author.profilePicture ? (
                      <Image
                        source={{ uri: commentItem.author.profilePicture }}
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
                            {commentItem.author.firstName &&
                            commentItem.author.lastName
                              ? `${commentItem.author.firstName} ${commentItem.author.lastName}`
                              : commentItem.author.firstName ||
                                commentItem.author.lastName ||
                                commentItem.author.email ||
                                "Unknown"}
                          </ThemedText>
                          <ThemedText
                            type="subLittleText"
                            style={{
                              fontSize: 9,
                              color: theme.subText,
                              marginRight: 4,
                            }}
                          >
                            {formatTimeAgoShort(commentItem.createdAt)}
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
                          {commentItem.content}
                        </ThemedText>

                        <TouchableOpacity
                          onPress={() => handleCommentLike(commentItem.id)}
                          style={{
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <EvilIcons
                            name={
                              commentLikes[commentItem.id]?.isLiked ??
                              commentItem.isLiked
                                ? "heart"
                                : ("heart" as any)
                            }
                            size={18}
                            color={
                              commentLikes[commentItem.id]?.isLiked ??
                              commentItem.isLiked
                                ? theme.tint
                                : theme.subText
                            }
                          />
                          <ThemedText
                            type="subLittleText"
                            style={{ fontSize: 10, color: theme.subText }}
                          >
                            {commentLikes[commentItem.id]?.likesCount ??
                              commentItem.likesCount ??
                              0}
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
                          onPress={() => {
                            setShowReplyInput((prev) => ({
                              ...prev,
                              [commentItem.id]: !prev[commentItem.id],
                            }));
                            if (!showReplyInput[commentItem.id]) {
                              setReplyInputs((prev) => ({
                                ...prev,
                                [commentItem.id]: "",
                              }));
                            }
                          }}
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <ThemedText
                            type="subLittleText"
                            style={{
                              // marginLeft: 4,
                              fontSize: 12,
                              color: theme.subText,
                            }}
                          >
                            Reply
                          </ThemedText>
                        </TouchableOpacity>

                        {hasReplies && (
                          <TouchableOpacity
                            onPress={() => toggleShowReplies(commentItem.id)}
                          >
                            <ThemedText
                              type="subLittleText"
                              style={{ fontSize: 12, color: theme.subText }}
                            >
                              {isShowingReplies ? "Hide" : "View"}{" "}
                              {commentItem.repliesCount || replies.length}{" "}
                              {commentItem.repliesCount === 1
                                ? "reply"
                                : "replies"}
                            </ThemedText>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Replies */}
                  {isShowingReplies && (
                    <View style={styles.replyContainer}>
                      {loadingReplies[commentItem.id] ? (
                        <ThemedText type="subLittleText" style={{ padding: 8 }}>
                          Loading replies...
                        </ThemedText>
                      ) : replies.length > 0 ? (
                        replies.map((reply) => (
                          <View key={reply.id}>
                            <View
                              style={{ ...styles.replyItem, paddingRight: 16 }}
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
                                    //   width: 24,
                                    //   height: 24,
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
                                      {reply.author.firstName &&
                                      reply.author.lastName
                                        ? `${reply.author.firstName} ${reply.author.lastName}`
                                        : reply.author.firstName ||
                                          reply.author.lastName ||
                                          reply.author.email ||
                                          "Unknown"}
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
                                  <ThemedText
                                    type="subText"
                                    style={{ flex: 1 }}
                                  >
                                    {reply.content}
                                  </ThemedText>

                                  <TouchableOpacity
                                    onPress={() => handleCommentLike(reply.id)}
                                    style={{
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      marginTop: 4,
                                      paddingTop: 2,
                                    }}
                                  >
                                    <EvilIcons
                                      name={
                                        commentLikes[reply.id]?.isLiked ??
                                        reply.isLiked
                                          ? "heart"
                                          : ("heart" as any)
                                      }
                                      size={14}
                                      color={
                                        commentLikes[reply.id]?.isLiked ??
                                        reply.isLiked
                                          ? theme.tint
                                          : theme.subText
                                      }
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
                                      {commentLikes[reply.id]?.likesCount ??
                                        reply.likesCount ??
                                        0}
                                    </ThemedText>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          </View>
                        ))
                      ) : (
                        <ThemedText
                          type="subLittleText"
                          style={{ padding: 8, fontSize: 11 }}
                        >
                          No replies yet
                        </ThemedText>
                      )}
                    </View>
                  )}

                  {/* Reply input */}
                  {showReplyInput[commentItem.id] && (
                    <View
                      style={{ ...styles.replyInputContainer, paddingLeft: 0 }}
                    >
                      <View
                        style={{
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {user?.profilePicture ? (
                            <Image
                              source={{ uri: user?.profilePicture || "" }}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                              }}
                            />
                          ) : (
                            <Ionicons
                              name="person-circle"
                              size={24}
                              color={theme.subText}
                            />
                          )}
                          <TextInput
                            style={[
                              styles.commentInput,
                              { height: 36, fontSize: 13, flex: 1 },
                            ]}
                            value={replyInputs[commentItem.id] || ""}
                            onChangeText={(text) =>
                              setReplyInputs((prev) => ({
                                ...prev,
                                [commentItem.id]: text,
                              }))
                            }
                            placeholder="Add a reply..."
                            placeholderTextColor={theme.subText}
                            editable={!isSubmittingReply[commentItem.id]}
                            onSubmitEditing={() => handleReply(commentItem.id)}
                          />
                        </View>

                        <TouchableOpacity
                          onPress={() => handleReply(commentItem.id)}
                          disabled={
                            !replyInputs[commentItem.id]?.trim() ||
                            isSubmittingReply[commentItem.id]
                          }
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor:
                              replyInputs[commentItem.id]?.trim() &&
                              !isSubmittingReply[commentItem.id]
                                ? theme.tint
                                : theme.subText,
                            backgroundColor: "transparent",
                          }}
                        >
                          <ThemedText
                            style={{
                              color:
                                replyInputs[commentItem.id]?.trim() &&
                                !isSubmittingReply[commentItem.id]
                                  ? theme.tint
                                  : theme.subText,
                              fontSize: 13,
                              fontWeight: "600",
                            }}
                          >
                            {isSubmittingReply[commentItem.id]
                              ? "Sending..."
                              : "Add Reply"}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </BottomSheetScrollView>

        {/* Comment input */}
        <View
          style={{
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
            paddingBottom: 16,
          }}
        >
          <View style={styles.inputContainer}>
            {user?.profilePicture ? (
              <Image
                source={{ uri: user?.profilePicture || "" }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                }}
              />
            ) : (
              <Ionicons name="person-circle" size={32} color={theme.subText} />
            )}
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment..."
              placeholderTextColor={theme.subText}
              editable={!isSubmittingComment}
              onSubmitEditing={() => {
                // Don't submit on enter for multiline, use button instead
                // handleSubmitComment();
              }}
              blurOnSubmit={false}
              multiline
            />
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <TouchableOpacity
              onPress={handleSubmitComment}
              disabled={!comment.trim() || isSubmittingComment}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor:
                  comment.trim() && !isSubmittingComment
                    ? theme.tint
                    : theme.subText,
                backgroundColor: "transparent",
              }}
            >
              <ThemedText
                style={{
                  color:
                    comment.trim() && !isSubmittingComment
                      ? theme.tint
                      : theme.subText,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {isSubmittingComment ? "Sending..." : "Add Comment"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
