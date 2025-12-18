import HeaderInnerPage from '@/components/reptitive-component/header-inner-page';
import { ThemedText } from '@/components/themed-text';
import Rating from '@/components/ui/rating';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { resourceService } from '@/services/resource.service';
import { useStore } from '@/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, TouchableOpacity, View } from 'react-native';

const RatingScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const theme = useStore((s) => s.theme);

    const resourceItem = useStore((state: any) =>
        state.getResourceById(`${id}`)
    );
    const addResource = useStore((state: any) => state.addResource);
    const [rating, setRating] = useState<number>(resourceItem?.userRating || 0);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Update rating when resourceItem changes
    useEffect(() => {
        if (resourceItem?.userRating) {
            setRating(resourceItem.userRating);
        }
    }, [resourceItem?.userRating]);


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
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.panel,
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
        if (!rating || rating === 0) {
            Alert.alert("Error", "Please select a rating first.");
            return;
        }

        if (!id || typeof id !== 'string') {
            Alert.alert("Error", "Invalid resource ID.");
            return;
        }

        setIsSubmitting(true);
        try {
            await resourceService.rateResource(id, { rating });
            
            // Fetch updated resource from API to get latest averageRating, ratingsCount, etc.
            try {
                const updatedResourceData = await resourceService.getById(id);
                
                // Update resource in store with all updated data
                addResource({
                    id: updatedResourceData.id,
                    title: updatedResourceData.title,
                    description: updatedResourceData.description,
                    type: updatedResourceData.type,
                    category: updatedResourceData.category,
                    ageRange: updatedResourceData.ageRange,
                    imageUrl: updatedResourceData.imageUrl,
                    contentUrl: updatedResourceData.contentUrl,
                    averageRating: updatedResourceData.averageRating,
                    ratingsCount: updatedResourceData.ratingsCount,
                    createdBy: updatedResourceData.createdBy,
                    isSaved: updatedResourceData.isSaved,
                    userRating: updatedResourceData.userRating,
                    createdAt: updatedResourceData.createdAt,
                    updatedAt: updatedResourceData.updatedAt,
                });
            } catch (fetchError) {
                console.error('Error fetching updated resource:', fetchError);
                // If fetch fails, still update with what we know
                if (resourceItem) {
                    const updatedResource = {
                        ...resourceItem,
                        userRating: rating,
                    };
                    addResource(updatedResource);
                }
            }
            
            Alert.alert("Success", "Rating submitted successfully!", [
                {
                    text: "OK",
                    onPress: () => router.back(),
                },
            ]);
        } catch (error: any) {
            console.error('Error submitting rating:', error);
            Alert.alert(
                "Error",
                error.message || "Failed to submit rating. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
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
                    <Rating 
                        maxRating={5} 
                        size={40} 
                        initialRating={resourceItem?.userRating || 0}
                        onRatingChange={(val) => setRating(val)} 
                    />
                </View>

                <Image
                    source={{ uri: resourceItem?.imageUrl ? resourceItem.imageUrl : "" }}
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

                <TouchableOpacity 
                    onPress={handleRatingSubmit} 
                    style={[styles.readBtn, isSubmitting && { opacity: 0.6 }]}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <ThemedText style={styles.readText}>
                            Submit Rating
                        </ThemedText>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

export default RatingScreen;
