import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import Badge from "@/components/ui/badge";
import Divider from "@/components/ui/divider";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, ScrollView, TextInput, TouchableOpacity, View } from "react-native";


type Invitee = {
    id: string;
    name: string;
    subtitle: string;
    avatar?: string; // تصویر پروفایل
    initials?: string; // اگر عکس نبود
    isAdmin?: boolean;
    isOnline?: boolean;
};

const data: Invitee[] = [
    {
        id: "1",
        name: "Principal Johnson",
        subtitle: "Last Seen: 8:00 PM",
        avatar: "https://i.pravatar.cc/100?img=1",
        isAdmin: true,
    },
    {
        id: "2",
        name: "Ms. Alvarez",
        subtitle: "Last Seen: 2:15 PM",
        initials: "MA",
        isOnline: true,
    },
    {
        id: "3",
        name: "Mr. Rodriguez - Art",
        subtitle: "Last Seen: Yesterday",
        avatar: "https://i.pravatar.cc/100?img=2",
    },
    {
        id: "4",
        name: "Mr. Carlos",
        subtitle: "Last Seen: 2 days ago",
        avatar: "https://i.pravatar.cc/100?img=3",
    },
    {
        id: "5",
        name: "Sarah Rodriguez",
        subtitle: "Last Seen: 2 days ago",
        avatar: "https://i.pravatar.cc/100?img=4",
    },

    {
        id: "6",
        name: "Sarah Rodriguez",
        subtitle: "Last Seen: 2 days ago",
        avatar: "https://i.pravatar.cc/100?img=4",
    },
    {
        id: "7",
        name: "Sarah Rodriguez",
        subtitle: "Last Seen: 2 days ago",
        avatar: "https://i.pravatar.cc/100?img=4",
    },
];


const group: any[] = [
    {
        id: "1",
        name: "Room 5B Class",
        avatar: "https://i.pravatar.cc/100?img=1",
    },
    {
        id: "2",
        name: "Room 5A Class",
        avatar: "https://i.pravatar.cc/100?img=1",
    },
    {
        id: "3",
        name: "Room 4B Class",
        avatar: "https://i.pravatar.cc/100?img=1",
    },
];

