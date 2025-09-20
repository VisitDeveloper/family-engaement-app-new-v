import { useStore } from "@/store";
import { MaterialIcons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./../themed-text";


export interface ResourceItemProps {
    id?: string;
    type: string;
    title: string;
    age: string;
    category: string;
    rating: number;
    image: any;
    icon?: React.ReactNode | React.ReactElement;
    styles?: any;
    onPress?: (i: any) => void
}

const ResourceItem = (props: ResourceItemProps) => {
    const theme = useStore(state => state.theme)
    return (
        <View style={props.styles.item}>
            <TouchableOpacity onPress={props.onPress}>
                <Image source={props.image} style={props.styles.image} />
            </TouchableOpacity>
            <View style={props.styles.textContainer}>
                <View style={props.styles.typeContainer}>
                    <View style={props.styles.typeItem}>
                        {props.icon!}
                        <Text style={props.styles.type}>{props.type}</Text>
                    </View>

                    <Text style={props.styles.rating}>⭐ {props.rating}</Text>
                </View>
                <Text style={props.styles.title}>{props.title}</Text>
                <Text style={props.styles.age}>{props.age}</Text>
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

