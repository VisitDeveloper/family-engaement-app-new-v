import { CommentResponseDto, commentService } from "@/services/comment.service";
import { likeService } from "@/services/like.service";
import { useStore } from "@/store";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { ThemedText } from "../themed-text";
import { CommentInput } from "./comments/comment-input";
import { CommentItem } from "./comments/comment-item";
import { RepliesList } from "./comments/replies-list";
import { ReplyInput } from "./comments/reply-input";

interface CommentsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  initialComments?: CommentResponseDto[];
  onCommentAdded?: () => void;
  onCommentsChange?: (comments: CommentResponseDto[]) => void;
  onReplyAdded?: (commentId: string, reply: CommentResponseDto) => void;
}

export default function CommentsBottomSheet({
  visible,
  onClose,
  postId,
  initialComments = [],
  onCommentAdded,
  onCommentsChange,
  onReplyAdded,
}: CommentsBottomSheetProps) {
  const theme = useStore((state) => state.theme);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [comments, setComments] =
    useState<CommentResponseDto[]>(initialComments);

  // Update comments when initialComments change (from timeline-item)
  // Sync likes and other updates from timeline-item
  // Use ref to prevent infinite loops
  const prevInitialCommentsRef = useRef<string>('');
  useEffect(() => {
    if (initialComments && initialComments.length > 0) {
      const initialCommentsKey = initialComments.map(c => `${c.id}-${c.likesCount}-${c.isLiked}`).join(',');
      // Only update if initialComments actually changed
      if (prevInitialCommentsRef.current !== initialCommentsKey) {
        prevInitialCommentsRef.current = initialCommentsKey;
        setComments((prevComments) => {
          // If we don't have comments yet, use initialComments
          if (prevComments.length === 0) {
            return initialComments;
          }
          // Merge initialComments with current comments to sync likes and updates
          const merged = prevComments.map((prevComment) => {
            const updated = initialComments.find((c) => c.id === prevComment.id);
            return updated || prevComment;
          });
          // Add any new comments from initialComments
          initialComments.forEach((initComment) => {
            if (!merged.find((c) => c.id === initComment.id)) {
              merged.push(initComment);
            }
          });
          return merged;
        });
      }
    }
  }, [initialComments]);
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
      const fetchedComments = response || [];
      setComments(fetchedComments);
      // Only notify parent on initial fetch, not on every change
      // This prevents infinite loops
    } catch (err: any) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (visible && postId) {
      // If we have initialComments, use them first, then fetch to get latest
      if (initialComments && initialComments.length > 0) {
        setComments(initialComments);
      }
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, postId, fetchComments]);

  // Don't sync automatically - only sync on specific actions (like, add comment, etc.)

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
      const newComment = await commentService.createComment(postId, {
        content: commentText,
      });

      setComment("");
      // Add new comment to state instead of refetching
      const updatedComments = [newComment, ...comments];
      setComments(updatedComments);
      // Initialize likes state for new comment
      setCommentLikes((prev) => ({
        ...prev,
        [newComment.id]: {
          isLiked: newComment.isLiked || false,
          likesCount: newComment.likesCount || 0,
        },
      }));
      // Notify parent about comment changes
      if (onCommentsChange) {
        onCommentsChange(updatedComments);
      }
      // Only notify parent to update comment count, not refetch
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
      const newReply = await commentService.replyToComment(commentId, {
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

      // Add reply to state - always add, not just when replies are shown
      setCommentReplies((prev) => ({
        ...prev,
        [commentId]: [newReply, ...(prev[commentId] || [])],
      }));
      
      // Initialize likes state for new reply
      setCommentLikes((prev) => ({
        ...prev,
        [newReply.id]: {
          isLiked: newReply.isLiked || false,
          likesCount: newReply.likesCount || 0,
        },
      }));
      
      // Update parent comment's repliesCount
      const updatedComments = comments.map((c) =>
        c.id === commentId
          ? { ...c, repliesCount: (c.repliesCount || 0) + 1 }
          : c
      );
      setComments(updatedComments);
      
      // Show replies if not already shown
      if (!showReplies[commentId]) {
        setShowReplies((prev) => ({ ...prev, [commentId]: true }));
      }
      
      // Notify parent about comment changes
      if (onCommentsChange) {
        onCommentsChange(updatedComments);
      }

      // Notify parent about new reply
      if (onReplyAdded) {
        onReplyAdded(commentId, newReply);
      }

      // Only notify parent to update comment count, not refetch
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
      const updatedComments = comments.map((c) =>
        c.id === commentId
          ? {
              ...c,
              isLiked: !isLiked,
              likesCount: isLiked
                ? (c.likesCount || 0) - 1
                : (c.likesCount || 0) + 1,
            }
          : c
      );
      setComments(updatedComments);
      // Notify parent about comment changes
      if (onCommentsChange) {
        onCommentsChange(updatedComments);
      }
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 16,
          }}
        >
          <ThemedText type="defaultSemiBold" style={{ fontSize: 18, color: theme.text }}>
            Comments
          </ThemedText>
        </View>

        {loading ? (
          <View style={{ padding: 20, alignItems: "center", flex: 1 }}>
            <ThemedText type="subText" style={{ color: theme.text }}>Loading comments...</ThemedText>
          </View>
        ) : comments.length === 0 ? (
          <View style={{ padding: 20, alignItems: "center", flex: 1 }}>
            <ThemedText type="subText" style={{ color: theme.text }}>No comments yet</ThemedText>
          </View>
        ) : (
          <BottomSheetFlatList<CommentResponseDto>
            data={comments}
            keyExtractor={(item: CommentResponseDto) => item.id}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={({ item: commentItem }: { item: CommentResponseDto }) => {
              const replies =
                commentReplies[commentItem.id] || commentItem.replies || [];
              const isShowingReplies = showReplies[commentItem.id] || false;
              const hasReplies =
                commentItem.repliesCount > 0 ||
                (commentItem.replies && commentItem.replies.length > 0) ||
                replies.length > 0;
              const repliesCount =
                commentItem.repliesCount || replies.length || 0;

              return (
                <View>
                  <CommentItem
                    comment={commentItem}
                    commentLikes={commentLikes}
                    onLike={handleCommentLike}
                    onReply={() => {
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
                    onToggleReplies={toggleShowReplies}
                    showReplies={isShowingReplies}
                    hasReplies={hasReplies}
                    repliesCount={repliesCount}
                  />

                  {/* Replies */}
                  {isShowingReplies && (
                    <RepliesList
                      replies={replies}
                      commentLikes={commentLikes}
                      onLike={handleCommentLike}
                      isLoading={loadingReplies[commentItem.id] || false}
                    />
                  )}

                  {/* Reply input */}
                  {showReplyInput[commentItem.id] && (
                    <ReplyInput
                      replyText={replyInputs[commentItem.id] || ""}
                      setReplyText={(text) =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [commentItem.id]: text,
                        }))
                      }
                      onSubmit={() => handleReply(commentItem.id)}
                      isSubmitting={isSubmittingReply[commentItem.id] || false}
                    />
                  )}
                </View>
              );
            }}
          />
        )}

        {/* Comment input */}
        <CommentInput
          comment={comment}
          setComment={setComment}
          onSubmit={handleSubmitComment}
          isSubmitting={isSubmittingComment}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
}