export default function CreateGroupScreen() {
    const theme = useStore((state) => state.theme);

    const styles = useThemedStyles((theme) => ({
        container: { flex: 1, paddingHorizontal: 12, backgroundColor: theme.bg },
        containerScrollView: { flex: 1, backgroundColor: theme.bg, marginBottom:30 },
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
            width: '100%',
            paddingVertical: 40,
            paddingHorizontal: 10,
            borderRadius: 10
        },
        groupName: {
            fontSize: 16,
            fontWeight: "600",
            color: theme.text,
            marginTop: 8,
        },
        subText: { fontSize: 14, color: theme.subText, marginBottom: 6 },
        optionItem: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: theme.border,
            gap: 15
        },
        footerButton: {
            backgroundColor: theme.tint,
            padding: 14,
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
        avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ccc", alignItems: "center", justifyContent: "center" },
        initials: { color: "#fff", fontWeight: "600" },
        name: { fontSize: 16, fontWeight: "600", color: theme.text },
        subtitle: { fontSize: 12, color: theme.subText },

        numberOfInvitees: {
            flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 3, backgroundColor: theme.panel, borderRadius: 10
        },
        wrapperInviteesShows: {
            flexDirection: 'row', gap: 5, alignItems: 'center',
        },
    }));

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
    }


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
    }

    const [showInputOfGroupName, setShowInputOFGroupName] = useState<boolean>(false)
    const [groupName, setGroupName] = useState<string>('Group Name')

    return (
        <View style={styles.container}>
            <HeaderInnerPage
                title="Create New Group"
                addstyles={{ marginBottom: 20 }}
            />

            <ScrollView
                style={styles.containerScrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Group Image + Name */}
                <View style={styles.imageWrapper}>
                    <TouchableOpacity>
                        {/* <Image
                            source={{ uri: "https://via.placeholder.com/80" }}
                            style={{ width: 80, height: 80, borderRadius: 40 }}
                        /> */}
                        <View style={{ margin: 'auto', width: 100, height: 100, borderRadius: 50, backgroundColor: theme.panel, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Feather name="users" size={28} color={theme.text} />
                        </View>
                        <View style={{ position: "absolute", bottom: 2, right: 0, backgroundColor: '#fff', borderRadius: 40, width: 20, height: 20 }}>

                            <Feather
                                name="camera"
                                size={15}
                                color={theme.tint}
                                style={{ margin: 'auto' }}
                            />
                        </View>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>

                        {showInputOfGroupName ? <TextInput style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 10, width: 150, padding: 10, color: theme.text }} value={groupName} onChangeText={setGroupName} /> : <ThemedText style={styles.groupName}>{groupName}</ThemedText>}

                        <AntDesign name="edit" size={20} color={theme.tint} onPress={() => setShowInputOFGroupName(!showInputOfGroupName)} />
                    </View>
                    <ThemedText style={styles.subText}>Group</ThemedText>
                </View>

                {/* Attach Classrooms */}
                <View style={styles.card}>
                    {/* <ThemedText style={styles.sectionTitle}>Attach Classrooms</ThemedText>
                    <ThemedText style={styles.subText}>Add At Least 1 Classroom</ThemedText> */}

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                            <ThemedText type="middleTitle" style={{ color: theme.text, marginLeft: 0 }}>Attach Classrooms</ThemedText>
                            <ThemedText type="subText" style={{ color: theme.subText, marginRight: 35 }}>Add At Least 1 Classroom</ThemedText>
                        </View>


                        <View style={styles.wrapperInviteesShows}>

                            {selectedGroup.length !== 0 && (<TouchableOpacity onPress={selectAllGroup} style={[styles.numberOfInvitees, { backgroundColor: theme.emergencyBackground }]}>
                                <ThemedText type="subLittleText" style={{ color: '#212121' }}>
                                    Select All
                                </ThemedText>
                                <Feather name={"check-square"}
                                    size={15}
                                    color={'#212121'} />
                            </TouchableOpacity>)}

                            <View style={[styles.numberOfInvitees, { backgroundColor: selectedGroup.length >= 3 ? '#4CAF50' : theme.panel }]}>
                                {/* <Feather name="users" size={15} color={selectedGroup.length === 3 ? '#fff' : theme.text} /> */}
                                <MaterialCommunityIcons name="google-classroom" size={15} color={selectedGroup.length === 3 ? '#fff' : theme.text} />
                                <ThemedText style={{ color: selectedGroup.length === 3 ? '#fff' : theme.text, paddingVertical: 3 }} type="middleTitle">
                                    {selectedGroup.length}
                                </ThemedText>
                            </View>
                        </View>

                    </View>




                    {group.map((room) => (
                        <View>

                            <TouchableOpacity
                                key={room.id}
                                style={styles.rows}
                                onPress={() => toggleSelectGroup(room.id)}
                            >
                                <View style={styles.leftRow}>
                                    {room.avatar ? (
                                        <Image source={{ uri: room.avatar }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatar, { backgroundColor: "#aaa" }]}>
                                            <ThemedText style={styles.initials}>{room.initials}</ThemedText>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <ThemedText style={styles.name}>{room.name}</ThemedText>
                                        </View>

                                    </View>
                                </View>

                                <Feather name={
                                    selectedGroup.includes(room.id)
                                        ? "check-square"
                                        : "square"
                                }
                                    size={22}
                                    color={selectedGroup.includes(room.id) ? theme.tint : "#bbb"} />

                            </TouchableOpacity>
                            <Divider horizontal={true} marginVertical={5} />
                        </View>
                    ))}

                    <TouchableOpacity>
                        <ThemedText
                            style={{ color: theme.tint, textAlign: "center", marginTop: 8 }}
                        >
                            See All Classrooms
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Add Members */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
                            <ThemedText type="middleTitle" style={{ color: theme.text }}>Add Members</ThemedText>
                            <ThemedText type="subText" style={{ color: theme.subText, }}>Add At Least 3 Members</ThemedText>
                        </View>


                        <View style={styles.wrapperInviteesShows}>

                            {selected.length !== 0 && (<TouchableOpacity onPress={selectAllUsers} style={[styles.numberOfInvitees, { backgroundColor: theme.emergencyBackground }]}>
                                <ThemedText type="subLittleText" style={{ color: '#212121' }}>
                                    Select All
                                </ThemedText>
                                <Feather name={"check-square"}
                                    size={15}
                                    color={'#212121'} />
                            </TouchableOpacity>)}

                            <View style={[styles.numberOfInvitees, { backgroundColor: selected.length >= 3 ? '#4CAF50' : theme.panel }]}>
                                <Feather name="users" size={15} color={selected.length === 3 ? '#fff' : theme.text} />
                                <ThemedText style={{ color: selected.length === 3 ? '#fff' : theme.text, paddingVertical: 3 }} type="middleTitle">
                                    {selected.length}
                                </ThemedText>
                            </View>
                        </View>

                    </View>

                    <TouchableOpacity style={styles.optionItem}>
                        <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 50, width: 40, height: 40, position: 'relative' }}>
                            {/* <ThemedText style={{ color: theme.tint,  }}>
                                +
                            </ThemedText> */}
                            <AntDesign name="user-add" size={22} color={theme.tint} style={{ margin: 'auto', paddingTop: 0 }} />

                            <View style={{ backgroundColor: theme.passDesc, width: 10, height: 10, borderRadius: 50, position: 'absolute', right: 0, bottom: 0 }} />
                        </View>
                        <ThemedText style={{ color: theme.tint }}>
                            Add New Contact
                        </ThemedText>
                    </TouchableOpacity>

                    {data.map((person) => (
                        <View>

                            <TouchableOpacity
                                key={person.id}
                                style={styles.rows}
                                onPress={() => toggleSelect(person.id)}
                            >
                                <View style={styles.leftRow}>
                                    {person.avatar ? (
                                        <Image source={{ uri: person.avatar }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatar, { backgroundColor: "#aaa" }]}>
                                            <ThemedText style={styles.initials}>{person.initials}</ThemedText>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <ThemedText style={styles.name}>{person.name}</ThemedText>
                                            {person.isAdmin && (
                                                <Badge title="Admin" />
                                            )}
                                        </View>
                                        <ThemedText style={styles.subtitle}>
                                            {person.subtitle}
                                        </ThemedText>
                                    </View>
                                </View>

                                <Feather name={
                                    selected.includes(person.id)
                                        ? "check-square"
                                        : "square"
                                }
                                    size={22}
                                    color={selected.includes(person.id) ? theme.tint : "#bbb"} />

                            </TouchableOpacity>
                            <Divider horizontal={true} marginVertical={5} />
                        </View>
                    ))}

                    <TouchableOpacity>
                        <ThemedText
                            style={{ color: theme.tint, textAlign: "center", marginTop: 8 }}
                        >
                            See All Contacts
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Footer Button */}
                <TouchableOpacity style={styles.footerButton}>
                    <ThemedText style={styles.footerButtonText}>Create Group</ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
