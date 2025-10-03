import { useStore } from "@/store";
import { View } from "react-native";

interface DividerProps {
    horizontal?: boolean;
    height?: number;
    marginVertical?: number
}

const Divider = (props: DividerProps) => {
    const { horizontal = true, height = 15, marginVertical = 15 } = props
    const theme = useStore((state) => state.theme)
    if (horizontal) {
        return (
            <View style={{ width: '100%', height: 1, backgroundColor: theme.border, marginVertical: marginVertical, }} />
        )
    } else {
        // if horizental === false then this is vertical and you can insert your height
        return (
            <View style={{ height: height, width: 2, backgroundColor: theme.text }} />
        )
    }
}
export default Divider