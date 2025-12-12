import { Colors } from "@/constants/theme";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
    const router = useRouter()
    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
            <View style={styles.profileBack}>
                <TouchableOpacity onPress={() => router.back()} style={{}}>
                    <Ionicons name="chevron-back" size={24} color={Colors.light.text} style={{ paddingBottom: 15 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>Profile</Text>
            </View>
            {/* User Info Card */}
            <View style={styles.card}>
                <Image
                    source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
                    style={styles.avatar}
                />
                <Text style={styles.name}>Maria Rodriguez</Text>
                <Text style={styles.relation}>Parent - Sarah Rodriguez</Text>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>Math</Text>
                </View>
            </View>

            {/* Classrooms Attached */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Classrooms Attached</Text>
                <View style={styles.item}>
                    <Image
                        source={{ uri: 'https://picsum.photos/50' }}
                        style={styles.itemAvatar}
                    />
                    <Text style={styles.itemText}>Room 4A Class</Text>
                </View>
            </View>

            {/* Common Groups */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Common Groups</Text>
                <View style={styles.item}>
                    <Image
                        source={{ uri: 'https://picsum.photos/50' }}
                        style={styles.itemAvatar}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemText}>Room 4A Class Updates</Text>
                    </View>
                    <View style={styles.groupTag}>
                        <Text style={styles.groupTagText}>Group</Text>
                    </View>
                </View>
            </View>

            {/* Send Message Button */}
            <TouchableOpacity style={styles.button}>
                <Feather name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Send Message</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f9f9",
        paddingTop: 10,
    },
    profileBack: {
        flexDirection: "row",
        alignItems: "center",
        gap: 30,
        marginBottom: 10,
        borderBottomColor: Colors.light.tabBarBorderColor,
        borderBottomWidth: 2,
        borderStyle: 'solid',
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderStyle: 'solid',
        borderColor: Colors.light.tabBarBorderColor,
        borderWidth: 1,
        elevation: 2,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignSelf: "center",
        marginBottom: 12,
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 4,
    },
    relation: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 8,
    },
    tag: {
        alignSelf: "center",
        backgroundColor: "#eee",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 12,
        color: "#333",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
    },
    itemAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    itemText: {
        fontSize: 14,
        flex: 1,
    },
    groupTag: {
        backgroundColor: "#eee",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    groupTagText: {
        fontSize: 12,
        color: "#333",
    },
    button: {
        flexDirection: "row",
        backgroundColor: "#9c27b0",
        padding: 16,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
        marginBottom: 24,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
