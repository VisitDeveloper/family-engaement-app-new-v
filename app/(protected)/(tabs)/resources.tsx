import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import ResourceItem, {
  ResourceItemProps,
} from "@/components/reptitive-component/resource-item";
import SearchContainer from "@/components/reptitive-component/search-container";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import {
  ResourceResponseDto,
  resourceService,
} from "@/services/resource.service";
import { saveService } from "@/services/save.service";
import { useStore } from "@/store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Helper function to get icon based on type
const getResourceIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "book":
      return <Ionicons name="book-outline" size={15} color={"#666"} />;
    case "activity":
      return (
        <Ionicons name="extension-puzzle-outline" size={15} color="#666" />
      );
    case "video":
      return <Feather name="video" size={15} color={"#666"} />;
    default:
      return <Ionicons name="book-outline" size={15} color={"#666"} />;
  }
};

// Helper function to convert API response to ResourceItemProps
const convertToResourceItemProps = (
  resource: ResourceResponseDto
): ResourceItemProps => {
  return {
    id: resource.id,
    type: resource.type,
    title: resource.title,
    ageRange: resource.ageRange,
    category: resource.category,
    averageRating: resource.averageRating,
    imageUrl: resource.imageUrl,
    image: resource.imageUrl
      ? { uri: resource.imageUrl }
      : undefined,
    icon: getResourceIcon(resource.type),
    isSaved: resource.isSaved,
  };
};

