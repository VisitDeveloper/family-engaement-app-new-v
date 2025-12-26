import { useThemedStyles } from "@/hooks/use-theme-style";
import { Ionicons } from "@expo/vector-icons"; // اگر Expo استفاده نمی‌کنی باید react-native-vector-icons نصب کنی
import React, { useState, useEffect } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface RatingProps {
    maxRating?: number;
    size?: number;
    onRatingChange?: (e: any) => void;
    initialRating?: number;
}

const Rating = ({ maxRating = 5, size = 32, onRatingChange, initialRating = 0 }: RatingProps) => {
    const [rating, setRating] = useState(initialRating);

    // Update rating when initialRating changes
    useEffect(() => {
        setRating(initialRating);
    }, [initialRating]);

    const handlePress = (value: any) => {
        setRating(value);
        if (onRatingChange) onRatingChange(value);
    };

    const styles = useThemedStyles((theme) => ({
        container: {
            flexDirection: "column",
            alignItems: "center",
            gap: 25
        },
        innerBox: {
            flexDirection: 'row', alignItems: 'center'
        },
        star: {
            marginHorizontal: 3,
        },
        text: {
            marginLeft: 10,
            fontWeight: 500,
            fontSize: 25,
            color: theme.text
        },
    }))

    return (
        <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel={`Rating: ${rating} out of ${maxRating} stars`}>
            <View style={styles.innerBox}>

                {Array.from({ length: maxRating }, (_, index) => {
                    const starValue = index + 1;
                    const isSelected = starValue <= rating;
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handlePress(starValue)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={`Rate ${starValue} out of ${maxRating} stars`}
                            accessibilityHint={isSelected 
                                ? `Currently selected. Double tap to change rating to ${starValue} stars`
                                : `Double tap to rate ${starValue} out of ${maxRating} stars`}
                            accessibilityState={{ selected: isSelected }}
                        >
                            <Ionicons
                                name={starValue <= rating ? "star" : "star-outline"}
                                size={size}
                                color={starValue <= rating ? "#FFD700" : "#999"}
                                style={styles.star}
                                accessibilityElementsHidden={true}
                                importantForAccessibility="no"
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
            <View>
                <ThemedText style={styles.text}> {rating} of {maxRating}</ThemedText>
            </View>
        </View>
    );
};



export default Rating;
