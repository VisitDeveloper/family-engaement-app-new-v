import { useThemedStyles } from "@/hooks/use-theme-style";
import {
  CommentResponseDto,
  commentService,
  type AuthorResponseDto,
} from "@/services/comment.service";
import { likeService } from "@/services/like.service";
import { useStore } from "@/store";
import { formatTimeAgoShort } from "@/utils/format-time-ago";
import { AntDesign, EvilIcons, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  Share,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
import CommentsBottomSheet from "../ui/comments-bottom-sheet";
export interface ResourceItemProps {
  postId?: string;
  name: string;
  author?: AuthorResponseDto;
  seen?: string;
  desc: string;
  numberOfLike: number;
  numberOfComment: number;
  commenter?: string;
  comment?: string;
  images?: string[];
  files?: string[];
  tags?: string[];
  recommended?: boolean;
  showCommentInput?: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  styles?: any;
  onPress?: (i: any) => void;
  onLike?: () => void;
  onSave?: () => void;
  onCommentAdded?: () => void;
  comments?: CommentResponseDto[];
  hasMoreComments?: boolean;
  lastComment?: CommentResponseDto; // For backward compatibility
  setComment?: (text: string) => void;
  showAllCommentsByDefault?: boolean; // Show all comments by default (for detail pages)
  onEdit?: () => void; // Callback for edit action
  onDelete?: () => void; // Callback for delete action
}

export default function TimelineItem({
  showCommentInput = true,
  ...props
}: ResourceItemProps) {
  const theme = useStore((state) => state.theme);
  const user = useStore((state) => state.user);
  const router = useRouter();

  // Check if current user is the author and is a teacher or admin
  const isAuthor = user?.id === props.author?.id;
  const canEditDelete =
    isAuthor && (user?.role === "teacher" || user?.role === "admin");
  const [showDropdown, setShowDropdown] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showAllComments, setShowAllComments] = useState(
    props.showAllCommentsByDefault || false
  );
  const [expandedComments, setExpandedComments] = useState<
    CommentResponseDto[]
  >([]);
  const [loadingComments, setLoadingComments] = useState(false);
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
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [commentIdToReply, setCommentIdToReply] = useState<string | null>(null);

  // Number of comments to show initially
  const INITIAL_COMMENTS_TO_SHOW = 2;

  // Keep comments open if showAllCommentsByDefault is true
  useEffect(() => {
    if (props.showAllCommentsByDefault && !showAllComments) {
      setShowAllComments(true);
    }
  }, [props.showAllCommentsByDefault, showAllComments]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (showDropdown) {
      const timeout = setTimeout(() => {
        // This will be handled by Pressable onPress
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [showDropdown]);

  // Local state for comments to sync with bottom sheet
  const [localComments, setLocalComments] = useState<CommentResponseDto[]>([]);

  // Handle backward compatibility: convert lastComment to comments array if needed
  const displayComments = useMemo(() => {
    // Use local comments if available (synced from bottom sheet), otherwise use props
    if (localComments.length > 0) {
      return localComments;
    }
    if (props.comments && props.comments.length > 0) {
      return props.comments;
    }
    // Fallback to lastComment for backward compatibility
    if (props.lastComment) {
      return [props.lastComment];
    }
    return [];
  }, [localComments, props.comments, props.lastComment]);

  // Initialize local comments from props when they change
  // Use ref to prevent infinite loops
  const prevCommentsRef = React.useRef<string>("");
  useEffect(() => {
    const commentsKey =
      props.comments
        ?.map((c) => `${c.id}-${c.likesCount}-${c.isLiked}`)
        .join(",") || "";
    const lastCommentKey = props.lastComment
      ? `${props.lastComment.id}-${props.lastComment.likesCount}-${props.lastComment.isLiked}`
      : "";
    const currentKey = commentsKey || lastCommentKey;

    // Only update if props actually changed
    if (prevCommentsRef.current !== currentKey) {
      prevCommentsRef.current = currentKey;
      if (props.comments && props.comments.length > 0) {
        setLocalComments(props.comments);
      } else if (props.lastComment) {
        setLocalComments([props.lastComment]);
      } else {
        setLocalComments([]);
      }
    }
  }, [props.comments, props.lastComment]);

  // Initialize comment likes state from props
  React.useEffect(() => {
    const likesState: Record<string, { isLiked: boolean; likesCount: number }> =
      {};
    displayComments.forEach((comment) => {
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
  }, [displayComments]);

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

    // Fetch replies if showing for the first time and we don't have them
    if (newState && !commentReplies[commentId]) {
      // Check if the comment has replies in displayComments
      const comment = displayComments.find((c) => c.id === commentId);
      if (comment && comment.replies && comment.replies.length > 0) {
        // Use existing replies
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
        // Fetch from server
        fetchReplies(commentId);
      }
    }
  };

  // Handle reply submission
  const handleReply = async (commentId: string) => {
    const replyText = replyInputs[commentId]?.trim();
    if (!replyText || !props.postId) return;

    try {
      setIsSubmittingReply((prev) => ({ ...prev, [commentId]: true }));
      const newReply = await commentService.replyToComment(commentId, {
        content: replyText,
      });

      // Clear input and hide input
      setReplyInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[commentId];
        return newInputs;
      });
      setShowReplyInput((prev) => ({
        ...prev,
        [commentId]: false,
      }));

      // Add reply to state
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

      // Update local comments to sync repliesCount
      setLocalComments((prevComments) =>
        prevComments.map((c) =>
          c.id === commentId
            ? { ...c, repliesCount: (c.repliesCount || 0) + 1 }
            : c
        )
      );

      // Show replies if not already shown
      if (!showReplies[commentId]) {
        setShowReplies((prev) => ({ ...prev, [commentId]: true }));
      }

      // Refresh comments
      if (props.onCommentAdded) {
        props.onCommentAdded();
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
    let comment =
      displayComments.find((c) => c.id === commentId) ||
      expandedComments.find((c) => c.id === commentId);

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

      // Update replies if they are loaded (for both main comments and replies)
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
      // Update local comments state to sync with bottom sheet
      setLocalComments((prevComments) =>
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
      // Don't call onCommentAdded - we only update local state
      // Optimistic update is already done via setCommentLikes
    } catch (err: any) {
      // Revert on error - revert both commentLikes and commentReplies
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: currentState,
      }));
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

  // Helper function to format image URL
  const formatImageUrl = (url: string | undefined | null): string | null => {
    if (!url || url.trim() === "") return null;

    // If URL is already absolute (starts with http:// or https://), return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // If URL is relative, prepend base URL
    // Note: Adjust this based on your API base URL
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3006";
    return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  };

  // Helper function to format file URL
  const formatFileUrl = (url: string | undefined | null): string | null => {
    if (!url || url.trim() === "") return null;

    // If URL is already absolute (starts with http:// or https://), return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // If URL is relative, prepend base URL
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3006";
    return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  };

  // Helper function to get file name from URL
  const getFileName = (url: string): string => {
    if (!url) return "File";
    const fileName = url.split("/").pop() || "File";
    return decodeURIComponent(fileName);
  };

  // Helper function to get file extension
  const getFileExtension = (url: string): string => {
    if (!url) return "";
    const fileName = url.split("/").pop() || "";
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
  };

  // Handle file press
  const handleFilePress = async (fileUrl: string) => {
    const formattedUrl = formatFileUrl(fileUrl);
    if (formattedUrl) {
      try {
        const canOpen = await Linking.canOpenURL(formattedUrl);
        if (canOpen) {
          await Linking.openURL(formattedUrl);
        } else {
          Alert.alert("Error", "Cannot open this file");
        }
      } catch (error) {
        console.error("Error opening file:", error);
        Alert.alert("Error", "Failed to open file");
      }
    }
  };

  // Handle share
  const handleShare = async () => {
    try {
      const shareMessage = `${props.name} shared:\n\n${props.desc}\n\n${props.tags && props.tags.length > 0 ? `Tags: ${props.tags.join(", ")}\n` : ""}${props.postId ? `\nView post in app` : ""}`;
      
      const result = await Share.share({
        message: shareMessage,
        title: `Post by ${props.name}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          console.log("Shared with activity type:", result.activityType);
        } else {
          // Shared
          console.log("Post shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log("Share dismissed");
      }
    } catch (error: any) {
      console.error("Error sharing post:", error);
      Alert.alert("Error", error.message || "Failed to share post");
    }
  };

  const styles = useThemedStyles(
    (theme) =>
      ({
        postCard: {
          backgroundColor: theme.bg,
          borderRadius: 10,
          padding: 15,
          marginTop: 15,
          borderWidth: 1,
          borderColor: theme.border,
        },
        postHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 10,
        },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.panel,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 10,
          borderColor: theme.border,
          borderWidth: 1,
        },
        badge: {
          marginLeft: "auto",
          backgroundColor: theme.star,
          borderRadius: 50,
          paddingHorizontal: 5,
          paddingVertical: 5,
        },
        postImage: {
          width: "100%",
          height: 180,
          borderRadius: 8,
          marginTop: 10,
        },
        filesContainer: {
          marginTop: 10,
          gap: 8,
        },
        fileItem: {
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          borderRadius: 8,
          backgroundColor: theme.panel,
          borderWidth: 1,
          borderColor: theme.border,
        },
        fileIcon: {
          marginRight: 10,
        },
        fileInfo: {
          flex: 1,
        },
        fileName: {
          fontSize: 14,
          fontWeight: "500",
          color: theme.text,
        },
        tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 8 },
        tag: {
          paddingHorizontal: 10,
          paddingVertical: 2,
          borderRadius: 6,
          backgroundColor: theme.panel,
        },
        actions: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          marginTop: 10,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: theme.border,
          paddingVertical: 5,
        },
        actionButtons: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 10,
        },
        ationItem: { flexDirection: "row", alignItems: "center" },
        comments: { marginTop: 10 },
        commentRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          marginTop: 5,
        },
        commentInput: {
          flex: 1,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginLeft: 8,
          color: theme.text,
          height: 40,
          backgroundColor: theme.panel,
        },
        replyContainer: {
          marginLeft: 16,
          marginTop: 8,
          paddingLeft: 12,
        },
        replyItem: {
          flexDirection: "row",
          marginTop: 6,
        },
        replyInputContainer: {
          marginLeft: 8,
          marginTop: 8,
          paddingLeft: 8,
        },
        replyButton: {
          marginLeft: 8,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        generalmargin: {},
        dropdownContainer: {
          position: "relative",
        },
        dropdownMenu: {
          position: "absolute",
          top: 30,
          right: 0,
          backgroundColor: theme.bg,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.border,
          paddingVertical: 4,
          minWidth: 120,
          zIndex: 1000,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        },
        dropdownItem: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 8,
        },
      } as const)
  );

  return (
    <>
      <ThemedView style={styles.postCard}>
        <View style={styles.postHeader}>
          {props.author && props.author.profilePicture ? (
            <Image
              source={{ uri: props.author?.profilePicture || "" }}
              style={styles.avatar}
              accessibilityRole="image"
              accessibilityLabel={`${props.name}'s profile picture`}
            />
          ) : (
            <View style={styles.avatar}>
              <ThemedText type="subText" style={{ color: theme.subText }}>
                {props.author?.firstName?.charAt(0) +
                  " " +
                  props.author?.lastName?.charAt(0).trim().toUpperCase() ||
                  props.author?.email?.charAt(0)}
              </ThemedText>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={{ color: theme.text }}>
              {props.name}
            </ThemedText>
            <ThemedText type="subLittleText" style={{ color: theme.subText }}>
              {props.seen}
            </ThemedText>
          </View>

          {canEditDelete && (
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                accessibilityRole="button"
                accessibilityLabel="Post options"
                accessibilityHint="Double tap to open menu with edit and delete options"
                accessibilityState={{ expanded: showDropdown }}
                style={{
                  padding: 6,
                }}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={20}
                  color={theme.text}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                />
              </TouchableOpacity>
              {showDropdown && (
                <Pressable
                  onPress={(e) => e.stopPropagation()}
                  style={styles.dropdownMenu}
                >
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShowDropdown(false);
                      if (props.onEdit) {
                        props.onEdit();
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Edit post"
                    accessibilityHint="Double tap to edit this post"
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={theme.text}
                      accessibilityElementsHidden={true}
                      importantForAccessibility="no"
                    />
                    <ThemedText type="subText" style={{ color: theme.text }}>
                      Edit
                    </ThemedText>
                  </TouchableOpacity>
                  <View
                    style={{
                      height: 1,
                      backgroundColor: theme.border,
                      marginVertical: 4,
                    }}
                  />
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShowDropdown(false);
                      Alert.alert(
                        "Delete Post",
                        "Are you sure you want to delete this post? This action cannot be undone.",
                        [
                          {
                            text: "Cancel",
                            style: "cancel",
                          },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => {
                              if (props.onDelete) {
                                props.onDelete();
                              }
                            },
                          },
                        ]
                      );
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Delete post"
                    accessibilityHint="Double tap to delete this post. This action cannot be undone."
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#ff4444"
                      accessibilityElementsHidden={true}
                      importantForAccessibility="no"
                    />
                    <ThemedText type="subText" style={{ color: "#ff4444" }}>
                      Delete
                    </ThemedText>
                  </TouchableOpacity>
                </Pressable>
              )}
            </View>
          )}
        </View>

        <ThemedText type="subText" style={{ color: theme.text }}>
          {props.desc}
        </ThemedText>

        {/* Tags */}
        {props.tags && props.tags.length > 0 && (
          <View style={styles.tags}>
            {props.recommended && (
              <ThemedView
                style={{ ...styles.tag, backgroundColor: theme.star }}
              >
                <ThemedText
                  type="subText"
                  style={{ fontWeight: "600", color: "#fff", fontSize: 10 }}
                >
                  Recommended
                </ThemedText>
              </ThemedView>
            )}
            {props.tags.map((tag, idx) => (
              <ThemedView key={idx} style={styles.tag}>
                <ThemedText
                  type="subText"
                  style={{ fontWeight: "600", color: theme.text, fontSize: 10 }}
                >
                  {tag}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        )}

        {/* Post Image */}
        {(() => {
          const imageUrl = formatImageUrl(props.images?.[0]);
          return imageUrl ? (
            <View>
              <Image
                source={{ uri: imageUrl }}
                style={styles.postImage}
                accessibilityRole="image"
                accessibilityLabel={`Image attached to post by ${props.name}`}
                // contentFit="cover"
                // transition={200}
                onError={(error) => {
                  console.log("Image load error:", error);
                  console.log("Image URL:", imageUrl);
                }}
                onLoad={() => {
                  console.log("Image loaded successfully:", imageUrl);
                }}
              />
            </View>
          ) : null;
        })()}

        {/* Files */}
        {props.files && props.files.length > 0 && (
          <View style={styles.filesContainer}>
            {props.files.map((fileUrl, index) => {
              const fileName = getFileName(fileUrl);
              const fileExtension = getFileExtension(fileUrl);

              // Choose icon based on file extension
              const getFileIcon = () => {
                switch (fileExtension) {
                  case "pdf":
                    return "document-text";
                  case "doc":
                  case "docx":
                    return "document";
                  case "xls":
                  case "xlsx":
                    return "document";
                  case "ppt":
                  case "pptx":
                    return "document";
                  case "zip":
                  case "rar":
                    return "archive";
                  case "mp3":
                  case "wav":
                  case "m4a":
                    return "musical-notes";
                  case "mp4":
                  case "mov":
                  case "avi":
                    return "videocam";
                  default:
                    return "document-attach";
                }
              };

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.fileItem}
                  onPress={() => handleFilePress(fileUrl)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Download file: ${fileName}`}
                  accessibilityHint="Double tap to download this file"
                >
                  <Ionicons
                    name={getFileIcon() as any}
                    size={24}
                    color={theme.tint}
                    style={styles.fileIcon}
                    accessibilityElementsHidden={true}
                    importantForAccessibility="no"
                  />
                  <View style={styles.fileInfo}>
                    <ThemedText
                      type="subText"
                      style={[
                        styles.fileName,
                        {
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          fontSize: 12,
                        },
                      ]}
                    >
                      {fileName.length > 30
                        ? fileName.substring(0, 30) + "..."
                        : fileName}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color={theme.subText}
                    accessibilityElementsHidden={true}
                    importantForAccessibility="no"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.ationItem}
              onPress={props.onLike}
              accessibilityRole="button"
              accessibilityLabel={props.isLiked ? "Unlike post" : "Like post"}
              accessibilityHint={`${props.numberOfLike} likes. Double tap to ${
                props.isLiked ? "unlike" : "like"
              } this post`}
              accessibilityState={{ selected: props.isLiked }}
            >
              <EvilIcons
                name={props.isLiked ? "heart" : "heart"}
                size={22}
                color={props.isLiked ? theme.tint : theme.text}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              />
              <ThemedText
                type="subText"
                style={[
                  styles.generalmargin,
                  { color: props.isLiked ? theme.tint : theme.text },
                ]}
              >
                {props.numberOfLike}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ationItem}
              onPress={(e) => {
                e.stopPropagation();
                console.log("Comment button pressed, postId:", props.postId);
                if (props.postId) {
                  console.log("Opening comments sheet");
                  setShowCommentsSheet(true);
                } else {
                  console.log("No postId available");
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`${props.numberOfComment} comments`}
              accessibilityHint="Double tap to view comments"
            >
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={theme.text}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              />
              <ThemedText
                type="subText"
                style={[{ marginLeft: 4 }, { color: theme.text }]}
              >
                {props.numberOfComment}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ationItem}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share post"
              accessibilityHint="Double tap to share this post"
            >
              <Ionicons
                name="return-up-forward-outline"
                size={18}
                color={theme.text}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={props.onSave}
            accessibilityRole="button"
            accessibilityLabel={
              props.isSaved ? "Remove from saved" : "Save post"
            }
            accessibilityHint={`Double tap to ${
              props.isSaved ? "unsave" : "save"
            } this post`}
            accessibilityState={{ selected: props.isSaved }}
          >
            <Ionicons
              name={props.isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={props.isSaved ? theme.tint : theme.text}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            />
          </TouchableOpacity>
        </View>

        {/* Comments */}
        <TouchableOpacity
          onPress={() => setShowCommentsSheet(true)}
          style={styles.comments}
        >
          {displayComments.length > 0 && (
            <>
              {(showAllComments
                ? displayComments
                : displayComments.slice(0, INITIAL_COMMENTS_TO_SHOW)
              ).map((commentItem) => {
                // Use fetched replies if available, otherwise use replies from commentItem
                const replies =
                  commentReplies[commentItem.id] || commentItem.replies || [];
                const isShowingReplies = showReplies[commentItem.id] || false;
                const hasReplies =
                  commentItem.repliesCount > 0 ||
                  (commentItem.replies && commentItem.replies.length > 0) ||
                  replies.length > 0;

                return (
                  <View key={commentItem.id}>
                    <View style={{ ...styles.commentRow, flexWrap: "wrap" }}>
                      {commentItem?.author?.profilePicture ? (
                        <Image
                          source={{ uri: commentItem?.author?.profilePicture }}
                          style={{
                            ...styles.avatar,
                            width: 24,
                            height: 24,
                            marginRight: 0,
                          }}
                          accessibilityRole="image"
                          accessibilityLabel={`${
                            commentItem.author.firstName ||
                            commentItem.author.email
                          }'s profile picture`}
                        />
                      ) : (
                        <Ionicons
                          name="person-circle"
                          size={24}
                          color={theme.subText}
                        />
                      )}
                      <View
                        style={{
                          flex: 1,
                          marginLeft: 8,
                          alignItems: "flex-start",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "baseline",
                              justifyContent: "flex-start",
                              gap: 4,
                            }}
                          >
                            <ThemedText
                              type="defaultSemiBold"
                              style={{
                                color: theme.text,
                                fontSize: 12,
                              }}
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
                              style={{ fontSize: 9, color: theme.subText }}
                            >
                              {formatTimeAgoShort(commentItem.createdAt)}
                            </ThemedText>
                          </View>
                        </View>

                        <View
                          style={{
                            justifyContent: "space-between",
                            flexDirection: "row",
                            alignItems: "flex-start",
                            flex: 1,
                            width: "100%",
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <ThemedText
                              type="subText"
                              style={[
                                styles.generalmargin,
                                { color: theme.text },
                              ]}
                            >
                              {commentItem.content}
                            </ThemedText>
                          </View>
                          <View style={{ paddingTop: 4 }}>
                            <TouchableOpacity
                              style={{
                                paddingTop: 2,
                                paddingHorizontal: 4,
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onPress={() => handleCommentLike(commentItem.id)}
                            >
                              <EvilIcons
                                name={
                                  commentLikes[commentItem.id]?.isLiked ??
                                  commentItem.isLiked
                                    ? "heart"
                                    : ("heart" as any)
                                }
                                size={16}
                                color={
                                  commentLikes[commentItem.id]?.isLiked ??
                                  commentItem.isLiked
                                    ? theme.tint
                                    : theme.subText
                                }
                              />

                              <ThemedText
                                type="subLittleText"
                                style={{
                                  color: theme.subText,
                                  fontSize: 10,
                                  position: "absolute",
                                  bottom: -18,
                                  width: 40,
                                  textAlign: "center",
                                }}
                              >
                                {commentLikes[commentItem.id]?.likesCount ??
                                  commentItem.likesCount ??
                                  0}
                              </ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              if (props.postId) {
                                setCommentIdToReply(commentItem.id);
                                setShowCommentsSheet(true);
                              }
                            }}
                          >
                            <ThemedText
                              type="subLittleText"
                              style={{
                                color: theme.subText,
                                fontSize: 12,
                              }}
                            >
                              Reply
                            </ThemedText>
                          </TouchableOpacity>

                          {/* View replies button */}
                          {hasReplies && (
                            <TouchableOpacity
                              onPress={() => toggleShowReplies(commentItem.id)}
                              style={{ paddingHorizontal: 4 }}
                            >
                              <ThemedText
                                type="subLittleText"
                                style={{ color: theme.subText, fontSize: 12 }}
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
                          <ThemedText
                            type="subLittleText"
                            style={{ color: theme.subText, fontSize: 11 }}
                          >
                            Loading replies...
                          </ThemedText>
                        ) : replies.length > 0 ? (
                          replies.map((reply) => (
                            <View key={reply.id}>
                              <View style={styles.replyItem}>
                                {reply.author.profilePicture ? (
                                  <Image
                                    source={{
                                      uri: reply.author.profilePicture,
                                    }}
                                    style={{
                                      ...styles.avatar,
                                      width: 20,
                                      height: 20,
                                      marginRight: 0,
                                    }}
                                  />
                                ) : (
                                  <Ionicons
                                    name="person-circle"
                                    size={20}
                                    color={theme.subText}
                                  />
                                )}
                                <View
                                  style={{
                                    flex: 1,
                                    marginLeft: 8,
                                    alignItems: "flex-start",
                                  }}
                                >
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "baseline",
                                        justifyContent: "flex-start",
                                        gap: 4,
                                      }}
                                    >
                                      <ThemedText
                                        type="defaultSemiBold"
                                        style={{
                                          color: theme.text,
                                          fontSize: 12,
                                        }}
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
                                        }}
                                      >
                                        {formatTimeAgoShort(reply.createdAt)}
                                      </ThemedText>
                                    </View>
                                  </View>

                                  <View
                                    style={{
                                      justifyContent: "space-between",
                                      flexDirection: "row",
                                      alignItems: "flex-start",
                                      flex: 1,
                                      width: "100%",
                                    }}
                                  >
                                    <View style={{ flex: 1 }}>
                                      <ThemedText
                                        type="subText"
                                        style={[
                                          styles.generalmargin,
                                          {
                                            color: theme.text,
                                            flex: 1,
                                            fontSize: 12,
                                          },
                                        ]}
                                      >
                                        {reply.content}
                                      </ThemedText>
                                    </View>

                                    <View style={{ paddingTop: 4 }}>
                                      <TouchableOpacity
                                        style={{
                                          marginLeft: 8,
                                          paddingHorizontal: 4,
                                        }}
                                        onPress={() =>
                                          handleCommentLike(reply.id)
                                        }
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
                                      </TouchableOpacity>
                                      <ThemedText
                                        type="subLittleText"
                                        style={{
                                          color: theme.subText,
                                          fontSize: 10,
                                          position: "absolute",
                                          bottom: -18,
                                          width: 40,
                                          textAlign: "center",
                                        }}
                                      >
                                        {commentLikes[reply.id]?.likesCount ??
                                          reply.likesCount ??
                                          0}
                                      </ThemedText>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            </View>
                          ))
                        ) : (
                          <ThemedText
                            type="subLittleText"
                            style={{ color: theme.subText, fontSize: 11 }}
                          >
                            No replies yet
                          </ThemedText>
                        )}
                      </View>
                    )}

                    {/* Reply input */}
                    {showReplyInput[commentItem.id] && (
                      <View style={styles.replyInputContainer}>
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
                                  borderRadius: 12,
                                  backgroundColor: theme.panel,
                                  justifyContent: "center",
                                  alignItems: "center",
                                  borderColor: theme.border,
                                  borderWidth: 1,
                                  width: 24,
                                  height: 24,
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
                                { color: theme.text },
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
                              onSubmitEditing={() =>
                                handleReply(commentItem.id)
                              }
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
              })}
              {displayComments.length > INITIAL_COMMENTS_TO_SHOW &&
                !showAllComments && (
                  <View
                    // onPress={() => {
                    // if (props.hasMoreComments && props.postId) {
                    //   // If there are more comments on the server, fetch them
                    //   setLoadingComments(true);
                    //   commentService
                    //     .getPostComments(props.postId, {
                    //       page: 1,
                    //       limit: 100,
                    //       sort: "newest",
                    //     })
                    //     .then((allComments) => {
                    //       setExpandedComments(allComments);
                    //       setShowAllComments(true);
                    //     })
                    //     .catch((err) => {
                    //       console.error("Error fetching comments:", err);
                    //       // Fallback: just show all available comments
                    //       setShowAllComments(true);
                    //     })
                    //     .finally(() => {
                    //       setLoadingComments(false);
                    //     });
                    // } else {
                    //   // Just expand to show all available comments
                    //   setShowAllComments(true);
                    // }
                    // }}
                    style={{ marginTop: 5, paddingVertical: 5 }}
                  >
                    <ThemedText
                      type="subText"
                      style={{ color: theme.subText, fontSize: 12 }}
                    >
                      {loadingComments
                        ? "Loading..."
                        : `View all ${props.numberOfComment} comments`}
                    </ThemedText>
                  </View>
                )}
              {showAllComments && expandedComments.length > 0 && (
                <>
                  {expandedComments
                    .filter(
                      (c) => !displayComments.some((pc) => pc.id === c.id)
                    )
                    .map((commentItem) => (
                      <View key={commentItem.id} style={styles.commentRow}>
                        {commentItem.author.profilePicture ? (
                          <Image
                            source={{ uri: commentItem.author.profilePicture }}
                            style={{
                              ...styles.avatar,
                              width: 24,
                              height: 24,
                              marginRight: 0,
                            }}
                          />
                        ) : (
                          <Ionicons
                            name="person-circle"
                            size={24}
                            color={theme.subText}
                          />
                        )}
                        <View
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <ThemedText
                            type="defaultSemiBold"
                            style={{
                              color: theme.text,
                              paddingLeft: 8,
                              fontSize: 12,
                            }}
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
                            type="subText"
                            style={[
                              styles.generalmargin,
                              { color: theme.text, flex: 1 },
                            ]}
                          >
                            {commentItem.content}
                          </ThemedText>
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginLeft: 8,
                              gap: 4,
                            }}
                            onPress={() => handleCommentLike(commentItem.id)}
                          >
                            <AntDesign
                              name={
                                commentLikes[commentItem.id]?.isLiked ??
                                commentItem.isLiked
                                  ? "heart"
                                  : ("hearto" as any)
                              }
                              size={14}
                              color={
                                commentLikes[commentItem.id]?.isLiked ??
                                commentItem.isLiked
                                  ? theme.tint
                                  : theme.subText
                              }
                            />
                            {((commentLikes[commentItem.id]?.likesCount ??
                              commentItem.likesCount) ||
                              0) > 0 && (
                              <ThemedText
                                type="subLittleText"
                                style={{ color: theme.subText, fontSize: 11 }}
                              >
                                {commentLikes[commentItem.id]?.likesCount ??
                                  commentItem.likesCount ??
                                  0}
                              </ThemedText>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                </>
              )}
              {showAllComments &&
                expandedComments.length === 0 &&
                displayComments.length > INITIAL_COMMENTS_TO_SHOW &&
                !props.showAllCommentsByDefault && (
                  <TouchableOpacity
                    onPress={() => setShowAllComments(false)}
                    style={{ marginTop: 5, paddingVertical: 5 }}
                  >
                    <ThemedText
                      type="subText"
                      style={{ color: theme.subText, fontSize: 12 }}
                    >
                      Show less
                    </ThemedText>
                  </TouchableOpacity>
                )}
            </>
          )}
          {/* Fallback for old commenter/comment props */}
          {displayComments.length === 0 && props.commenter && props.comment && (
            <View style={styles.commentRow}>
              <ThemedText type="defaultSemiBold" style={{ color: theme.text }}>
                {props.commenter}:
              </ThemedText>
              <ThemedText
                type="subText"
                style={[styles.generalmargin, { color: theme.text }]}
              >
                {props.comment}
              </ThemedText>
            </View>
          )}
          {/* Show message when there are no comments */}
          {displayComments.length === 0 && !props.commenter && !props.comment && (
            <View style={{ paddingVertical: 8 }}>
              <ThemedText
                type="subText"
                style={{ color: theme.subText, fontSize: 12, textAlign: "center" }}
              >
                No comments yet. Tap to add a comment.
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </ThemedView>

      {props.postId && (
        <CommentsBottomSheet
          visible={showCommentsSheet}
          onClose={() => {
            setShowCommentsSheet(false);
            setCommentIdToReply(null);
          }}
          postId={props.postId}
          initialComments={displayComments}
          initialCommentIdToReply={commentIdToReply}
          onCommentAdded={async () => {
            // Only notify parent to update comment count, not refetch
            if (props.onCommentAdded) {
              props.onCommentAdded();
            }
            // Comments are already updated in the bottom sheet, no need to refetch
          }}
          onCommentsChange={(updatedComments) => {
            // Sync comments from bottom sheet to local state
            setLocalComments(updatedComments);
          }}
          onReplyAdded={(commentId, newReply) => {
            // Add reply to commentReplies in timeline-item
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

            // Don't update repliesCount here - it's already updated via onCommentsChange
            // This prevents double increment

            // Show replies if not already shown
            if (!showReplies[commentId]) {
              setShowReplies((prev) => ({ ...prev, [commentId]: true }));
            }
          }}
        />
      )}
    </>
  );
}
