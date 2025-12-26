import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import SelectBox, { OptionsList } from "@/components/ui/select-box-modal";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useValidation } from "@/hooks/use-validation";
import {
  ClassroomResponseDto,
  messagingService,
} from "@/services/messaging.service";
import { postService } from "@/services/post.service";
import { useStore } from "@/store";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CreateOrEditPost = () => {
  const theme = useStore((s) => s.theme);
  const user = useStore((s) => s.user);
  const router = useRouter();
  const params = useLocalSearchParams();
  const postId = params.postId as string | undefined;
  const isEditMode = !!postId;

  const [message, setMessage] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [textMessages, setTextMessages] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [loadingPost, setLoadingPost] = useState<boolean>(false);
  const hasLoadedFromParams = useRef(false);
  const [visibility, setVisibility] = useState<OptionsList[]>([
    {
      label: "Everyone",
      value: "everyone",
    },
    {
      label: "Followers",
      value: "followers",
    },
    {
      label: "Private",
      value: "private",
    },
  ]);
  const [classrooms, setClassrooms] = useState<OptionsList[]>([]);
  const [selectedClassroom, setSelectedClassroom] =
    useState<OptionsList | null>(null);
  const [loadingClassrooms, setLoadingClassrooms] = useState<boolean>(false);
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

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
    selectedImage: {
      width: "100%",
      height: 200,
      borderRadius: 10,
      marginTop: 10,
      resizeMode: "cover",
    },
    selectedFileContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.panel,
      padding: 10,
      borderRadius: 10,
      marginTop: 10,
      borderWidth: 1,
      borderColor: t.border,
    },
    removeButton: {
      marginLeft: 10,
      padding: 5,
    },
    uploadButton: {
      padding: 10,
      borderRadius: 8,
      backgroundColor: t.panel,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 60,
    },
  }));

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to select images!"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setSelectedFile(null); // Clear file if image is selected
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result);
        setSelectedImage(null); // Clear image if file is selected
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document. Please try again.");
    }
  };

  const removeSelectedMedia = () => {
    setSelectedImage(null);
    setSelectedFile(null);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (index: number) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const loadClassrooms = useCallback(async () => {
    if (!isTeacher) return;

    setLoadingClassrooms(true);
    try {
      const classroomsData = await messagingService.getClassrooms();
      const mappedClassrooms: OptionsList[] = classroomsData.map(
        (classroom: ClassroomResponseDto) => {
          const name =
            typeof classroom.name === "string"
              ? classroom.name
              : classroom.name && typeof classroom.name === "object"
              ? (Object.values(classroom.name)[0] as string) || "Classroom"
              : "Classroom";
          return {
            label: name,
            value: classroom.id,
          };
        }
      );
      setClassrooms(mappedClassrooms);
    } catch (error: any) {
      console.error("Error loading classrooms:", error);
      Alert.alert("Error", "Failed to load classrooms. Please try again.");
    } finally {
      setLoadingClassrooms(false);
    }
  }, [isTeacher]);

  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

  const loadPostData = useCallback(async () => {
    if (!postId) return;

    try {
      setLoadingPost(true);
      const post = await postService.getById(postId);
      setMessage(post.description);
      setTags(post.tags?.join(",") || "");
      setTextMessages(post.recommended);
      setExistingImages(post.images || []);
      setExistingFiles(post.files || []);
      setVisibility([
        {
          label:
            post.visibility.charAt(0).toUpperCase() + post.visibility.slice(1),
          value: post.visibility,
        },
      ]);
      if (post.classroom?.id) {
        // Wait for classrooms to be loaded first
        if (classrooms.length === 0) {
          await loadClassrooms();
        }
        // Find classroom in the loaded classrooms list
        const classroom = classrooms.find((c) => c.value === post.classroom?.id);
        if (classroom) {
          setSelectedClassroom(classroom);
        } else {
          // If not found in list, load it directly
          const classroomsData = await messagingService.getClassrooms();
          const classroomData = classroomsData.find(
            (c) => c.id === post.classroomId
          );
          if (classroomData) {
            const name =
              typeof classroomData.name === "string"
                ? classroomData.name
                : classroomData.name && typeof classroomData.name === "object"
                ? (Object.values(classroomData.name)[0] as string) ||
                  "Classroom"
                : "Classroom";
            const classroomOption = {
              label: name,
              value: classroomData.id,
            };
            setSelectedClassroom(classroomOption);
            // Also add it to classrooms list if not already there
            setClassrooms((prev) => {
              if (!prev.find((c) => c.value === classroomData.id)) {
                return [...prev, classroomOption];
              }
              return prev;
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading post:", error);
      Alert.alert("Error", "Failed to load post data. Please try again.");
      router.back();
    } finally {
      setLoadingPost(false);
    }
  }, [postId, router, classrooms, loadClassrooms]);

  // Load post data if in edit mode
  useEffect(() => {
    if (isEditMode && postId) {
      loadPostData();
    } else if (params.description && !hasLoadedFromParams.current) {
      // Load from params if provided (for navigation from edit button)
      hasLoadedFromParams.current = true;
      setMessage(params.description as string);
      setTags((params.tags as string) || "");
      setTextMessages(params.recommended === "true");
      if (params.images) {
        const imageUrls = (params.images as string).split(",").filter(Boolean);
        setExistingImages(imageUrls);
      }
      if (params.files) {
        const fileUrls = (params.files as string).split(",").filter(Boolean);
        setExistingFiles(fileUrls);
      }
      if (params.visibility) {
        const visibilityValue = params.visibility as string;
        setVisibility([
          {
            label:
              visibilityValue.charAt(0).toUpperCase() +
              visibilityValue.slice(1),
            value: visibilityValue,
          },
        ]);
      }
    }
  }, [
    isEditMode,
    postId,
    loadPostData,
    params.description,
    params.tags,
    params.recommended,
    params.images,
    params.files,
    params.visibility,
  ]);

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
    visibility: { required: true },
  });

  const submitData = async () => {
    const isValid = validate({ message, tags, visibility });

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

      const visibilityValue = visibility[0]?.value;

      // آماده‌سازی داده‌های پست
      const postData: {
        description: string;
        tags: string[];
        recommended: boolean;
        visibility: "everyone" | "followers" | "private";
        images?: string[];
        files?: string[];
        classroomId?: string | null;
      } = {
        description: message,
        tags: tagsArray,
        recommended: textMessages,
        visibility: visibilityValue as "everyone" | "followers" | "private",
        classroomId: selectedClassroom?.value || null,
      };

      // Handle images
      if (selectedImage) {
        // New image selected - upload it
        const filename = selectedImage.split("/").pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        const imageFormData = new FormData();
        imageFormData.append("file", {
          uri: selectedImage,
          name: filename,
          type: type,
        } as any);

        const uploadResponse = await messagingService.uploadImage(
          imageFormData
        );
        postData.images = [uploadResponse.url];
      } else if (isEditMode && existingImages.length > 0) {
        // Keep existing images in edit mode
        postData.images = existingImages;
      }

      // Handle files
      if (selectedFile && !selectedFile.canceled && selectedFile.assets[0]) {
        // New file selected - upload it
        const file = selectedFile.assets[0];
        const fileFormData = new FormData();
        fileFormData.append("file", {
          uri: file.uri,
          name: file.name || "file",
          type: file.mimeType || "application/octet-stream",
        } as any);

        const uploadResponse = await messagingService.uploadFile(fileFormData);
        postData.files = [uploadResponse.url];
      } else if (isEditMode && existingFiles.length > 0) {
        // Keep existing files in edit mode
        postData.files = existingFiles;
      }

      // Create or update post
      if (isEditMode && postId) {
        await postService.update(postId, postData);
        Alert.alert("Success", "Post updated successfully!", [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]);
      } else {
        await postService.create(postData);
        Alert.alert("Success", "Post created successfully!", [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]);
      }
    } catch (error: any) {
      const errorMessage =
        error.message ||
        (isEditMode
          ? "Failed to update post. Please try again."
          : "Failed to create post. Please try again.");
      Alert.alert("Error", errorMessage);
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} post:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <View style={styles.container}>
        <HeaderInnerPage title={isEditMode ? "Edit Post" : "New Post"} />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.tint} />
          <ThemedText type="subText" style={{ marginTop: 10 }}>
            Loading post...
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderInnerPage title={isEditMode ? "Edit Post" : "New Post"} />

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
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickImage}
            disabled={!!selectedFile}
          >
            <FontAwesome
              name="image"
              size={25}
              color={selectedFile ? theme.subText : theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={pickDocument}
            disabled={!!selectedImage}
          >
            <Ionicons
              name="document-text-outline"
              size={25}
              color={selectedImage ? theme.subText : theme.text}
            />
          </TouchableOpacity>
        </View>

        {selectedImage && (
          <View style={{ marginTop: 10 }}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.selectedImage}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={removeSelectedMedia}
            >
              <ThemedText
                type="error"
                style={{ textAlign: "center", marginTop: 5 }}
              >
                Remove Image
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {selectedFile && !selectedFile.canceled && selectedFile.assets[0] && (
          <View style={styles.selectedFileContainer}>
            <Ionicons name="document" size={24} color={theme.text} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <ThemedText type="subtitle" style={{ color: theme.text }}>
                {selectedFile.assets[0].name}
              </ThemedText>
              {selectedFile.assets[0].size && (
                <ThemedText type="subText">
                  {(selectedFile.assets[0].size / 1024).toFixed(2)} KB
                </ThemedText>
              )}
            </View>
            <TouchableOpacity onPress={removeSelectedMedia}>
              <Ionicons name="close-circle" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Existing images in edit mode */}
        {isEditMode && existingImages.length > 0 && (
          <View style={{ marginTop: 10 }}>
            {existingImages.map((imageUrl, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.selectedImage}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeExistingImage(index)}
                >
                  <ThemedText
                    type="error"
                    style={{ textAlign: "center", marginTop: 5 }}
                  >
                    Remove Image
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Existing files in edit mode */}
        {isEditMode && existingFiles.length > 0 && (
          <View style={{ marginTop: 10 }}>
            {existingFiles.map((fileUrl, index) => {
              const fileName = fileUrl.split("/").pop() || "File";
              return (
                <View key={index} style={styles.selectedFileContainer}>
                  <Ionicons name="document" size={24} color={theme.text} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <ThemedText
                      type="text"
                      style={{
                        color: theme.text,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                    >
                      {fileName.length > 30
                        ? fileName.substring(0, 30) + "..."
                        : fileName}
                    </ThemedText>
                  </View>
                  <TouchableOpacity onPress={() => removeExistingFile(index)}>
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={theme.text}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

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

        {isTeacher && (
          <View style={styles.column}>
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
              >
                <ThemedText
                  type="middleTitle"
                  style={{ marginBottom: 10, fontWeight: 500 }}
                >
                  Select Classroom
                </ThemedText>
              </View>
              {/* <ThemedText type="subText" style={[styles.rowSubtitle, {}]}>
                Choose a classroom for this post (optional)
              </ThemedText> */}
            </View>

            {loadingClassrooms ? (
              <ActivityIndicator size="small" color={theme.tint} />
            ) : (
              <SelectBox
                options={[{ label: "No Classroom", value: "" }, ...classrooms]}
                value={selectedClassroom?.label || "No Classroom"}
                onChange={(val) => {
                  if (val === "") {
                    setSelectedClassroom(null);
                  } else {
                    const selectedOption = classrooms.find(
                      (opt) => opt.value === val
                    );
                    if (selectedOption) {
                      setSelectedClassroom(selectedOption);
                    }
                  }
                }}
                title="List of Classrooms"
              />
            )}
          </View>
        )}

        <View style={styles.column}>
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              {/* <View style={styles.badge}>
                                <AntDesign name="star" size={12} color="#fff" />
                            </View> */}
              <ThemedText
                type="middleTitle"
                style={{ marginBottom: 4, fontWeight: 500 }}
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
              { label: "Everyone", value: "everyone" },
              { label: "Followers", value: "followers" },
              { label: "Private", value: "private" },
            ]}
            value={visibility[0].label} // فقط label برای نمایش در SelectBox
            onChange={(val) => {
              const selectedOption = [
                { label: "Everyone", value: "everyone" },
                { label: "Followers", value: "followers" },
                { label: "Private", value: "private" },
              ].find((opt) => opt.value === val);

              if (selectedOption) {
                setVisibility([selectedOption]); // کل گزینه رو ذخیره کن
              }
            }}
            title="List of Post Visibility"
          />
          {errors.visibility && (
            <ThemedText style={{ color: "red" }}>
              {errors.visibility}
            </ThemedText>
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
            <ThemedText style={styles.readText}>
              {isEditMode ? "Update Post" : "Create Post"}
            </ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CreateOrEditPost;
