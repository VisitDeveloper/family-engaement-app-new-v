import RoleGuard from "@/components/check-permisions";
import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import TimelineItem from "@/components/reptitive-component/timeline-item";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import {
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
    "All Posts",
    "Media",
    "Medias",
    "Reports",
    "Highlights",
    "Saved",
  ];
  const [activeTab, setActiveTab] = useState(0);

  const renderItem = ({ item, index }: any) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === index && styles.tabActive]}
      onPress={() => setActiveTab(index)}
    >
      <ThemedText
        type="subText"
        style={{ color: activeTab === index ? "#fff" : theme.text }}
      >
        {item}
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
                user?.avatar || user?.image
                  ? { uri: user.avatar || user.image }
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

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
      >
        <TimelineItem
          name="Ms. Alvarez"
          seen="2 hours ago"
          desc="Sarah built an amazing tower with 20 blocks today! She showed excellent spatial reasoning and counted each block as she added it. This demonstrates her growing math skills and patience."
          numberOfComment={1}
          numberOfLike={3}
          commenter="Mom"
          commnet="This is wonderful! Thank you for sharing."
          // require('./../../assets/images/partial-react-logo.png')
          image={require("./../../../assets/images/timeline-1.jpg")}
        />

        <TimelineItem
          name="Ms. Alvarez"
          seen="2 hours ago"
          desc="Sarah built an amazing tower with 20 blocks today! She showed excellent spatial reasoning and counted each block as she added it. This demonstrates her growing math skills and patience."
          numberOfComment={1}
          numberOfLike={3}
          commenter="Mom"
          commnet="This is wonderful! Thank you for sharing."
          image={require("./../../../assets/images/timeline-2.jpg")}
        />

        <TimelineItem
          name="Ms. Alvarez"
          seen="2 hours ago"
          desc="Sarah built an amazing tower with 20 blocks today! She showed excellent spatial reasoning and counted each block as she added it. This demonstrates her growing math skills and patience."
          numberOfComment={1}
          numberOfLike={3}
          commenter="Mom"
          commnet="This is wonderful! Thank you for sharing."
          image={require("./../../../assets/images/timeline-3.jpg")}
        />
      </ScrollView>
    </View>
  );
};

export default TimelineScreen;
