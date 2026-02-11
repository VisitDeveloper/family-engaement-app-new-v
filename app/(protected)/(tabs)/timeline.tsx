import RoleGuard from "@/components/check-permisions";
import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import TimelineItem from "@/components/reptitive-component/timeline-item";
import { ThemedText } from "@/components/themed-text";
import { EventIcon } from "@/components/ui/icons/event-icons";
import { MediaIcon } from "@/components/ui/icons/messages-icons";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { likeService } from "@/services/like.service";
import { PostResponseDto, postService } from "@/services/post.service";
import { saveService } from "@/services/save.service";
import { useStore } from "@/store";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TimelineScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useStore((state) => state.theme);
  const user = useStore((state) => state.user);

  const styles = useThemedStyles(
    (theme) =>
    ({
      container: {
        flex: 1,
        backgroundColor: theme.bg,
        paddingHorizontal: 0,
        paddingVertical: 10,
      },
      // tabs: {
      //   flexDirection: 'row',
      //   paddingVertical: 10,
      //   borderBottomWidth: 1,
      //   borderColor: theme.border,
      // },
      // tab: {
      //   paddingHorizontal: 12,
      //   paddingVertical: 6,
      //   borderRadius: 10,
      //   backgroundColor: theme.bg,
      //   height: 30,
      // },
      // tabs: {
      //   flexDirection: 'row',
      //   borderBottomWidth: 1,
      //   borderColor: theme.border,
      //   alignItems: 'center',
      //   paddingVertical: 10,
      //   // height: 50,
      // },
      // tab: {
      //   paddingHorizontal: 12,
      //   // Remove paddingVertical
      //   borderRadius: 10,
      //   backgroundColor: theme.bg,
      //   height: 30, // Fixed height for each tab
      //   justifyContent: 'center', // Center text vertically in tab
      //   marginHorizontal: 4,
      // },
      tabs: {
        borderBottomWidth: 1,
        borderColor: theme.border,
        paddingVertical: 5,
      },
      tab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: theme.bg,
        marginHorizontal: 4,
        justifyContent: "center",
      },

      tabActive: {
        backgroundColor: theme.tint,
      },
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

      createElement: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        justifyContent: "space-between",
        backgroundColor: theme.bg,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.border,
        elevation: 2,
        marginTop: 20,
      },
      avatarcreate: {
        width: 28,
        height: 28,
        borderRadius: 20, // Make image circular
        borderColor: theme.border,
        borderWidth: 1,
      },
      inputContainer: {
        flex: 1,
        backgroundColor: theme.panel,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
        justifyContent: "center",
        marginHorizontal: 10,
      },
      textInput: {
        fontSize: 15,
        color: "#1c1e21",
        padding: 0, // Remove default padding on some platforms
      },
      icon: {
        marginLeft: 4,
      },
    } as const)
  );
  const tabsData = useMemo(
    () => [
      { labelKey: "tabs.timelineAllPosts", filter: "all" as const },
      { labelKey: "tabs.timelineMedia", filter: "media" as const },
      { labelKey: "tabs.timelineRecommended", filter: "recommended" as const },
      { labelKey: "tabs.timelineSaved", filter: "saved" as const },
    ],
    []
  );
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState<PostResponseDto[]>([]);
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

  // Fetch posts from API
  const fetchPosts = useCallback(
    async (filter?: "all" | "media" | "reports" | "recommended" | "saved") => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: 1,
          limit: 50,
          filter: filter || "all",
        };

        const response = await postService.getAll(params);

        setPosts(response.posts);
      } catch (err: any) {
        const errorMessage =
          err.message || t("common.error");
        setError(errorMessage);
        Alert.alert(t("common.error"), errorMessage);
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Refresh posts when screen comes into focus (e.g., after creating a post)
  useFocusEffect(
    useCallback(() => {
      fetchPosts(tabsData[activeTab].filter);
    }, [fetchPosts, activeTab, tabsData])
  );

  // Handle tab change
  const handleTabChange = (index: number) => {
    setActiveTab(index);
    const filter = tabsData[index].filter;
    fetchPosts(filter);
  };

  const renderItem = ({ item, index }: any) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === index && styles.tabActive]}
      onPress={() => handleTabChange(index)}
    >
      <ThemedText
        type="subText"
        style={{ color: activeTab === index ? "#fff" : theme.text }}
      >
        {t(item.labelKey)}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={{ paddingHorizontal: 10 }}>
        <HeaderTabItem
          title={t("tabs.timelineTitle", { name: user?.firstName || "" })}
          subTitle={t("tabs.timelineSubTitle")}
          buttonIcon={<EventIcon size={16} color={theme.tint} />}
          buttonLink="/event"
          buttonTitle={t("event.schoolCalendar")}
          buttonRoles={["admin", "teacher", "parent"]}
        />
      </View>

      <View style={styles.tabs}>
        <FlatList
          data={tabsData}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 5, paddingVertical: 5 }}
        />
      </View>

      <View
        style={{
          paddingHorizontal: 10,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          flex: 1,
        }}
      >
        <RoleGuard roles={["teacher", "admin"]}>
          <TouchableOpacity
            onPress={() => router.push("/create-or-edit-post")}
            style={{ marginTop: -5 }}
          >
            <View style={styles.createElement}>
              <Image
                source={
                  user?.profilePicture
                    ? { uri: user.profilePicture }
                    : { uri: "" }
                }
                style={styles.avatarcreate}
              />

              {/* Text input area */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t("placeholders.writeNewPost")}
                  placeholderTextColor="#8E8E93"
                  multiline={false}
                  editable={false}
                  onPress={() => router.push("/create-or-edit-post")}
                />
              </View>

              {/* Gallery icon */}
              <TouchableOpacity onPress={() => router.push("/create-or-edit-post")}>
                <MediaIcon
                  size={20}
                  color="#8E8E93"
                // style={styles.icon}
                />
              </TouchableOpacity>
            </View>
            {/* User avatar */}
          </TouchableOpacity>
        </RoleGuard>

        {loading && posts.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={theme.tint} />
            <ThemedText type="subText" style={{ marginTop: 10 }}>
              Loading posts...
            </ThemedText>
          </View>
        ) : error ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <ThemedText
              type="default"
              style={{
                color: "#ff4444",
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              {error}
            </ThemedText>
            <TouchableOpacity
              onPress={() => fetchPosts(tabsData[activeTab].filter)}
              style={{
                backgroundColor: theme.tint,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <ThemedText style={{ color: "#fff" }}>{t("buttons.retry")}</ThemedText>
            </TouchableOpacity>
          </View>
        ) : posts.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <ThemedText type="subText" style={{ textAlign: "center" }}>
              No posts found
            </ThemedText>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={loading && posts.length > 0}
                  onRefresh={() => fetchPosts(tabsData[activeTab].filter)}
                  tintColor={theme.tint}
                />
              }
            >
              {posts.map((post) => {
                const authorName =
                  post.author.firstName && post.author.lastName
                    ? `${post.author.firstName} ${post.author.lastName}`
                    : post.author.firstName ||
                    post.author.lastName ||
                    post.author.email ||
                    "Unknown";

                return (
                  <TimelineItem
                    key={post.id}
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
                    showCommentInput={false}
                    onLike={async () => {
                      try {
                        // Optimistic update - toggle like state locally
                        setPosts((prevPosts) =>
                          prevPosts.map((p) =>
                            p.id === post.id
                              ? {
                                ...p,
                                isLiked: !p.isLiked,
                                likesCount: p.isLiked
                                  ? p.likesCount - 1
                                  : p.likesCount + 1,
                              }
                              : p
                          )
                        );
                        await likeService.likePost(post.id);
                      } catch (error) {
                        // Revert on error
                        setPosts((prevPosts) =>
                          prevPosts.map((p) =>
                            p.id === post.id
                              ? {
                                ...p,
                                isLiked: post.isLiked,
                                likesCount: post.likesCount,
                              }
                              : p
                          )
                        );
                        console.error("Error toggling like:", error);
                      }
                    }}
                    onSave={async () => {
                      try {
                        // Optimistic update - toggle save state locally
                        setPosts((prevPosts) =>
                          prevPosts.map((p) =>
                            p.id === post.id
                              ? {
                                ...p,
                                isSaved: !p.isSaved,
                              }
                              : p
                          )
                        );
                        await saveService.savePost(post.id);
                      } catch (error) {
                        // Revert on error
                        setPosts((prevPosts) =>
                          prevPosts.map((p) =>
                            p.id === post.id
                              ? {
                                ...p,
                                isSaved: post.isSaved,
                              }
                              : p
                          )
                        );
                        console.error("Error toggling save:", error);
                      }
                    }}
                    onCommentAdded={async () => {
                      // Only update comment count, don't refetch entire list
                      setPosts((prevPosts) =>
                        prevPosts.map((p) =>
                          p.id === post.id
                            ? {
                              ...p,
                              commentsCount: (p.commentsCount || 0) + 1,
                            }
                            : p
                        )
                      );
                    }}
                    onEdit={() => {
                      router.push({
                        pathname: "/create-or-edit-post",
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
                        Alert.alert(t("common.success"), t("timeline.postDeletedSuccess"));
                        fetchPosts(tabsData[activeTab].filter);
                      } catch (error: any) {
                        Alert.alert(t("common.error"), error.message || t("timeline.failedDeletePost"));
                        console.error("Error deleting post:", error);
                      }
                    }}
                  />
                );
              })}
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </View>
    </View>
  );
};

export default TimelineScreen;
