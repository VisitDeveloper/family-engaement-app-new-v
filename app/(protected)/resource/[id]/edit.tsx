import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { FileIcon, MediaIcon } from "@/components/ui/icons/messages-icons";
import SelectBox, { OptionsList } from "@/components/ui/select-box-modal";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { messagingService } from "@/services/messaging.service";
import { resourceService } from "@/services/resource.service";
import { useStore } from "@/store";
import type { ResourceType } from "@/types";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const RESOURCE_TYPES: { value: ResourceType; labelKey: string }[] = [
  { value: "book", labelKey: "resource.categoryBook" },
  { value: "activity", labelKey: "resource.categoryActivity" },
  { value: "video", labelKey: "resource.categoryVideo" },
];

export default function EditResourceScreen() {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme);
  const user = useStore((state: any) => state.user);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const addResource = useStore((state: any) => state.addResource);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ResourceType>("book");
  const [category, setCategory] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingContentUrl, setExistingContentUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("resource.permissionRequired"),
          t("resource.needCameraRollPermission")
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t("common.error"), t("resource.failedPickImage"));
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
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert(t("common.error"), t("resource.failedPickDocument"));
    }
  };

  const typeOptions: OptionsList[] = useMemo(
    () =>
      RESOURCE_TYPES.map(({ value, labelKey }) => ({
        value,
        label: t(labelKey),
      })),
    [t]
  );

  const loadResource = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await resourceService.getById(id);
      const creatorId = res.createdBy?.id ?? null;
      const isAdmin = user?.role === "admin";
      const isCreator = !!user?.id && !!creatorId && user.id === creatorId;
      if (!isAdmin && !isCreator) {
        Alert.alert(
          t("common.error"),
          t("resource.editNotAllowed") || "You are not allowed to edit this resource."
        );
        router.back();
        return;
      }
      setTitle(res.title);
      setDescription(res.description || "");
      setType(res.type);
      setCategory(res.category || "");
      setAgeRange(res.ageRange || "");
      setExistingImageUrl(res.imageUrl || null);
      setExistingContentUrl(res.contentUrl || null);
      setSelectedImage(null);
      setSelectedFile(null);
    } catch (err: any) {
      Alert.alert(
        t("common.error"),
        err?.message || t("resource.failedLoad")
      );
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, t, router, user?.id, user?.role]);

  useFocusEffect(
    useCallback(() => {
      loadResource();
    }, [loadResource])
  );

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 16, paddingBottom: 40 },
    label: { fontSize: 14, fontWeight: "600", color: t.text, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: t.text,
      backgroundColor: t.panel,
      minHeight: 44,
    },
    inputMultiline: { minHeight: 100, textAlignVertical: "top" },
    field: { marginBottom: 16 },
    selectBoxWrap: { marginBottom: 16 },
    submitBtn: {
      backgroundColor: t.tint,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center" as const,
      marginTop: 8,
      marginBottom: 40,
    },
    submitText: { color: "#fff", fontWeight: "600", fontSize: 16 },
    imageTouchable: {
      borderWidth: 1,
      borderRadius: 10,
      overflow: "hidden",
      minHeight: 140,
    },
    imagePreview: { width: "100%", height: 140 },
    imagePlaceholder: {
      minHeight: 140,
      alignItems: "center",
      justifyContent: "center",
    },
    uploadButtonRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
  }));

  const handleSubmit = async () => {
    if (!id) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert(t("common.error"), t("resource.titleRequired"));
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = existingImageUrl;
      let contentUrl: string | null = existingContentUrl;

      if (selectedImage) {
        const filename = selectedImage.split("/").pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1]}` : "image/jpeg";
        const formData = new FormData();
        formData.append("file", {
          uri: selectedImage,
          name: filename,
          type: mimeType,
        } as any);
        const uploadResponse = await messagingService.uploadImage(formData);
        imageUrl = uploadResponse.url;
      }

      if (selectedFile && !selectedFile.canceled && selectedFile.assets[0]) {
        const file = selectedFile.assets[0];
        const fileFormData = new FormData();
        fileFormData.append("file", {
          uri: file.uri,
          name: file.name || "file",
          type: file.mimeType || "application/octet-stream",
        } as any);
        const uploadResponse = await messagingService.uploadFile(fileFormData);
        contentUrl = uploadResponse.url;
      }

      const payload = {
        title: trimmedTitle,
        description: description.trim() || "",
        type,
        category: category.trim() || "",
        ageRange: ageRange.trim() || null,
        imageUrl,
        contentUrl,
      };
      const updated = await resourceService.update(id, payload);
      addResource({
        id: updated.id,
        title: updated.title,
        description: updated.description,
        type: updated.type,
        category: updated.category,
        ageRange: updated.ageRange,
        imageUrl: updated.imageUrl,
        contentUrl: updated.contentUrl,
        averageRating: updated.averageRating,
        ratingsCount: updated.ratingsCount,
        createdBy: updated.createdBy,
        isSaved: updated.isSaved ?? false,
        userRating: updated.userRating ?? null,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      });

      Alert.alert(t("common.success"), t("resource.updatedSuccess"), [
        {
          text: t("common.ok"),
          onPress: () => {
            // Defer so Alert can dismiss and layout is ready (avoids "navigate before mounting")
            setTimeout(() => router.back(), 0);
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        t("common.error"),
        err?.message || t("resource.failedUpdate")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <ThemedText type="subText" style={{ marginTop: 10 }}>
          {t("common.loading")}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderInnerPage
        title={t("resource.editResource")}
        subTitle={t("resource.editResourceSubTitle")}
      />
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <ThemedText style={styles.label}>{t("resource.formTitle")}</ThemedText>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t("resource.placeholderTitle")}
            placeholderTextColor={theme.subText}
            editable={!submitting}
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>
            {t("resource.formDescription")}
          </ThemedText>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder={t("resource.placeholderDescription")}
            placeholderTextColor={theme.subText}
            multiline
            numberOfLines={4}
            editable={!submitting}
          />
        </View>

        <View style={styles.selectBoxWrap}>
          <ThemedText style={styles.label}>{t("resource.formType")}</ThemedText>
          <SelectBox
            options={typeOptions}
            value={type}
            onChange={(v) => setType(v as ResourceType)}
            title={t("resource.formType")}
            disabled={submitting}
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>
            {t("resource.formCategory")}
          </ThemedText>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder={t("resource.placeholderCategory")}
            placeholderTextColor={theme.subText}
            editable={!submitting}
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>
            {t("resource.formAgeRange")}
          </ThemedText>
          <TextInput
            style={styles.input}
            value={ageRange}
            onChangeText={setAgeRange}
            placeholder={t("resource.placeholderAgeRange")}
            placeholderTextColor={theme.subText}
            editable={!submitting}
          />
        </View>

        {/* Cover image upload */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>
            {t("resource.formCoverImage")}
          </ThemedText>
          <TouchableOpacity
            onPress={pickImage}
            disabled={submitting}
            style={[
              styles.imageTouchable,
              { borderColor: theme.border, backgroundColor: theme.panel },
            ]}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : existingImageUrl ? (
              <Image
                source={{ uri: existingImageUrl }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.panel }]}>
                <MediaIcon size={32} color={theme.subText} />
                <ThemedText type="subText" style={{ marginTop: 6 }}>
                  {t("resource.tapToAddImage")}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Content file upload */}
        <View style={styles.field}>
          <ThemedText style={styles.label}>
            {t("resource.formContentFile")}
          </ThemedText>
          <TouchableOpacity
            onPress={pickDocument}
            disabled={submitting}
            style={[styles.uploadButtonRow, { borderColor: theme.border, backgroundColor: theme.panel }]}
          >
            <FileIcon size={20} color={theme.tint} />
            <ThemedText style={{ color: theme.text, marginLeft: 8, flex: 1 }} numberOfLines={1}>
              {selectedFile && !selectedFile.canceled && selectedFile.assets[0]
                ? selectedFile.assets[0].name
                : existingContentUrl
                  ? t("resource.currentFileAttached")
                  : t("resource.tapToAddFile")}
            </ThemedText>
          </TouchableOpacity>
          {(selectedFile && !selectedFile.canceled && selectedFile.assets[0]) && (
            <TouchableOpacity
              onPress={() => setSelectedFile(null)}
              style={{ marginTop: 6 }}
            >
              <ThemedText style={{ color: "#dc2626", fontSize: 14 }}>
                {t("resource.removeFile")}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.submitText}>
              {t("resource.submitUpdate")}
            </ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
