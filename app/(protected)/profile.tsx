import { Colors } from "@/constants/theme";
import { useStore } from "@/store";
import { getDisplayName } from "@/utils/user-name";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SpeakableText } from "@/components/speakable-text";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useStore((state) => state.user);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <View style={styles.profileBack}>
        <TouchableOpacity onPress={() => router.back()} style={{}}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.light.text}
            style={{ paddingBottom: 15 }}
          />
        </TouchableOpacity>
        <SpeakableText style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
          Profile
        </SpeakableText>
      </View>
      {/* User Info Card */}
      <View style={styles.card}>
        <Image
          source={
            user?.profilePicture ? { uri: user.profilePicture } : { uri: "" }
          }
          style={styles.avatar}
        />
        <SpeakableText style={styles.name}>
          {getDisplayName(user?.firstName, user?.lastName, user?.name || "")}
        </SpeakableText>
        <SpeakableText style={styles.relation}>
          {user?.childName ? user.childName : ""}
        </SpeakableText>
      </View>

      {/* Classrooms Attached */}
      <View style={styles.card}>
        <SpeakableText style={styles.sectionTitle}>Classrooms Attached</SpeakableText>
        <View style={styles.item}>
          <Image
            source={{ uri: "https://picsum.photos/50" }}
            style={styles.itemAvatar}
          />
          <SpeakableText style={styles.itemText}>Room 4A Class</SpeakableText>
        </View>
      </View>

      {/* Common Groups */}
      <View style={styles.card}>
        <SpeakableText style={styles.sectionTitle}>Common Groups</SpeakableText>
        <View style={styles.item}>
          <Image
            source={{ uri: "https://picsum.photos/50" }}
            style={styles.itemAvatar}
          />
          <View style={{ flex: 1 }}>
            <SpeakableText style={styles.itemText}>Room 4A Class Updates</SpeakableText>
          </View>
          <View style={styles.groupTag}>
            <SpeakableText style={styles.groupTagText}>Group</SpeakableText>
          </View>
        </View>
      </View>

      {/* Send Message Button */}
      <TouchableOpacity style={styles.button}>
        <Feather
          name="send"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <SpeakableText style={styles.buttonText}>Send Message</SpeakableText>
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
    borderStyle: "solid",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderStyle: "solid",
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
    backgroundColor: "#f3f3f5",
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
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  tag: {
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
