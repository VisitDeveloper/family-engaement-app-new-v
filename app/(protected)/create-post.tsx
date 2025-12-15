import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import SelectBox, { OptionsList } from "@/components/ui/select-box-modal";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useValidation } from "@/hooks/use-validation";
import { postService } from "@/services/post.service";
import { useStore } from "@/store";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const CreateNewPost = () => {
  const theme = useStore((s) => s.theme);
  const router = useRouter();
  const [message, setMessage] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [textMessages, setTextMessages] = useState<boolean>(false);
  const [lang, setLang] = useState<OptionsList[]>([
    {
      label: "EveryOne",
      value: "e",
    },
  ]);

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, padding: 10, backgroundColor: t.bg },
    containerScrollBox: {
      flex: 1,
      marginTop: 10,
    },

    rateBox: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      backgroundColor: t.bg,
      padding: 10,
      gap: 25,
    },
    cover: {
      width: "100%",
      height: 225,
      borderRadius: 12,
      marginTop: 12,
    },
    chipRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: t.panel,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: t.border,
    },
    titleBox: {
      flexDirection: "column",
      gap: 10,
    },
    desc: { marginTop: 15, lineHeight: 20 },
    readBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.tint,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 6,
      marginTop: 25,
      marginBottom: 80,
    },
    readText: { color: "white", fontWeight: "600" },

    messageBox: {
      flexDirection: "column",
    },
    messageInput: {
      backgroundColor: t.panel,
      borderRadius: 10,
      padding: 5,
      borderWidth: 1,
      borderColor: t.border,
      height: 100,
      textAlignVertical: "top",
      marginBottom: 5,
      color: t.text,
    },
    charCount: { color: theme.subText, textAlign: "right" },

    uploadDataIcons: {
      flexDirection: "row",
      gap: 15,
    },

    tagsBox: {
      flexDirection: "column",
      marginTop: 20,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      marginBottom: 30,
      paddingBottom: 20,
    },

    tagsInput: {
      backgroundColor: t.panel,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      height: 40,
      display: "flex",
      alignItems: "center",
      borderColor: t.border,
      textAlignVertical: "top",
      marginBottom: 5,
      color: t.text,
    },

    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingVertical: 10,
    },
    rowSubtitle: { marginTop: 6, color: t.subText },
    badge: {
      backgroundColor: theme.star,
      borderRadius: 50,
      paddingHorizontal: 5,
      paddingVertical: 5,
    },

    column: {
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingVertical: 10,
    },
  }));

  useEffect(() => {
    console.log("lang", lang);
  }, [lang]);

  const { errors, validate } = useValidation({
    message: { required: true, maxLength: 300, minLength: 2 },
    tags: {
      custom: (value: string) => {
        if (!value) return "please enter at least one tag";
        const invalidTag = value
          .split(",")
          .map((t) => t.trim())
          .find((t) => t.length > 15);
        return invalidTag
          ? `Tag "${invalidTag}" is too long (max 15 chars)`
          : null;
      },
    },
    lang: { required: true },
  });

  const submitData = async () => {
    const isValid = validate({ message, tags, lang });

    if (!isValid) {
      console.log("Validation errors:", errors);
      return;
    }

    try {
      setLoading(true);

      // تبدیل داده‌ها به فرمت API
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // تبدیل visibility: "e" -> "everyone", "s" -> "followers"
      const visibilityValue = lang[0]?.value === "e" ? "everyone" : "followers";

      const postData = {
        description: message,
        tags: tagsArray,
        recommended: textMessages,
        visibility: visibilityValue as "everyone" | "followers" | "private",
      };

      await postService.create(postData);

      Alert.alert("Success", "Post created successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to create post. Please try again.";
      Alert.alert("Error", errorMessage);
      console.error("Error creating post:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderInnerPage title="New Post" />

      <ScrollView
        style={styles.containerScrollBox}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.messageBox}>
          <ThemedText
            type="middleTitle"
            style={{ marginBottom: 10, fontWeight: 500 }}
          >
            Description
          </ThemedText>

          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="What do you want to talk about?"
            placeholderTextColor={theme.subText}
            multiline
          />
          <ThemedText
            type="subText"
            style={styles.charCount}
          >{`${message.length}/300 characters`}</ThemedText>
          {errors.message && (
            <ThemedText type="error">{errors.message}</ThemedText>
          )}
        </View>
        <View style={styles.uploadDataIcons}>
          <FontAwesome name="image" size={25} color={theme.text} />
          <Ionicons name="document-text-outline" size={25} color={theme.text} />
        </View>

        <View style={styles.tagsBox}>
          <ThemedText
            type="middleTitle"
            style={{ marginBottom: 10, fontWeight: 500 }}
          >
            Tags
          </ThemedText>

          <TextInput
            style={styles.tagsInput}
            value={tags}
            onChangeText={setTags}
            placeholder="Separate tags with comma (,)"
            placeholderTextColor={theme.subText}
            multiline
          />
          {errors.tags && <ThemedText type="error">{errors.tags}</ThemedText>}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              <View style={styles.badge}>
                <AntDesign name="star" size={12} color="#fff" />
              </View>
              <ThemedText type="middleTitle" style={{ color: theme.text }}>
                Recommended
              </ThemedText>
            </View>
            <ThemedText type="subText" style={[styles.rowSubtitle, {}]}>
              Is this post recommended by the author?
            </ThemedText>
          </View>
          <Switch
            value={textMessages}
            onValueChange={setTextMessages}
            trackColor={{ false: "#ccc", true: "#a846c2" }}
            thumbColor={textMessages ? "#fff" : "#fff"}
          />
        </View>

        <View style={styles.column}>
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              {/* <View style={styles.badge}>
                                <AntDesign name="star" size={12} color="#fff" />
                            </View> */}
              <ThemedText
                type="subtitle"
                style={{ color: theme.text, fontWeight: 400 }}
              >
                Post Visibility
              </ThemedText>
            </View>
            <ThemedText type="subText" style={[styles.rowSubtitle, {}]}>
              Who can see this post?
            </ThemedText>
          </View>

          <SelectBox
            options={[
              { label: "EveryOne", value: "e" },
              { label: "Specific", value: "s" },
            ]}
            value={lang[0].label} // فقط label برای نمایش در SelectBox
            onChange={(val) => {
              const selectedOption = [
                { label: "EveryOne", value: "e" },
                { label: "Specific", value: "s" },
              ].find((opt) => opt.value === val);

              if (selectedOption) {
                setLang([selectedOption]); // کل گزینه رو ذخیره کن
              }
            }}
            title="List of Post Visibility"
          />
          {errors.lang && (
            <ThemedText style={{ color: "red" }}>{errors.lang}</ThemedText>
          )}
        </View>

        <TouchableOpacity
          style={[styles.readBtn, loading && { opacity: 0.6 }]}
          onPress={submitData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.readText}>Create Post</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CreateNewPost;
