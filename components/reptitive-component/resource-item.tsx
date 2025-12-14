import { useStore } from "@/store";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./../themed-text";


export interface ResourceItemProps {
    id?: string;
    type: 'book' | 'activity' | 'video' | string; // Allow string for backward compatibility
    title: string;
    age?: string; // For backward compatibility
    ageRange?: string | null; // New API field
    category: string;
    rating?: number; // For backward compatibility
    averageRating?: number; // New API field
    image?: any; // For backward compatibility
    imageUrl?: string | null; // New API field
    icon?: React.ReactNode | React.ReactElement;
    styles?: any;
    onPress?: (i: any) => void
}

const ResourceItem = (props: ResourceItemProps) => {
    const theme = useStore(state => state.theme)
    
    // Handle backward compatibility: use imageUrl if available, fallback to image
    const imageSource = props.imageUrl 
        ? { uri: props.imageUrl } 
        : props.image || require('@/assets/images/timeline-1.jpg');
    
    // Handle backward compatibility: use averageRating if available, fallback to rating
    const rating = props.averageRating !== undefined ? props.averageRating : (props.rating || 0);
    
    // Handle backward compatibility: use ageRange if available, fallback to age
    const age = props.ageRange || props.age || '';
    
    // Capitalize type for display
    const displayType = props.type ? props.type.charAt(0).toUpperCase() + props.type.slice(1) : '';
    
    return (
        <View style={props.styles.item}>
            <TouchableOpacity onPress={props.onPress}>
                <Image source={imageSource} style={props.styles.image} />
            </TouchableOpacity>
            <View style={props.styles.textContainer}>
                <View style={props.styles.typeContainer}>
                    <View style={props.styles.typeItem}>
                        {props.icon!}
                        <Text style={props.styles.type}>{displayType}</Text>
                    </View>

                    <Text style={props.styles.rating}>⭐ {rating.toFixed(1)}</Text>
                </View>
                <Text style={props.styles.title}>{props.title}</Text>
                {age && <Text style={props.styles.age}>{age}</Text>}
                <View style={props.styles.categoryContainer}>
                    <View style={props.styles.categoryTitle}>
                        <ThemedText type="subText" style={{color:theme.subText}}>
                            {props.category}
                        </ThemedText>
                    </View>
                    <MaterialIcons name="bookmark-border" style={props.styles.categoryIcon} size={20} />
                    {/* <MaterialCommunityIcons name="bookmark" size={24} color="black" /> */}
                </View>
            </View>
        </View>
    )
}
export default ResourceItem

