import { useStore } from "@/store";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./../themed-text";

export interface ResourceItemProps {
  id?: string;
  type: "book" | "activity" | "video" | string; // Allow string for backward compatibility
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
  onPress?: (i: any) => void;
  isSaved?: boolean;
  onSavePress?: (id: string) => void;
}

const ResourceItem = (props: ResourceItemProps) => {
  const theme = useStore((state) => state.theme);

  // Handle backward compatibility: use imageUrl if available, fallback to image
  const imageSource = props.imageUrl
    ? { uri: props.imageUrl }
    : props.image || "";

  // Handle backward compatibility: use averageRating if available, fallback to rating
  const rating =
    props.averageRating !== undefined ? props.averageRating : props.rating || 0;

  // Handle backward compatibility: use ageRange if available, fallback to age
  const age = props.ageRange || props.age || "";

  // Capitalize type for display
  const displayType = props.type
    ? props.type.charAt(0).toUpperCase() + props.type.slice(1)
    : "";

  const handleSavePress = () => {
    if (props.id && props.onSavePress) {
      props.onSavePress(props.id);
    }
  };

  return (
    <View style={props.styles.item}>
      <TouchableOpacity 
        onPress={props.onPress} 
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${props.title}, ${displayType}, Rating: ${rating.toFixed(1)}`}
        accessibilityHint={`Double tap to view details of ${props.title}`}
      >
        <View>
          <Image 
            source={imageSource} 
            style={props.styles.image}
            accessibilityRole="image"
            accessibilityLabel={`Cover image for ${props.title}`}
          />
        </View>
        <View style={props.styles.textContainer}>
          <View style={props.styles.typeContainer}>
            <View style={props.styles.typeItem}>
              {props.icon!}
              <Text style={props.styles.type}>{displayType}</Text>
            </View>

            <Text style={props.styles.rating}>
              <FontAwesome name="star" size={16} color="#FACC15" />
              {rating.toFixed(1)}
            </Text>
          </View>
          <Text style={props.styles.title}>{props.title}</Text>
          {age && <Text style={props.styles.age}>{age}</Text>}
          <View style={props.styles.categoryContainer}>
            <View style={props.styles.categoryTitle}>
              <ThemedText type="subText" style={{ color: theme.subText }}>
                {props.category}
              </ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleSavePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={props.isSaved ? `Remove ${props.title} from saved` : `Save ${props.title}`}
        accessibilityHint={props.isSaved ? "Double tap to unsave this resource" : "Double tap to save this resource"}
        accessibilityState={{ selected: props.isSaved }}
        style={{
          position: "absolute",
          bottom: 5,
          right: 5,
        }}
      >
        <MaterialIcons
          name={props.isSaved ? "bookmark" : "bookmark-border"}
          style={[
            props.styles.categoryIcon,
            props.isSaved && { color: theme.tint },
          ]}
          size={20}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />
      </TouchableOpacity>
    </View>
  );
};
export default ResourceItem;
