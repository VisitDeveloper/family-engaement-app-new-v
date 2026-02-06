import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { useEffect } from "react";
import { StyleProp, TextInput, View, ViewStyle } from "react-native";
import { useDebounce } from "use-debounce";
import { SearchIcon } from "../ui/common-icons";

interface SearchContainerProps {
  query: string;
  onChangeQuery: (value: string) => void;
  onDebouncedQuery?: (value: string) => void;
  placeholder?: string;
  addstyles?: StyleProp<ViewStyle>;
}

export default function SearchContainer({
  query,
  onChangeQuery,
  placeholder,
  onDebouncedQuery,
  addstyles,
}: SearchContainerProps) {
  const theme = useStore((state) => state.theme);
  const [debouncedQuery] = useDebounce(query, 300);

  const styles = useThemedStyles((theme) => ({
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.panel,
      // borderWidth: 1,
      // borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      marginVertical: 8,
    },
    searchInput: { flex: 1, marginLeft: 8, height: 40, color: theme.text },
  }));

  // Pass debouncedQuery to parent
  useEffect(() => {
    if (onDebouncedQuery) onDebouncedQuery(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <View style={[styles.searchContainer, addstyles]}>
      <SearchIcon size={16} color={theme.subText} />
      <TextInput
        placeholder={placeholder || "Search..."}
        placeholderTextColor={theme.subText}
        style={styles.searchInput}
        value={query}
        onChangeText={onChangeQuery}
      />
    </View>
  );
}
