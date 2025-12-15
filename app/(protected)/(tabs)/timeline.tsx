import RoleGuard from "@/components/check-permisions";
import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import TimelineItem from "@/components/reptitive-component/timeline-item";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { likeService } from "@/services/like.service";
import { PostResponseDto, postService } from "@/services/post.service";
import { saveService } from "@/services/save.service";
import { useStore } from "@/store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TimelineScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useStore((state) => state.theme);
  const user = useStore((state) => state.user);

  const styles = useThemedStyles(
    (theme) =>
      ({
        container: { flex: 1, backgroundColor: theme.bg, padding: 10 },
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
        //   // paddingVertical را حذف کنید
        //   borderRadius: 10,
        //   backgroundColor: theme.bg,
        //   height: 30, // ارتفاع ثابت برای هر تب
        //   justifyContent: 'center', // متن را در مرکز عمودی تب قرار دهید
        //   marginHorizontal: 4,
        // },
        tabs: {
          borderBottomWidth: 1,
          borderColor: theme.border,
          paddingVertical: 10,
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
          backgroundColor: "#ffffff",
          paddingVertical: 10,
          paddingHorizontal: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.border,
          elevation: 2,
          marginTop: 20,
        },
        avatarcreate: {
          width: 40,
          height: 40,
          borderRadius: 20, // دایره‌ای کردن تصویر
          marginRight: 12,
          borderColor: theme.border,
          borderWidth: 1,
        },
        inputContainer: {
          flex: 1,
          backgroundColor: theme.panel,
          borderRadius: 10,
          paddingHorizontal: 16,
          paddingVertical: 8,
          marginRight: 12,
          justifyContent: "center",
          marginHorizontal: 10,
        },
        textInput: {
          fontSize: 15,
          color: "#1c1e21",
          padding: 0, // حذف پدینگ پیش‌فرض در برخی پلتفرم‌ها
        },
        icon: {
          marginLeft: 4,
        },
      } as const)
  );
  const tabsData = [
    { label: "All Posts", filter: "all" as const },
    { label: "Media", filter: "media" as const },
    { label: "Reports", filter: "reports" as const },
    { label: "Highlights", filter: "recommended" as const },
    { label: "Saved", filter: "saved" as const },
  ];
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

        let response;
        if (filter === "saved") {
          response = await postService.getSavedPosts(params);
        } else {
          response = await postService.getAll(params);
        }

        setPosts(response.posts);
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to load posts. Please try again.";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {item.label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <HeaderTabItem
        title="Sarah’s Timeline"
        subTitle="Learning journey & memories"
        buttonIcon={<Feather name="calendar" size={16} color={theme.tint} />}
        buttonLink="/event"
        buttonTtitle="Events"
      />

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

      <RoleGuard roles={["teacher"]}>
        <Link href="/create-post" style={{ marginTop: 10 }}>
          <View style={styles.createElement}>
            <Image
              source={
                user?.profilePicture
                  ? { uri: user.profilePicture }
                  : { uri: "" }
              }
              style={styles.avatarcreate}
            />

            {/* ناحیه ورودی متن */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Write a new post ..."
                placeholderTextColor="#8E8E93"
                // value={inputText}
                // onChangeText={setInputText}
                multiline={false}
                editable={false}
              />
            </View>

            {/* آیکون گالری */}
            <TouchableOpacity onPress={() => console.log("Open Gallery")}>
              <Ionicons
                name="image-outline"
                size={26}
                color="#8E8E93"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
          {/* آواتار کاربر */}
        </Link>
      </RoleGuard>

      {loading ? (
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
            style={{ color: "#ff4444", textAlign: "center", marginBottom: 10 }}
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
            <ThemedText style={{ color: "#fff" }}>Retry</ThemedText>
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
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
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
                lastComment={post.lastComment || undefined}
                onLike={async () => {
                  try {
                    await likeService.likePost(post.id);
                    fetchPosts(tabsData[activeTab].filter);
                  } catch (error) {
                    console.error("Error toggling like:", error);
                  }
                }}
                onSave={async () => {
                  try {
                    await saveService.savePost(post.id);
                    fetchPosts(tabsData[activeTab].filter);
                  } catch (error) {
                    console.error("Error toggling save:", error);
                  }
                }}
              />
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

export default TimelineScreen;
