// app/book/[id].tsx
import HeaderInnerPage from '@/components/reptitive-component/header-inner-page';
import TimelineItem from '@/components/reptitive-component/timeline-item';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { useStore } from '@/store';
import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SampleTimeLine = () => {
    const router = useRouter();
    const theme = useStore((s) => s.theme);
    const insets = useSafeAreaInsets();

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

            <HeaderInnerPage
                title='Back to Timeline'
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
                showsVerticalScrollIndicator={false}>
                <TimelineItem
                    name='Ms. Alvarez'
                    seen='2 hours ago'
                    desc='Sarah built an amazing tower with 20 blocks today! She showed excellent spatial reasoning and counted each block as she added it. This demonstrates her growing math skills and patience.'
                    styles={styles}
                    numberOfComment={1}
                    numberOfLike={3}
                    commenter='Mom'
                    commnet='This is wonderful! Thank you for sharing.'
                    // require('./../../assets/images/partial-react-logo.png')
                    image={require('./../assets/images/timeline-1.jpg')}
                />
            </ScrollView>
        </View>
    );
};

export default SampleTimeLine;
