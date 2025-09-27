import { useThemedStyles } from "@/hooks/use-theme-style";
import { Ionicons } from "@expo/vector-icons"; // اگر Expo استفاده نمی‌کنی باید react-native-vector-icons نصب کنی
import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface RatingProps {
    maxRating?: number;
    size?: number;
    onRatingChange?: (e: any) => void
}

const Rating = ({ maxRating = 5, size = 32, onRatingChange }: RatingProps) => {
    const [rating, setRating] = useState(0);

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
        <View style={styles.container}>
            <View style={styles.innerBox}>

                {Array.from({ length: maxRating }, (_, index) => {
                    const starValue = index + 1;
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handlePress(starValue)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={starValue <= rating ? "star" : "star-outline"}
                                size={size}
                                color={starValue <= rating ? "#FFD700" : "#999"}
                                style={styles.star}
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