const ResourceLibrary = () => {
  const router = useRouter();
  const theme = useStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const addResource = useStore((state: any) => state.addResource);

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredResources, setFilteredResources] = useState<
    ResourceItemProps[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch resources from API
  const fetchResources = useCallback(
    async (searchQuery?: string, category?: string) => {
      try {
        setLoading(true);
        setError(null);

        // Map display category to API filter
        const categoryMap: {
          [key: string]: "all" | "books" | "activities" | "videos" | "saved";
        } = {
          All: "all",
          Book: "books",
          Activity: "activities",
          Video: "videos",
          Saved: "saved",
        };

        const filter = categoryMap[category || selectedCategory] || "all";

        const params = {
          page: 1,
          limit: 100,
          filter: filter,
          ...(searchQuery && { search: searchQuery }),
        };

        const { resources: data } = await resourceService.getAll(params);

        console.log("data", data);

        const convertedResources = data.map(convertToResourceItemProps);
        setFilteredResources(convertedResources);
      } catch (err: any) {
        const errorMessage =
          err.message || "Failed to load resources. Please try again.";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
        console.error("Error fetching resources:", err);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory]
  );

  // Initial load
  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh resources when screen comes into focus (e.g., after rating)
  useFocusEffect(
    useCallback(() => {
      fetchResources(query, selectedCategory);
    }, [query, selectedCategory, fetchResources])
  );

  const handleDebouncedQuery = useCallback(
    (debouncedValue: string) => {
      fetchResources(debouncedValue, selectedCategory);
    },
    [selectedCategory, fetchResources]
  );

  // Changing category also filters resources
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    fetchResources(query, cat);
  };

  const stylesFlatListItem = useThemedStyles((theme) => ({
    item: {
      width: "48%",
      marginBottom: 10,
      padding: 5,
      backgroundColor: theme.bg,
      borderRadius: 10,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },
    image: {
      width: "100%",
      height: 100,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      backgroundColor: theme.panel,
    },
    textContainer: { padding: 5, flexDirection: "column" },
    typeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    typeItem: {
      flexDirection: "row",
      gap: 4,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 4,
      paddingVertical: 3,
      borderRadius: 4,
    },
    type: { fontSize: 12, color: theme.subText },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
      marginTop: 15,
      marginBottom: 5,
    },
    age: { fontSize: 12, color: theme.subText },
    categoryContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    categoryTitle: {
      color: theme.subText,
      backgroundColor: theme.panel,
      paddingHorizontal: 3,
      paddingVertical: 2,
      borderRadius: 8,
    },
    categoryIcon: { marginTop: 0, color: theme.subText },
    rating: { fontSize: 12, color: theme.subText },
  }));

  const styles = useThemedStyles((theme) => ({
    container: { flex: 1, backgroundColor: theme.bg, padding: 0 },
    header: { fontSize: 24, fontWeight: "bold", color: theme.text },
    row: { justifyContent: "space-between", marginBottom: 10 },
  }));

  // const openResource = useCallback(
  //     (ITEM: Resource) => {
  //         console.log(ITEM)
  //         addResource(ITEM);
  //         router.push({
  //             pathname: "/resource/[id]",
  //             params: { id: ITEM.id },
  //         });
  //     },
  //     [addResource, router]
  // );

  const handleSaveToggle = async (resourceId: string) => {
    try {
      // Find the resource in the current list
      const resource = filteredResources.find((r) => r.id === resourceId);
      if (!resource) return;

      const isCurrentlySaved = resource.isSaved || false;

      await saveService.saveResource(resourceId);

      // Update the local state
      setFilteredResources((prev) =>
        prev.map((r) =>
          r.id === resourceId ? { ...r, isSaved: !isCurrentlySaved } : r
        )
      );

      // Refresh the list to get updated data
      await fetchResources(query, selectedCategory);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "Failed to update save status. Please try again."
      );
      console.error("Error toggling save:", err);
    }
  };

  const openResource = async (item: ResourceItemProps) => {
    try {
      // Fetch full resource details from API
      const fullResource = await resourceService.getById(item.id!);
      // Map to API model structure
      const data = {
        id: fullResource.id,
        title: fullResource.title,
        description: fullResource.description,
        type: fullResource.type,
        category: fullResource.category,
        ageRange: fullResource.ageRange,
        imageUrl: fullResource.imageUrl,
        contentUrl: fullResource.contentUrl,
        averageRating: fullResource.averageRating,
        ratingsCount: fullResource.ratingsCount,
        createdBy: fullResource.createdBy,
        isSaved: fullResource.isSaved,
        userRating: fullResource.userRating,
        createdAt: fullResource.createdAt,
        updatedAt: fullResource.updatedAt,
      };

      addResource(data);
      router.push({
        pathname: "/resource/[id]",
        params: { id: data.id },
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load resource details");
      console.error("Error fetching resource details:", err);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderTabItem
        title="Resource Library"
        subTitle="200+ books and activities"
        addstyles={{ paddingHorizontal: 10, paddingTop: 10 }}
      />

      <View style={{ paddingHorizontal: 10, paddingTop: 10 }}>
        <SearchContainer
          query={query}
          onChangeQuery={setQuery}
          onDebouncedQuery={handleDebouncedQuery}
          placeholder="Search Resources..."
        />
      </View>

      {/* Category Tabs */}
      <View
        style={{
          flexDirection: "row",
          marginBottom: 0,
          gap: 5,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderColor: theme.border,
          paddingHorizontal: 10,
        }}
      >
        {["All", "Book", "Activity", "Video", "Saved"].map((cat) => (
          <TouchableOpacity key={cat} onPress={() => handleCategoryChange(cat)}>
            <ThemedText
              type="subText"
              style={{
                color: selectedCategory === cat ? "#fff" : theme.text,
                borderWidth: 1,
                borderColor:
                  selectedCategory === cat ? theme.tint : theme.border,
                backgroundColor:
                  selectedCategory === cat ? theme.tint : theme.bg,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              {cat}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Resource List */}
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.tint} />
          <ThemedText type="subText" style={{ marginTop: 10 }}>
            Loading resources...
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
            onPress={() => fetchResources()}
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
      ) : filteredResources.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <ThemedText type="subText" style={{ textAlign: "center" }}>
            No resources found
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredResources}
          extraData={filteredResources}
          keyExtractor={(item) => item.id!}
          numColumns={2}
          style={{ flex: 1, paddingHorizontal: 10, paddingTop: 20 }}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: insets.bottom + 60,
          }}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ResourceItem
              onPress={() => openResource(item)}
              onSavePress={handleSaveToggle}
              styles={stylesFlatListItem}
              {...item}
            />
          )}
        />
      )}
    </View>
  );
};

export default ResourceLibrary;
