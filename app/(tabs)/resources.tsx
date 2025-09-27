import HeaderTabItem from '@/components/reptitive-component/header-tab-item';
import ResourceItem, { ResourceItemProps } from '@/components/reptitive-component/resource-item';
import SearchContainer from '@/components/reptitive-component/search-container';
import { ThemedText } from '@/components/themed-text';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { useStore } from '@/store';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";



const resources: ResourceItemProps[] = [
    {
        id: '1', type: 'Book', title: 'The Very Hungry Caterpillar', age: '3-5 years', category: 'Nature',
        rating: 4.8, image: require('./../../assets/images/timeline-1.jpg'),
        icon: <Ionicons name="book-outline" size={15} color={'#666'} />
    },
    {
        id: '2', type: 'Activity',
        icon: <Ionicons name="extension-puzzle-outline" size={15} color="#666" />,
        title: 'Counting Safari Animals', age: '4-6 years', category: 'Math',
        rating: 4.6, image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNk6NtCX6qarT2r01SQrZCadKL68ev34q94Q&s' }
    },

    {
        id: '3', type: 'Video',
        icon: <Feather name="video" size={15} color={'#666'} />,
        title: 'Letter Sounds Song', age: '3-5 years', category: 'Language',
        rating: 4.9, image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNk6NtCX6qarT2r01SQrZCadKL68ev34q94Q&s' }
    },
    {
        id: '4', type: 'Activity',
        icon: <Ionicons name="extension-puzzle-outline" size={15} color="#666" />,
        title: 'My Family Tree', age: '5-7 years', category: 'Social Studies',
        rating: 4.5, image: require('./../../assets/images/timeline-2.jpg')
    },
    {
        id: '5', type: 'Book',
        icon: <Ionicons name="book-outline" size={15} color={'#666'} />,
        title: 'Goodnight Moon', age: '2-4 years', category: 'Bedtime', rating: 4.7,
        image: require('./../../assets/images/timeline-2.jpg'),
    },
    {
        id: '6', type: 'Activity',
        icon: <Ionicons name="extension-puzzle-outline" size={15} color="#666" />,
        title: 'Weather Patterns', age: '5-8 years', category: 'Science', rating: 4.4,
        image: require('./../../assets/images/timeline-3.jpg')
    },
];

const ResourceLibrary = () => {
    const router = useRouter();
    const theme = useStore(state => state.theme);
    const insets = useSafeAreaInsets();
    const addResource = useStore((state: any) => state.addResource);

    const [query, setQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // فیلتر کردن منابع بر اساس debounce و category
    const [filteredResources, setFilteredResources] = useState<ResourceItemProps[]>(resources);

    const handleDebouncedQuery = (debouncedValue: string) => {
        let results = resources;

        if (selectedCategory !== "All") {
            results = results.filter(r => r.type === selectedCategory);
        }

        if (debouncedValue) {
            const lowerQuery = debouncedValue.toLowerCase();
            results = results.filter(
                r => r.title.toLowerCase().includes(lowerQuery) ||
                    r.category.toLowerCase().includes(lowerQuery)
            );
        }

        setFilteredResources(results);
    };

    // تغییر category هم منابع رو فیلتر می‌کنه
    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(cat);
        handleDebouncedQuery(query);
    };

    const stylesFlatListItem = useThemedStyles(theme => ({
        item: { width: '48%', marginBottom: 10, padding: 5, backgroundColor: theme.bg, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: theme.border },
        image: { width: '100%', height: 100, borderWidth: 1, borderColor: theme.border, borderRadius: 10 },
        textContainer: { padding: 5, flexDirection: 'column' },
        typeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        typeItem: { flexDirection: 'row', gap: 4, alignItems: 'center', borderWidth: 1, borderColor: theme.border, paddingHorizontal: 4, paddingVertical: 3, borderRadius: 4 },
        type: { fontSize: 12, color: theme.subText },
        title: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 15, marginBottom: 5 },
        age: { fontSize: 12, color: theme.subText },
        categoryContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        categoryTitle: { color: theme.subText, marginTop: 10, backgroundColor: theme.panel, paddingHorizontal: 3, paddingVertical: 2, borderRadius: 8 },
        categoryIcon: { marginTop: 5, color: theme.subText },
        rating: { fontSize: 12, color: theme.subText },
    }));

    const styles = useThemedStyles(theme => ({
        container: { flex: 1, backgroundColor: theme.bg, padding: 10 },
        header: { fontSize: 24, fontWeight: 'bold', color: theme.text },
        row: { justifyContent: 'space-between', marginBottom: 10 },
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

    const openResource = (item: any) => {
        const data = {
            id: item.id,
            type: item.type,
            title: item.title,
            age: item.age,
            category: item.category,
            rating: item.rating,
        }
        console.log(JSON.stringify(data));
        addResource(data);
        router.push({
            pathname: "/resource/[id]",
            params: { id: data.id },
        });
    }

    return (
        <View style={styles.container}>
            <HeaderTabItem
                title='Resource Library'
                subTitle='200+ books and activities'
            />

            {/* Search Box با استفاده از کامپوننت عمومی */}
            <SearchContainer
                query={query}
                onChangeQuery={setQuery}
                onDebouncedQuery={handleDebouncedQuery}
                placeholder="Search Resources..."
            />

            {/* Category Tabs */}
            <View style={{ flexDirection: 'row', marginBottom: 10, gap: 5, paddingVertical: 10, borderBottomWidth: 1, borderColor: theme.border }}>
                {["All", "Book", "Activity", "Video", "Saved"].map((cat) => (
                    <TouchableOpacity key={cat} onPress={() => handleCategoryChange(cat)}>
                        <ThemedText
                            type="subText"
                            style={{
                                color: selectedCategory === cat ? '#fff' : theme.text,
                                borderWidth: 1,
                                borderColor: selectedCategory === cat ? theme.tint : theme.border,
                                backgroundColor: selectedCategory === cat ? theme.tint : theme.bg,
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
            <FlatList
                data={filteredResources}
                extraData={filteredResources}
                keyExtractor={(item) => item.id!}
                numColumns={2}
                style={{ flex: 1 }}
                columnWrapperStyle={styles.row}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 60 }}
                removeClippedSubviews={false}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <ResourceItem
                        onPress={() => openResource(item)}
                        styles={stylesFlatListItem}
                        {...item}
                    />
                )}
            />
        </View>
    );
};

export default ResourceLibrary;

