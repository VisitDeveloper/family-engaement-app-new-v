import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { feedback } from "@/lib/feedback";
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
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, TextInput, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollViewPlatform } from "@/components/ui/keyboard-aware-scroll-view";
import {
  ensureUploadableFileUri,
  uploadResourceContentFile,
  type SelectedUploadFile,
} from "@/utils/content-upload";

const RESOURCE_TYPES: { value: ResourceType; labelKey: string }[] = [
  { value: "book", labelKey: "resource.categoryBook" },
  { value: "activity", labelKey: "resource.categoryActivity" },
  { value: "video", labelKey: "resource.categoryVideo" },
];

export default function NewResourceScreen() {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme);
  const router = useRouter();
  const addResource = useStore((state: any) => state.addResource);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ResourceType>("book");
  const [category, setCategory] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedUploadFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        feedback.toast.info(t("resource.permissionRequired"), t("resource.needCameraRollPermission"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker.MediaType?.Image ?? "images"),
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      feedback.toast.error(t("common.error"), t("resource.failedPickImage"));
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile({
          uri: file.uri,
          name: file.name ?? "file",
          mimeType: file.mimeType ?? undefined,
        });
      }
    } catch (error) {
      console.error("Error picking document:", error);
      feedback.toast.error(t("common.error"), t("resource.failedPickDocument"));
    }
  };

  const pickFileFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        feedback.toast.info(t("resource.permissionRequired"), t("resource.needCameraRollPermission"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [(ImagePicker.MediaType?.Image ?? "images"), (ImagePicker.MediaType?.Video ?? "videos")],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fallbackName = asset.uri.split("/").pop() || "gallery-file";
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName ?? fallbackName,
          mimeType: asset.mimeType ?? undefined,
        });
      }
    } catch (error) {
      console.error("Error picking file from gallery:", error);
      feedback.toast.error(t("common.error"), t("resource.failedPickDocument"));
    }
  };

  const handlePickFile = async () => {
    const selectedIndex = await feedback.actionSheet({
      title: t("resource.fileSourceTitle"),
      options: [
        { label: t("resource.chooseFromGallery") },
        { label: t("resource.chooseFromFiles") },
      ],
    });
    if (selectedIndex === 0) {
      await pickFileFromGallery();
      return;
    }
    if (selectedIndex === 1) {
      await pickDocument();
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

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 16, paddingBottom: 40 },
    label: { fontSize: 14, fontWeight: "600", color: t.text, marginBottom: 6 },
    input: {
      // borderWidth: 1,
      // borderColor: t.border,
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
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      feedback.toast.error(t("common.error"), t("resource.titleRequired"));
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      let contentUrl: string | null = null;

      if (selectedImage) {
        const uploadableUri = await ensureUploadableFileUri(selectedImage);
        const filename = uploadableUri.split("/").pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1]}` : "image/jpeg";
        const formData = new FormData();
        formData.append("file", {
          uri: uploadableUri,
          name: filename,
          type: mimeType,
        } as any);
        const uploadResponse = await messagingService.uploadImage(formData);
        imageUrl = uploadResponse.url;
      }

      if (selectedFile) {
        const uploadableUri = await ensureUploadableFileUri(selectedFile.uri);
        const uploadResponse = await uploadResourceContentFile(
          uploadableUri,
          selectedFile,
          type
        );
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

      const created = await resourceService.create(payload);
      addResource({
        id: created.id,
        title: created.title,
        description: created.description,
        type: created.type,
        category: created.category,
        ageRange: created.ageRange,
        imageUrl: created.imageUrl,
        contentUrl: created.contentUrl,
        averageRating: created.averageRating,
        ratingsCount: created.ratingsCount,
        createdBy: created.createdBy,
        isSaved: created.isSaved ?? false,
        userRating: created.userRating ?? null,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });

      feedback.toast.success(t("common.success"), t("resource.createdSuccess"));
      router.back();
    } catch (err: any) {
      feedback.toast.error(t("common.error"), err?.message || t("resource.failedCreate"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderInnerPage
        title={t("resource.newResource")}
        subTitle={t("resource.newResourceSubTitle")}
      />
      <KeyboardAwareScrollViewPlatform
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
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
            onPress={handlePickFile}
            disabled={submitting}
            style={[styles.uploadButtonRow, { borderColor: theme.border, backgroundColor: theme.panel }]}
          >
            <FileIcon size={20} color={theme.tint} />
            <ThemedText style={{ color: theme.text, marginLeft: 8, flex: 1 }} numberOfLines={1}>
              {selectedFile
                ? selectedFile.name
                : t("resource.tapToAddFile")}
            </ThemedText>
          </TouchableOpacity>
          {selectedFile && (
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
              {t("resource.submitCreate")}
            </ThemedText>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollViewPlatform>
    </View>
  );
}
