import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";
import { TextInput, View } from "react-native";
import { useDebounce } from "use-debounce";

interface SearchContainerProps {
    query: string;
    onChangeQuery: (value: string) => void;
    onDebouncedQuery?: (value: string) => void; 
    placeholder?: string;
}

export default function SearchContainer({ query, onChangeQuery, placeholder,onDebouncedQuery }: SearchContainerProps) {
    const theme = useStore(state => state.theme);
    const [debouncedQuery] = useDebounce(query, 300);

    const styles = useThemedStyles(theme => ({
        searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 10, marginVertical: 8 },
        searchInput: { flex: 1, marginLeft: 8, height: 40, color: theme.text },
    }));

    // پاس دادن debouncedQuery به والد
    useEffect(() => {
    if (onDebouncedQuery) onDebouncedQuery(debouncedQuery);
  }, [debouncedQuery]);

    return (
        <View style={styles.searchContainer}>
            <Feather name="search" size={20} color={theme.subText} />
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
