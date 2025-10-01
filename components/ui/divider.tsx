import { useStore } from "@/store"
import { View } from "react-native"

const Divider = () => {
    const theme = useStore((state) => state.theme)
    return (
        <View style={{ width: '100%', height: 1, backgroundColor: theme.border, marginVertical: 15 }} />
    )
}
export default Divider