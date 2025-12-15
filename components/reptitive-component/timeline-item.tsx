import { useThemedStyles } from "@/hooks/use-theme-style";
import {
    CommentResponseDto,
    commentService,
    type AuthorResponseDto,
} from "@/services/comment.service";
import { useStore } from "@/store";
import { AntDesign, EvilIcons, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
export interface ResourceItemProps {
  postId?: string;
  name: string;
  author?: AuthorResponseDto;
  seen?: string;
  desc: string;
  numberOfLike: number;
  numberOfComment: number;
  commenter?: string;
  commnet?: string;
  images?: string[];
  files?: string[];
  tags?: string[];
  recommended?: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  styles?: any;
  onPress?: (i: any) => void;
  onLike?: () => void;
  onSave?: () => void;
  lastComment?: CommentResponseDto;
  setComment?: (text: string) => void;
}

export default function TimelineItem(props: ResourceItemProps) {
  const theme = useStore((state) => state.theme);
  const user = useStore((state) => state.user);
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Helper function to format image URL
  const formatImageUrl = (url: string | undefined | null): string | null => {
    if (!url || url.trim() === "") return null;
    
    // If URL is already absolute (starts with http:// or https://), return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    
    // If URL is relative, prepend base URL
    // Note: Adjust this based on your API base URL
    const baseUrl = "http://localhost:3006";
    return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
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
        tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 8 },
        tag: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
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
          alignItems: "center",
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
        generalmargin: {
          marginLeft: 5,
        },
      } as const)
  );

  return (
    <TouchableOpacity onPress={() => router.push(`/feed/${props.postId}`)}>
      <ThemedView style={styles.postCard}>
        <View style={styles.postHeader}>
          {props.author && props.author.profilePicture ? (
            <Image
              source={{ uri: props.author?.profilePicture || "" }}
              style={styles.avatar}
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
          <View>
            <ThemedText type="defaultSemiBold" style={{ color: theme.text }}>
              {props.name}
            </ThemedText>
            <ThemedText type="subLittleText" style={{ color: theme.subText }}>
              {props.seen}
            </ThemedText>
          </View>
          {props.recommended && (
            <View style={styles.badge}>
              <AntDesign name="star" size={12} color="#fff" />
            </View>
          )}
        </View>

        <ThemedText type="subText" style={{ color: theme.text }}>
          {props.desc}
        </ThemedText>

        {/* Tags */}
        {props.tags && props.tags.length > 0 && (
          <View style={styles.tags}>
            {props.tags.map((tag, idx) => (
              <ThemedView key={idx} style={styles.tag}>
                <ThemedText
                  type="subText"
                  style={{ fontWeight: "600", color: theme.text }}
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

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.ationItem} onPress={props.onLike}>
              <EvilIcons
                name={props.isLiked ? "heart" : "heart"}
                size={22}
                color={props.isLiked ? theme.tint : theme.text}
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
            <TouchableOpacity style={styles.ationItem}>
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={theme.text}
              />
              <ThemedText
                type="subText"
                style={[styles.generalmargin, { color: theme.text }]}
              >
                {props.numberOfComment}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ationItem}>
              <Ionicons
                name="return-up-forward-outline"
                size={18}
                color={theme.text}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={props.onSave}>
            <Ionicons
              name={props.isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={props.isSaved ? theme.tint : theme.text}
            />
          </TouchableOpacity>
        </View>

        {/* Comments */}
        <View style={styles.comments}>
          {props.lastComment && (
            <View style={styles.commentRow}>
              {props.lastComment.author.profilePicture ? (
                <Image
                  source={{ uri: props.lastComment.author.profilePicture }}
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
              <ThemedText
                type="defaultSemiBold"
                style={{ color: theme.text, paddingLeft: 8, fontSize: 12 }}
              >
                {props.lastComment.author.firstName &&
                props.lastComment.author.lastName
                  ? `${props.lastComment.author.firstName} ${props.lastComment.author.lastName}`
                  : props.lastComment.author.firstName ||
                    props.lastComment.author.lastName ||
                    props.lastComment.author.email ||
                    "Unknown"}
              </ThemedText>
              <ThemedText
                type="subText"
                style={[styles.generalmargin, { color: theme.text }]}
              >
                {props.lastComment.content}
              </ThemedText>
            </View>
          )}
          {/* Fallback for old commenter/commnet props */}
          {!props.lastComment && props.commenter && props.commnet && (
            <View style={styles.commentRow}>
              <ThemedText type="defaultSemiBold" style={{ color: theme.text }}>
                {props.commenter}:
              </ThemedText>
              <ThemedText
                type="subText"
                style={[styles.generalmargin, { color: theme.text }]}
              >
                {props.commnet}
              </ThemedText>
            </View>
          )}
          {props.postId && (
            <View style={styles.commentRow}>
              {user?.profilePicture ? (
                <Image
                  source={{ uri: user?.profilePicture || "" }}
                  style={{
                    borderRadius: 20,
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
                style={[styles.commentInput, { color: theme.text }]}
                value={comment}
                onChangeText={setComment}
                placeholder="Add a comment..."
                placeholderTextColor={theme.subText}
                editable={!isSubmittingComment}
                onSubmitEditing={async () => {
                  if (comment.trim() && props.postId) {
                    setIsSubmittingComment(true);
                    try {
                      await commentService.createComment(props.postId, {
                        content: comment.trim(),
                      });
                      setComment("");
                      // Optionally refresh comments
                    } catch (err: any) {
                      Alert.alert(
                        "Error",
                        err.message || "Failed to post comment"
                      );
                    } finally {
                      setIsSubmittingComment(false);
                    }
                  }
                }}
              />
            </View>
          )}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}
