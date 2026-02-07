import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import Badge from "@/components/ui/badge";
import Divider from "@/components/ui/divider";
import { CheckboxIcon, CheckedboxIcon } from "@/components/ui/icons/common-icons";
import { CameraIcon, PencilIcon, PersonWithPlusIcon, SmallUsersIcon, UsersIcon } from "@/components/ui/icons/messages-icons";
import SelectListBottomSheet from "@/components/ui/select-list-bottom-sheet";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { messagingService } from "@/services/messaging.service";
import { userService } from "@/services/user.service";
import { useStore } from "@/store";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Invitee = {
  id: string;
  name: string;
  subtitle: string;
  avatar?: string | null;
  initials?: string;
  isAdmin?: boolean;
  isOnline?: boolean;
  role?: string;
};

type Classroom = {
  id: string;
  name: string;
  avatar?: string | null;
  initials?: string;
};

export default function CreateGroupScreen() {
  const router = useRouter();
  const theme = useStore((state) => state.theme);
  const currentUser = useStore((state: any) => state.user);
  const currentUserId = currentUser?.id || null;
  const addConversation = useStore((state: any) => state.addConversation);

  const [data, setData] = useState<Invitee[]>([]);
  const [group, setGroup] = useState<Classroom[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [listSheetOpen, setListSheetOpen] = useState<"users" | "classrooms" | null>(null);

  const PREVIEW_LIMIT = 5;

  const styles = useThemedStyles((theme) => ({
    container: { flex: 1, backgroundColor: theme.bg },
    containerScrollView: {
      flex: 1,
      backgroundColor: theme.bg,
      paddingHorizontal: 12,
      // marginBottom: 30,
    },
    card: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
      backgroundColor: theme.bg,
      borderColor: theme.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 10,
      color: theme.text,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    imageWrapper: {
      alignSelf: "center",
      marginVertical: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      width: "100%",
      paddingVertical: 16,
      paddingHorizontal: 10,
      paddingBottom: 4,
      borderRadius: 10,
    },
    groupName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      // marginTop: 8,
    },
    subText: { fontSize: 14, color: theme.subText, marginBottom: 6 },
    optionItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: theme.border,
      gap: 15,
    },
    footerButton: {
      backgroundColor: theme.tint,
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: "center",
      marginVertical: 20,
    },
    footerButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
    rows: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    leftRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#ECECF0",
      alignItems: "center",
      justifyContent: "center",
    },
    initials: { color: "#121212", fontWeight: 400, fontSize: 12 },
    name: { fontSize: 16, fontWeight: "400", color: theme.text },
    subtitle: { fontSize: 12, color: theme.subText },

    numberOfInvitees: {
      flexDirection: "row",
      gap: 4,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
      paddingVertical: 1,
      backgroundColor: theme.panel,
      borderRadius: 6,
    },
    wrapperInviteesShows: {
      flexDirection: "row",
      gap: 5,
      alignItems: "center",
    },
  }));

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const response = await userService.getAll({ limit: 100 });
      const mappedContacts: Invitee[] = response.users
        .filter((user) => user.id !== currentUserId)
        .map((user) => ({
          id: user.id,
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email,
          subtitle:
            user.role === "admin"
              ? "Admin"
              : user.role === "teacher"
                ? "Teacher"
                : "Parent",
          avatar: user.profilePicture || null,
          initials:
            `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""
              }`.toUpperCase() || user.email[0].toUpperCase(),
          isAdmin: user.role === "admin",
          role: user.role,
        }));
      setData(mappedContacts);
    } catch (error: any) {
      console.error("Error loading contacts:", error);
      Alert.alert("Error", error.message || "Failed to load contacts");
    } finally {
      setLoadingContacts(false);
    }
  }, [currentUserId]);

  const loadClassrooms = useCallback(async () => {
    setLoadingClassrooms(true);
    try {
      const classrooms = await messagingService.getClassrooms();
      const mappedClassrooms: Classroom[] = classrooms.map((classroom) => {
        const name =
          typeof classroom.name === "string"
            ? classroom.name
            : classroom.name && typeof classroom.name === "object"
              ? (Object.values(classroom.name)[0] as string) || "Classroom"
              : "Classroom";
        return {
          id: classroom.id,
          name: name,
          avatar: classroom.imageUrl || null,
          initials: name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase(),
        };
      });
      setGroup(mappedClassrooms);
    } catch (error: any) {
      console.error("Error loading classrooms:", error);
      // Don't show alert for classrooms as it's optional
    } finally {
      setLoadingClassrooms(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
    loadClassrooms();
  }, [loadContacts, loadClassrooms]);

  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllUsers = () => {
    if (selected.length === data.length) {
      setSelected([]);
    } else {
      setSelected(data.map((person) => person.id));
    }
  };

  const [selectedGroup, setSelectedGroup] = useState<string[]>([]);

  const toggleSelectGroup = (id: string) => {
    setSelectedGroup((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllGroup = () => {
    if (selectedGroup.length === group.length) {
      setSelectedGroup([]);
    } else {
      setSelectedGroup(group.map((person) => person.id));
    }
  };

  const [showInputOfGroupName, setShowInputOFGroupName] =
    useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>("");

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to select images!"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    // if (selected.length < 3) {
    //   Alert.alert('Error', 'Please select at least 3 members');
    //   return;
    // }

    // if (selectedGroup.length < 1) {
    // Alert.alert('Error', 'Please select at least 1 classroom');
    // return;
    // }

    setCreating(true);
    try {
      const newConversation = await messagingService.createConversation({
        type: "group",
        name: groupName.trim(),
        description:
          selectedGroup.length > 0
            ? `Attached ${selectedGroup.length} classroom(s)`
            : undefined,
        memberIds: selected,
      });

      // Add the new conversation to the store
      addConversation(newConversation);

      // Navigate to the new group chat
      router.replace({
        pathname: "/chat/[chatID]",
        params: { chatID: newConversation.id },
      });
    } catch (error: any) {
      console.error("Error creating group:", error);
      Alert.alert("Error", error.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderInnerPage
        title="Create New Group"
        addstyles={{ marginBottom: 0 }}
      />

      <ScrollView
        style={styles.containerScrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Image + Name */}
        <View style={[styles.imageWrapper]}>
          <TouchableOpacity onPress={pickImage}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                }}
              />
            ) : (
              <View
                style={{
                  margin: "auto",
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: theme.panel,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <Image source={require("@/assets/images/image-placeholder.png")} style={{ width: '100%', height: "100%" }} />
              </View>
            )}
            <View
              style={{
                position: "absolute",
                bottom: 2,
                right: 0,
                backgroundColor: theme.tint,
                borderRadius: 40,
                width: 20,
                height: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CameraIcon
                size={12}
                color="#fff"
              />
            </View>
          </TouchableOpacity>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginTop: 16,
            }}
          >
            {showInputOfGroupName ? (
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 10,
                  width: 150,
                  padding: 10,
                  color: theme.text,
                }}
                value={groupName}
                onChangeText={setGroupName}
              />
            ) : (
              <ThemedText style={styles.groupName}>
                {groupName || "Group Name"}
              </ThemedText>
            )}

            <TouchableOpacity onPress={() => setShowInputOFGroupName(!showInputOfGroupName)}>
              <PencilIcon
                size={14}
                color={theme.tint}
              />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.subText}>Group</ThemedText>
        </View>

        {/* Attach Classrooms */}
        <View style={styles.card}>
          {/* <ThemedText style={styles.sectionTitle}>Attach Classrooms</ThemedText>
                    <ThemedText style={styles.subText}>Add At Least 1 Classroom</ThemedText> */}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "column",
                gap: 1,
                alignItems: "flex-start",
              }}
            >
              <ThemedText
                type="middleTitle"
                style={{ color: theme.text, marginLeft: 0, fontWeight: 500 }}
              >
                Attach Classrooms
              </ThemedText>
              <ThemedText
                type="subText"
                style={{ color: theme.subText, marginRight: 35 }}
              >
                Add At Least 1 Classroom
              </ThemedText>
            </View>

            <View style={styles.wrapperInviteesShows}>
              {/* {selectedGroup.length !== 0 && (
                <TouchableOpacity
                  onPress={selectAllGroup}
                  style={[
                    styles.numberOfInvitees,
                    { backgroundColor: theme.emergencyBackground, paddingVertical: 5 },
                  ]}
                >
                  <ThemedText type="subLittleText" style={{ color: "#212121" }}>
                    Select All
                  </ThemedText>
                </TouchableOpacity>
              )} */}

              {/* <View
                style={[
                  styles.numberOfInvitees,
                  {
                    backgroundColor:
                      selectedGroup.length >= 3 ? "#4CAF50" : theme.panel,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="google-classroom"
                  size={15}
                  color={selectedGroup.length === 3 ? "#fff" : theme.text}
                />
                <ThemedText
                  style={{
                    color: selectedGroup.length === 3 ? "#fff" : theme.text,
                    paddingVertical: 3,
                  }}
                  type="subText"
                >
                  {selectedGroup.length}
                </ThemedText>
              </View> */}
            </View>
          </View>

          {loadingClassrooms ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={theme.tint} />
            </View>
          ) : group.length > 0 ? (
            group.slice(0, PREVIEW_LIMIT).map((room) => (
              <View key={room.id}>
                <TouchableOpacity
                  style={styles.rows}
                  onPress={() => toggleSelectGroup(room.id)}
                >
                  <View style={styles.leftRow}>
                    <View style={{ position: "relative" }}>
                      {room.avatar ? (
                        <Image
                          source={{ uri: room.avatar }}
                          style={styles.avatar}
                        />
                      ) : (
                        // <View
                        //   style={[styles.avatar, { backgroundColor: "#aaa" }]}
                        // >
                        //   <ThemedText style={styles.initials}>
                        //     {room.initials}
                        //   </ThemedText>
                        // </View>
                        <Image
                          source={require("@/assets/images/classroom-placeholder.png")}
                          style={styles.avatar}
                        />
                      )}
                      <View style={{ position: "absolute", bottom: -4, right: -4, backgroundColor: theme.bg, borderRadius: 50, width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
                        <View style={{ backgroundColor: "#2B7FFF", borderRadius: 50, width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
                          <SmallUsersIcon color="#fff" size={8} />
                        </View>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <ThemedText style={styles.name}>{room.name}</ThemedText>
                      </View>
                    </View>
                  </View>


                  {selectedGroup.includes(room.id) ? (
                    <CheckedboxIcon
                      size={22}
                      color={theme.tint}
                    />
                  ) : (
                    <CheckboxIcon
                      size={22}
                      color={theme.text}
                    />
                  )}
                </TouchableOpacity>
                <Divider horizontal={true} marginVertical={5} />
              </View>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ThemedText style={{ color: theme.subText }}>
                No classrooms found
              </ThemedText>
            </View>
          )}

          {group.length > PREVIEW_LIMIT && (
            <TouchableOpacity onPress={() => setListSheetOpen("classrooms")}>
              <ThemedText
                style={{ color: theme.tint, textAlign: "center", marginTop: 8 }}
              >
                See All Classrooms
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Add Members */}
        <View style={styles.card}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "column",
                gap: 1,
                alignItems: "flex-start",
              }}
            >
              <ThemedText type="middleTitle" style={{ color: theme.text, fontWeight: 500 }}>
                Add Members
              </ThemedText>
              <ThemedText type="subText" style={{ color: theme.subText }}>
                Add At Least 3 Members
              </ThemedText>
            </View>

            <View style={styles.wrapperInviteesShows}>
              {/* {selected.length !== 0 && (
                <TouchableOpacity
                  onPress={selectAllUsers}
                  style={[
                    styles.numberOfInvitees,
                    { backgroundColor: theme.emergencyBackground },
                  ]}
                >
                  <ThemedText type="subLittleText" style={{ color: "#212121" }}>
                    Select All
                  </ThemedText>
                  <Feather name={"check-square"} size={15} color={"#212121"} />
                </TouchableOpacity>
              )} */}

              <View
                style={[
                  styles.numberOfInvitees,
                  {
                    backgroundColor:
                      selected.length >= 3 ? "#4CAF50" : theme.panel,
                  },
                ]}
              >
                <UsersIcon
                  size={16}
                  color={selected.length === 3 ? "#fff" : theme.text}
                />
                <ThemedText
                  style={{
                    color: selected.length === 3 ? "#fff" : theme.text,
                  }}
                  type="subText"
                >
                  {selected.length}
                </ThemedText>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.optionItem}>
            <View
              style={{
                backgroundColor: theme.tint + "25",
                borderRadius: 50,
                width: 40,
                height: 40,
                position: "relative",
                alignItems: "center",
                justifyContent: "center",
                paddingLeft: 3,
              }}
            >
              <PersonWithPlusIcon size={16} color={theme.tint} />

              <View
                style={{
                  backgroundColor: theme.bg,
                  width: 10,
                  height: 10,
                  borderRadius: 50,
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <View style={{ backgroundColor: "#00C950", width: 8, height: 8, borderRadius: 50 }} />
              </View>
            </View>
            <ThemedText style={{ color: theme.text, fontWeight: 500 }}>
              Add New Contact
            </ThemedText>
          </TouchableOpacity>

          {loadingContacts ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={theme.tint} />
            </View>
          ) : data.length > 0 ? (
            data.slice(0, PREVIEW_LIMIT).map((person) => (
              <View key={person.id}>
                <TouchableOpacity
                  style={styles.rows}
                  onPress={() => toggleSelect(person.id)}
                >
                  <View style={styles.leftRow}>
                    {person.avatar ? (
                      <Image
                        source={{ uri: person.avatar }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View
                        style={[styles.avatar]}
                      >
                        <ThemedText style={styles.initials}>
                          {person.initials}
                        </ThemedText>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <ThemedText style={styles.name}>
                          {person.name}
                        </ThemedText>
                        {person.isAdmin && <Badge title="Admin" />}
                        {person.role === "teacher" && (
                          <View
                            style={{
                              marginLeft: 5,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              backgroundColor: theme.panel,
                              borderRadius: 4,
                            }}
                          >
                            <ThemedText
                              style={{ fontSize: 10, color: theme.text }}
                            >
                              Teacher
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={styles.subtitle}>
                        Last Seen: 2 hours ago
                      </ThemedText>
                    </View>
                  </View>


                  {selected.includes(person.id) ? (
                    <CheckedboxIcon
                      size={22}
                      color={theme.tint}
                    />
                  ) : (
                    <CheckboxIcon
                      size={22}
                      color={theme.text}
                    />
                  )}

                </TouchableOpacity>
                <Divider horizontal={true} marginVertical={5} />
              </View>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ThemedText style={{ color: theme.subText }}>
                No contacts found
              </ThemedText>
            </View>
          )}

          {data.length > PREVIEW_LIMIT && (
            <TouchableOpacity onPress={() => setListSheetOpen("users")}>
              <ThemedText
                style={{ color: theme.tint, textAlign: "center", marginTop: 8 }}
              >
                See All Contacts
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer Button */}
        <TouchableOpacity
          style={[
            styles.footerButton,
            (creating ||
              !groupName.trim() ||
              (selectedGroup.length < 1 && selected.length < 3)) && {
              opacity: 0.5,
            },
          ]}
          onPress={handleCreateGroup}
          disabled={
            creating ||
            !groupName.trim() ||
            (selectedGroup.length < 1 && selected.length < 3)
          }
        >
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <UsersIcon size={18} color="#fff" />
              <ThemedText style={styles.footerButtonText}>
                Create Group
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      <SelectListBottomSheet
        visible={listSheetOpen === "classrooms"}
        onClose={() => setListSheetOpen(null)}
        mode="classrooms"
        items={group}
        selectedIds={selectedGroup}
        onToggle={toggleSelectGroup}
        title="All Classrooms"
      />
      <SelectListBottomSheet
        visible={listSheetOpen === "users"}
        onClose={() => setListSheetOpen(null)}
        mode="users"
        items={data}
        selectedIds={selected}
        onToggle={toggleSelect}
        title="All Contacts"
      />
    </View>
  );
}
