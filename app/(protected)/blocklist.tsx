import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const groups = [
    { id: "5b", name: "Room 5B Class Updates", type: "group", image: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: "4a", name: "Room 4A Class Updates", type: "group", image: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: "4b", name: "Room 4B Class Updates", type: "group", image: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: "4c", name: "Room 4C Class Updates", type: "group", image: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: "4d", name: "Room 4D Class Updates", type: "group", image: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: "4e", name: "Room 4E Class Updates", type: "group", image: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: "4f", name: "Room 4F Class Updates", type: "group", image: "https://randomuser.me/api/portraits/men/32.jpg" },
];

const contacts = [
    { id: "1", name: "Principal Johnson", role: "Admin", lastSeen: "8:00 PM", image: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: "2", name: "Ms. Alvarez", lastSeen: "2:15 PM", initials: "MA" },
    { id: "3", name: "Mr. Rodriguez - Art", lastSeen: "Yesterday", initials: "MR" },
    { id: "4", name: "Mr. Carlos", lastSeen: "2 days ago", image: "https://randomuser.me/api/portraits/men/45.jpg" },
];

export default function NewMessageScreen() {
    const router = useRouter();
    const theme = useStore((state) => state.theme);

    const styles = useThemedStyles((t) => ({
        container: {
            flex: 1,
            backgroundColor: t.bg
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,

        },
        headerTitle: {
            marginLeft: 12,
            fontWeight: "600",
            color: t.text
        },
        sectionTitle: {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
            fontWeight: "600",
            color: t.text
        },
        row: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 8,
            paddingHorizontal: 12,
            minHeight: 60, // Minimum height for item
            maxHeight: 80, // Maximum height to control stretching
        },
        actionIcon: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#f4e9f7",
            alignItems: "center",
            justifyContent: "center",
        },
        itemName: {
            marginLeft: 12,
            fontSize: 16,
            fontWeight: "500",
            color: theme.text
        },
        avatar: {
            width: 48,
            height: 48,
            borderRadius: 24,
        },
        avatarPlaceholder: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#ccc",
            alignItems: "center",
            justifyContent: "center",
        },
        avatarInitials: {
            fontSize: 16,
            fontWeight: "600",
            color: "#333",
        },
        itemContent: {
            marginLeft: 12,
            flex: 1,
        },
        itemHeader: {
            flexDirection: "row",
            alignItems: "center",
        },
        roleBadge: {
            marginLeft: 8,
            paddingHorizontal: 8,
            paddingVertical: 2,
            fontSize: 12,
            backgroundColor: "#fde68a",
            color: "#92400e",
            borderRadius: 6,
            overflow: "hidden",
        },
        lastSeen: {
            fontSize: 12,
            color: t.subText,
            marginTop: 2,
        },
    }) as const);

    const renderItem = ({ item }: any) => {
        if (item.type === "action") {
            return (
                <TouchableOpacity style={styles.row}>
                    <View style={styles.actionIcon}>
                        <Ionicons name={item.icon} size={24} color="#a846c2" />
                    </View>
                    <Text style={styles.itemName}>{item.name}</Text>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity style={styles.row}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitials}>{item.initials}</Text>
                    </View>
                )}
                <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {item.role && <Text style={styles.roleBadge}>{item.role}</Text>}
                    </View>
                    {item.lastSeen && <Text style={styles.lastSeen}>Last Seen: {item.lastSeen}</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>


            <HeaderInnerPage
                title="Block/Unblock Contacts"
                addstyles={{ marginBottom: 20 }}
            />

            {/* Groups */}
            <ThemedText type="middleTitle" style={styles.sectionTitle}>Block Contacts</ThemedText>
            <FlatList
                data={groups}
                keyExtractor={(item) => item.id} renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false} />

        </View>
    );
}

const styles = StyleSheet.create({

});
