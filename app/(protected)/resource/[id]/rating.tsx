import HeaderInnerPage from '@/components/reptitive-component/header-inner-page';
import { ThemedText } from '@/components/themed-text';
import Rating from '@/components/ui/rating';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { useStore } from '@/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, TouchableOpacity, View } from 'react-native';

const RatingScreen = () => {
    const { id } = useLocalSearchParams();
    const theme = useStore((s) => s.theme);

    const resourceItem = useStore((state: any) =>
        state.getResourceById(`${id}`)
    );
    const [rating, setRating] = useState<number>(0);


    const styles = useThemedStyles((t) => ({
        container: { flex: 1, padding: 10, backgroundColor: t.bg },
        containerScrollBox: {
            flex: 1, marginTop: 10,
        },
        rateBox: {
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 10,
            backgroundColor: t.bg,
            padding: 10,
            gap: 25
        },
        cover: {
            width: '100%',
            height: 225,
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
        titleBox: {
            flexDirection: 'column',
            gap: 10
        },
        desc: { marginTop: 15, lineHeight: 20 },
        readBtn: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.tint,
            paddingVertical: 12,
            borderRadius: 8,
            gap: 6,
            marginTop: 25,
            marginBottom: 80
        },
        readText: { color: 'white', fontWeight: '600' },
    }));

    if (!resourceItem) {
        return (
            <View style={styles.container}>
                <ThemedText type="default">Loading resource...</ThemedText>
            </View>
        );
    }

    const handleRatingSubmit = async () => {
        if (!rating) {
            alert("Please select a rating first.");
            return;
        }

        console.log('ok', rating)
        // try {
        //     const res = await fetch("https://your-api.com/resources/rating", {
        //         method: "POST",
        //         headers: {
        //             "Content-Type": "application/json",
        //         },
        //         body: JSON.stringify({
        //             resourceId: resourceItem.id,
        //             rating: rating,
        //         }),
        //     });

        //     if (!res.ok) throw new Error("Failed to submit rating");

        //     alert("Rating submitted successfully!");
        // } catch (err) {
        //     console.error(err);
        //     alert("Something went wrong!");
        // }
    };


    return (
        <View style={styles.container}>
            <HeaderInnerPage
                title='Rate Resource'
            />

            <ScrollView style={styles.containerScrollBox} showsVerticalScrollIndicator={false}>

                <View style={styles.rateBox}>

                    <ThemedText type="default" style={{ marginHorizontal: 'auto', color: theme.subText }}>
                        Choose your rating
                    </ThemedText>
                    <Rating maxRating={5} size={40} onRatingChange={(val) => setRating(val)} />
                </View>

                <Image
                    source={require('./../../../../assets/images/timeline-1.jpg')}
                    style={styles.cover}
                    resizeMode="cover"
                />

                <View style={styles.chipRow}>
                    <View style={styles.chip}>
                        <Ionicons name="book-outline" size={16} color={theme.text} />
                        <ThemedText type="subText">
                            {resourceItem?.type!}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.titleBox}>
                    <ThemedText type='middleTitle' style={{ marginTop: 10 }}>
                        {resourceItem?.title!}
                    </ThemedText>
                    <ThemedText type='text' style={{ fontWeight: 500, color: theme.subText }}>
                        {resourceItem?.category!} • {resourceItem?.age!}
                    </ThemedText>
                </View>

                <ThemedText type="default" style={styles.desc}>
                    A classic story about the transformation of a caterpillar into a beautiful butterfly.
                </ThemedText>

                <TouchableOpacity onPress={handleRatingSubmit} style={styles.readBtn}>

                    <ThemedText style={styles.readText}>
                        Submit Rating
                    </ThemedText>

                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

export default RatingScreen;
