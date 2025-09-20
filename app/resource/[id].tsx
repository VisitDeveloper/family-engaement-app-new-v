// app/book/[id].tsx
import HeaderThreeSections from '@/components/reptitive-component/header-three-sections';
import { ThemedText } from '@/components/themed-text';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { useStore } from '@/store';
import { AntDesign, Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BookDetailScreen = () => {
    const router = useRouter();
    const theme = useStore((s) => s.theme);
    const insets = useSafeAreaInsets();

    const param = usePathname();
    const pathID = param.split('/');
    const id = pathID.pop();

    const resourceItem = useStore((state: any) => state.getResourceById(`${id}`));
    console.log('id', id, resourceItem);


    const styles = useThemedStyles((t) => ({
        container: { flex: 1, backgroundColor: t.bg, padding: 10 },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 10,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: t.border,
        },
        headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        backBtn: { padding: 6 },
        cover: {
            width: '100%',
            height: 180,
            borderRadius: 12,
            marginTop: 12,
        },
        chipRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
        },
        chip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: t.panel,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: t.border
        },
        rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        desc: { marginTop: 10, lineHeight: 20 },
        actionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 20,
            gap: 10,
        },
        readBtn: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.tint,
            paddingVertical: 12,
            borderRadius: 8,
            gap: 6,
        },
        readText: { color: 'white', fontWeight: '600' },
        shareBtn: {
            padding: 12,
            borderWidth: 1,
            borderColor: t.tint,
            borderRadius: 8,
        },
        scroll: {
            padding: 16,
            paddingBottom: insets.bottom + 30,
        },
    }) as const);

    return (
        <View style={styles.container}>

            <HeaderThreeSections
                title={resourceItem.title}
                desc={`${resourceItem.category} • ${resourceItem.age}`}
                icon={<Ionicons name="bookmark-outline" size={20} color={theme.text} />}
                colorDesc={theme.subText}
            />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Cover */}
                <Image
                    source={require('./../../assets/images/timeline-1.jpg')}
                    style={styles.cover}
                    resizeMode="cover"
                />

                {/* Chips */}
                <View style={styles.chipRow}>
                    <View style={styles.chip}>
                        <Ionicons name="book-outline" size={16} color={theme.text} />
                        <ThemedText type="subText">
                            {resourceItem.type}
                        </ThemedText>
                    </View>
                    <View style={styles.rating}>
                        <FontAwesome name="star" size={16} color="#FACC15" />
                        <ThemedText type="subText">4.8</ThemedText>
                    </View>
                </View>

                {/* Description */}
                <ThemedText type="default" style={styles.desc}>
                    A classic story about the transformation of a caterpillar into a beautiful butterfly.
                </ThemedText>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.readBtn}>
                        <Feather name="eye" size={18} color="white" />
                        <ThemedText style={styles.readText}>Read Book</ThemedText>
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
