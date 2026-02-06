// app/book/[id].tsx
import HeaderThreeSections from "@/components/reptitive-component/header-three-sections";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { resourceService } from "@/services/resource.service";
import { saveService } from "@/services/save.service";
import { useStore } from "@/store";
import { AntDesign, Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BookDetailScreen = () => {
  const router = useRouter();
  const theme = useStore((s) => s.theme);
  const insets = useSafeAreaInsets();

  const param = usePathname();
  const pathID = param.split("/");
  const id = pathID.pop();
  console.log("id", id);

  const resourceItem = useStore((state: any) => state.getResourceById(`${id}`));
  console.log(resourceItem, "resourceItem");
  const addResource = useStore((state: any) => state.addResource);
  const [isSaved, setIsSaved] = useState<boolean>(
    resourceItem?.isSaved || false
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Refresh resource data when screen comes into focus (e.g., after rating)
  useFocusEffect(
    useCallback(() => {
      const refreshResource = async () => {
        if (!id || typeof id !== "string") return;

        try {
          const updatedResource = await resourceService.getById(id);
          addResource({
            id: updatedResource.id,
            title: updatedResource.title,
            description: updatedResource.description,
            type: updatedResource.type,
            category: updatedResource.category,
            ageRange: updatedResource.ageRange,
            imageUrl: updatedResource.imageUrl,
            contentUrl: updatedResource.contentUrl,
            averageRating: updatedResource.averageRating,
            ratingsCount: updatedResource.ratingsCount,
            createdBy: updatedResource.createdBy,
            isSaved: updatedResource.isSaved,
            userRating: updatedResource.userRating,
            createdAt: updatedResource.createdAt,
            updatedAt: updatedResource.updatedAt,
          });
          setIsSaved(updatedResource.isSaved ?? false);
        } catch (error) {
          console.error("Error refreshing resource:", error);
        }
      };

      refreshResource();
    }, [id, addResource])
  );

  const styles = useThemedStyles(
    (t) =>
      ({
        container: { flex: 1, backgroundColor: t.bg, padding: 0 },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderColor: t.border,
        },
        headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
        backBtn: { padding: 6 },
        cover: {
          width: "100%",
          height: 225,
          borderRadius: 12,
          marginTop: 12,
          backgroundColor: t.panel,
          borderWidth: 1,
          borderColor: theme.border,
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
        rating: { flexDirection: "row", alignItems: "center", gap: 4 },
        desc: { marginTop: 10, lineHeight: 20 },
        actionRow: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: 20,
          gap: 10,
        },
        readBtn: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.tint,
          paddingVertical: 12,
          borderRadius: 8,
          gap: 6,
        },
        readText: { color: "white", fontWeight: "600" },
        shareBtn: {
          padding: 12,
          borderWidth: 1,
          borderColor: t.tint,
          borderRadius: 8,
        },
        scroll: {
          padding: 16,
          paddingTop: 10,
          paddingBottom: insets.bottom + 30,
        },
      } as const)
  );

  const handleSaveToggle = async () => {
    if (!id || typeof id !== "string") {
      Alert.alert("Error", "Invalid resource ID.");
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        await saveService.saveResource(id);
        setIsSaved(false);

        // Update resource in store
        if (resourceItem) {
          const updatedResource = {
            ...resourceItem,
            isSaved: false,
          };
          addResource(updatedResource);
        }
      } else {
        await saveService.saveResource(id);
        setIsSaved(true);

        // Update resource in store
        if (resourceItem) {
          const updatedResource = {
            ...resourceItem,
            isSaved: true,
          };
          addResource(updatedResource);
        }
      }
    } catch (error: any) {
      console.error("Error toggling save:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update save status. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openResource = (item: any) => {
    // Map to API model structure
    const data = {
      id: item.id || "",
      title: item.title,
      description: item.description || "",
      type: item.type as "book" | "activity" | "video",
      category: item.category,
      ageRange: item.ageRange || item.age || null,
      imageUrl: item.imageUrl || null,
      contentUrl: item.contentUrl || null,
      averageRating: item.averageRating || item.rating || 0,
      ratingsCount: item.ratingsCount || 0,
      createdBy: item.createdBy || null,
      isSaved: item.isSaved || false,
      userRating: item.userRating || null,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    };
    addResource(data);
    router.push({
      pathname: "/resource/[id]/rating",
      params: { id: data?.id! },
    });
  };

  return (
    <View style={styles.container}>
      <HeaderThreeSections
        title={resourceItem?.title!}
        desc={`${resourceItem?.category!} • ${
          resourceItem?.ageRange || resourceItem?.age || "N/A"
        }`}
        icon={
          isSaving ? (
            <ActivityIndicator size="small" color={theme.text} />
          ) : (
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isSaved ? theme.tint : theme.text}
            />
          )
        }
        colorDesc={theme.subText}
        onPress={handleSaveToggle}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover */}
        <Image
          source={{
            uri: resourceItem?.imageUrl
              ? resourceItem.imageUrl
              : resourceItem?.image || "",
          }}
          style={styles.cover}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel={`Cover image for ${
            resourceItem?.title || "resource"
          }`}
        />

        {/* Chips */}
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons name="book-outline" size={16} color={theme.text} />
            <ThemedText type="subText">{resourceItem?.type!}</ThemedText>
          </View>
          <TouchableOpacity
            onPress={() => openResource(resourceItem!)}
            style={styles.rating}
            accessibilityRole="button"
            accessibilityLabel={`View ratings. Current rating: ${(
              resourceItem?.averageRating ||
              resourceItem?.rating ||
              0
            ).toFixed(1)} stars`}
            accessibilityHint="Double tap to view and rate this resource"
          >
            <FontAwesome
              name="star"
              size={16}
              color="#FACC15"
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            />
            <ThemedText type="subText">
              {(
                resourceItem?.averageRating ||
                resourceItem?.rating ||
                0
              ).toFixed(1)}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <ThemedText type="default" style={styles.desc}>
          {resourceItem?.description ||
            "A classic story about the transformation of a caterpillar into a beautiful butterfly."}
        </ThemedText>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.readBtn}>
            <Feather name="eye" size={18} color="white" />
            <ThemedText style={styles.readText}>View Activity</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn}>
            <AntDesign name="download" size={18} color={theme.tint} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default BookDetailScreen;
