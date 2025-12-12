import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import Badge from "@/components/ui/badge";
import DatePicker from "@/components/ui/date-picker";
import Divider from "@/components/ui/divider";
import SelectBox, { OptionsList } from "@/components/ui/select-box-modal";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useValidation } from "@/hooks/use-validation";
import { useStore } from "@/store";
import { enumToOptions } from "@/utils/make-array-for-select-box";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, Switch, TextInput, TouchableOpacity, View } from "react-native";

enum EventType {
    Conference = 'Conference',
    Meeting = 'Meeting',
    ClassEvent = "ClassEvent",
    FamilyWorkshop = 'FamilyWorkshop',
    SchoolwideEvent = 'SchoolwideEvent',
    FieldTrip = 'FieldTrip',
    Assessment = 'Assessment',
    ServicesAndScreenings = 'ServicesAndScreenings'
}


enum TimeRepition {
    Daily = 'Daily',
    Weekly = 'Weekly',
    Monthly = 'Monthly',
    Yearly = 'Yearly',
}

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



function CreateNewEvent() {
    const theme = useStore((state) => state.theme);
    const router = useRouter()

    const [eventTitle, setEventTitle] = useState<string>('')
    const firstElementArray = enumToOptions(EventType)
    const [eventType, setEventType] = useState<OptionsList[]>([firstElementArray[0]]);
    const [description, setDescription] = useState<string>('');
    const [location, setLocation] = useState<string>('')
    const [requestRSVP, setRequestRSVP] = useState<boolean>(false)
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const [allDayEvent, setAllDayEvent] = useState<boolean>(false);

    // time
    const [startDateTime, setStartDateTime] = useState(new Date());
    const [endDateTime, setEndDateTime] = useState(new Date());

    const [multipleTimeSlots, setMultipleTimeSlots] = useState<boolean>(false)
    const [restrictNumberOfPeopleInASlot, setRestrictNumberOfPeopleInASlot] = useState<boolean>(false)

    const [counter, setCounter] = useState<number>(0);

    const incrementCounter = () => {
        setCounter(perv => perv + 1)
    }

    const decrementCounter = () => {
        if (counter === 0) return;
        setCounter(perv => perv - 1);

    }

    const [repeat, setRepeat] = useState<boolean>(false)
    const firstElementArrayOfTimeRepetition = enumToOptions(TimeRepition)
    const [timeRepetition, setTimeRepetition] = useState<OptionsList[]>([firstElementArrayOfTimeRepetition[0]]);

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




    const { errors, validate } = useValidation({
        eventTitle: { required: true, minLength: 3 },
        eventType: { required: true }, // 👈 اضافه شد
        description: { required: true, minLength: 10 },
        location: { required: true, minLength: 5 },
        startDate: { required: true },
        endDate: { required: true },
        ...(allDayEvent && {
            startDateTime: { required: true },
            endDateTime: { required: true }
        }),
        ...(
            repeat && {
                timeRepetition: { required: true }
            }
        )
    });


    const handleCreateEvent = () => {
        const isValid = validate({
            eventTitle,
            eventType,
            description,
            location,
            startDate,
            endDate,
            startDateTime: allDayEvent ? startDateTime : undefined,
            endDateTime: allDayEvent ? endDateTime : undefined,
            timeRepetition: repeat ? timeRepetition : undefined
        });




        if (!isValid) {
            console.log("Form has errors", errors);
            return;
        }
        if (selected.length === 0) {
            alert('please at least select one person')
        }

        console.log("Event Created ✅", {
            eventTitle,
            eventType,
            description,
            location,
            startDate,
            endDate,
            startDateTime,
            endDateTime,
            timeRepetition,
            users: [...selected]
        });
        const data = {
            eventTitle,
            eventType,
            description,
            location,
            startDate,
            endDate,
            startDateTime,
            endDateTime,
            timeRepetition,
            users: [...selected]
        }

        // data

        if (isValid && selected.length !== 0) {
            router.push('/data-privacy')
        }

    };


    const styles = useThemedStyles((theme) => ({
        container: { flex: 1, paddingHorizontal: 10, backgroundColor: theme.bg, },
        containerScrollView: { flex: 1, backgroundColor: theme.bg, marginBottom: 30 },
        header: {
            paddingVertical: 15,
            marginBottom: 20,
            borderBottomWidth: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 20
        },
        title: { fontSize: 18, fontWeight: "600", },
        card: {
            borderWidth: 1,
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            backgroundColor: theme.bg,
            borderColor: theme.border
        },
        subText: { fontSize: 14, textAlign: "center", marginBottom: 6 },
        row: { flexDirection: "row", alignItems: "center", marginBottom: 10, justifyContent: 'space-between' },
        sectionTitle: { marginTop: 5, color: theme.text, fontWeight: 500 },
        input: {
            padding: 10,
            marginBottom: 10,
            borderRadius: 10,
            color: theme.text,
            backgroundColor: theme.panel,
        },
        messageInput: {
            backgroundColor: theme.panel,
            borderRadius: 10,
            padding: 5,

            height: 100,
            textAlignVertical: 'top',
            marginBottom: 10,
            color: theme.text,
        },
        rows: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 8,
        },
        switchColumn: {
            flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center'
        },

        counterSetcion: {
            flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'space-between'
        },
        counter: {
            backgroundColor: theme.panel, width: '65%', height: 35, borderRadius: 10, paddingVertical: 3
        },
        counterBtns: {
            backgroundColor: theme.panel, paddingHorizontal: 8, flexDirection: 'row', borderRadius: 25, width: '30%', alignItems: 'center', justifyContent: 'space-between'
        },
        incrementBtn: {
            marginHorizontal: 'auto', fontWeight: 400
        },
        decrementBtn: {
            marginHorizontal: 'auto', fontWeight: 400
        },

        wrapperInviteesShows: {
            flexDirection: 'row', gap: 5, alignItems: 'center',
        },
        numberOfInvitees: {
            flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 3, backgroundColor: theme.panel, borderRadius: 10
        },

        wrapperTime: {

            flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20
        },

        time: {
            flexDirection: 'row', gap: 10, alignItems: 'flex-start', width: '50%'
        },

        leftRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
        avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ccc", alignItems: "center", justifyContent: "center" },
        initials: { color: "#fff", fontWeight: "600" },
        name: { fontSize: 16, fontWeight: "600", color: theme.text },
        subtitle: { fontSize: 12, color: theme.subText },

        seeAll: { alignSelf: "center", marginVertical: 10 },
        seeAllText: { color: theme.tint, fontWeight: "600" },
        button: {
            backgroundColor: theme.tint,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
            marginBottom: 20,
        },
        buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
        error: {
            color: "red",
            marginTop: -8,
            marginLeft: 3
        }
    }))



    return (
        <View style={styles.container}>
            <HeaderInnerPage
                title="Create New Event"
                addstyles={{ marginBottom: 20 }}
            />

            <ScrollView style={styles.containerScrollView} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>

                {/* Contact */}
                <View style={styles.card}>

                    <View style={styles.row}>
                        <ThemedText style={styles.sectionTitle}>Event Title</ThemedText>
                    </View>
                    <TextInput
                        value={eventTitle}
                        onChangeText={setEventTitle}
                        placeholder="What’s the event called?"
                        placeholderTextColor={theme.subText}
                        style={styles.input} />
                    {errors.eventTitle && (
                        <ThemedText type="subLittleText" style={styles.error}>{errors.eventTitle}</ThemedText>
                    )}


                    <View style={styles.row}>
                        <ThemedText style={styles.sectionTitle}> Event Type</ThemedText>
                    </View>
                    <SelectBox
                        options={firstElementArray}
                        value={eventType[0].label}
                        onChange={(val) => {
                            const selectedOption = firstElementArray.find(opt => opt.value === val);

                            if (selectedOption) {
                                setEventType([selectedOption]);
                            }
                        }}
                        title="List of Event Type"
                    />
                    {errors.eventType && (
                        <ThemedText type="subLittleText" style={styles.error}>{errors.eventType}</ThemedText>
                    )}


                    <View style={[styles.row, { marginTop: 10 }]}>
                        <ThemedText style={styles.sectionTitle}> Description</ThemedText>
                    </View>


                    <TextInput
                        style={styles.messageInput}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="What do you want to talk about?"
                        placeholderTextColor={theme.subText}
                        multiline
                    />
                    {errors.description && (
                        <ThemedText type="subLittleText" style={styles.error}>{errors.description}</ThemedText>
                    )}

                    <Divider />


                    <View style={styles.row}>
                        <ThemedText style={styles.sectionTitle}>Location</ThemedText>
                    </View>
                    <TextInput
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Venue Details"
                        placeholderTextColor={theme.subText}
                        style={styles.input} />

                    {errors.location && (
                        <ThemedText type="subLittleText" style={styles.error}>{errors.location}</ThemedText>
                    )}


                    <View style={styles.row}>
                        <View style={styles.switchColumn}>
                            <ThemedText style={styles.sectionTitle}>Request RSVP</ThemedText>
                            <ThemedText type="subText" style={[styles.sectionTitle, { color: theme.subText, margin: 0 }]}>Request Invitees for RSVP</ThemedText>
                        </View>


                        <Switch
                            value={requestRSVP}
                            onValueChange={setRequestRSVP}
                            trackColor={{ false: "#ccc", true: '#a846c2' }}
                            thumbColor={requestRSVP ? "#fff" : "#fff"}
                            style={{ marginTop: 10 }}
                        />
                    </View>

                </View>

                <View style={styles.card}>

                    <View style={[styles.row, { marginBottom: 30 }]}>
                        <ThemedText style={styles.sectionTitle}>Start Date</ThemedText>
                        <DatePicker date={startDate} setDate={setStartDate} />
                    </View>
                    {errors.startDate && (
                        <ThemedText type="subLittleText" style={styles.error}>{errors.startDate}</ThemedText>
                    )}



                    <View style={styles.row}>
                        <ThemedText style={styles.sectionTitle}>End Date</ThemedText>
                        <DatePicker date={endDate} setDate={setEndDate} />
                    </View>
                    {errors.endDate && (
                        <ThemedText type="subLittleText" style={styles.error}>{errors.endDate}</ThemedText>
                    )}

                    <Divider />

                    <View style={styles.row}>
                        <View style={styles.switchColumn}>
                            <ThemedText style={styles.sectionTitle}>
                                All Day Event
                            </ThemedText>
                        </View>
                        <Switch
                            value={allDayEvent}
                            onValueChange={setAllDayEvent}
                            trackColor={{ false: "#ccc", true: '#a846c2' }}
                            thumbColor={allDayEvent ? "#fff" : "#fff"}
                            style={{ marginTop: 10 }}
                        />
                    </View>

                    {allDayEvent ? null : <View style={styles.wrapperTime}>
                        <View style={{ flexDirection: 'column', gap: 10 }}>
                            <View style={styles.time}>
                                <ThemedText style={[styles.sectionTitle, { marginBottom: 5 }]}>
                                    Start Time
                                </ThemedText>
                                <DatePicker mode="time" disabled={allDayEvent} date={startDateTime} setDate={setStartDateTime} />
                            </View>
                            {errors.startDateTime && (
                                <ThemedText type="subLittleText" style={styles.error}>{errors.startDateTime}</ThemedText>
                            )}
                        </View>


                        <View style={{ flexDirection: 'column', gap: 10 }}>
                            <View style={styles.time}>
                                <ThemedText style={[styles.sectionTitle, { marginBottom: 5 }]}>
                                    End Time
                                </ThemedText>
                                <DatePicker mode="time" disabled={allDayEvent} date={endDateTime} setDate={setEndDateTime} />

                            </View>
                            {errors.endDateTime && (
                                <ThemedText type="subLittleText" style={styles.error}>{errors.endDateTime}</ThemedText>
                            )}
                        </View>
                    </View>}

                    <View style={[styles.row, { marginTop: 20 }]}>
                        <View style={styles.switchColumn}>
                            <ThemedText style={styles.sectionTitle}>
                                Multiple Time Slots
                            </ThemedText>
                        </View>
                        <Switch
                            value={multipleTimeSlots}
                            onValueChange={setMultipleTimeSlots}
                            trackColor={{ false: "#ccc", true: '#a846c2' }}
                            thumbColor={multipleTimeSlots ? "#fff" : "#fff"}
                            style={{ marginTop: 10 }}
                        />
                    </View>


                    {multipleTimeSlots && (
                        <View>
                            <View style={styles.row}>
                                <ThemedText style={styles.sectionTitle}> Slot Duration</ThemedText>
                            </View>

                            <TextInput placeholder="30 min" style={styles.input} />
                            {/* <Dropdown
                                options={options}
                                value={selected}
                                onChange={(val: string) => setSelected(val)}
                            />
                            <SelectBox
                                options={firstElementArray}
                                value={eventType[0].label}
                                onChange={(val) => {
                                    const selectedOption = firstElementArray.find(opt => opt.value === val);

                                    if (selectedOption) {
                                        setEventType([selectedOption]);
                                    }
                                }}
                                title="List of Event Type"
                            /> */}


                            <View style={styles.row}>
                                <View style={styles.switchColumn}>
                                    <ThemedText style={styles.sectionTitle}>Slot Restriction</ThemedText>
                                    <ThemedText type="subText" style={[styles.sectionTitle, { color: theme.subText, margin: 0 }]}>
                                        Restrict No. of People in a Slot
                                    </ThemedText>
                                </View>

                                <Switch
                                    value={restrictNumberOfPeopleInASlot}
                                    onValueChange={setRestrictNumberOfPeopleInASlot}
                                    trackColor={{ false: "#ccc", true: '#a846c2' }}
                                    thumbColor={restrictNumberOfPeopleInASlot ? "#fff" : "#fff"}
                                    style={{ marginTop: 10 }}
                                />
                            </View>

                            <View style={styles.counterSetcion}>
                                <View style={styles.counter}>
                                    <ThemedText type="subtitle" style={{ color: theme.subText, marginHorizontal: 'auto' }}>
                                        {counter}
                                    </ThemedText>
                                </View>

                                <View style={styles.counterBtns}>
                                    <TouchableOpacity disabled={restrictNumberOfPeopleInASlot} onPress={() => decrementCounter()} style={{ width: '45%' }}>
                                        <ThemedText type="title" style={[styles.decrementBtn, { color: restrictNumberOfPeopleInASlot ? theme.subText : theme.text }]}>
                                            -
                                        </ThemedText>
                                    </TouchableOpacity>

                                    <Divider horizontal={false} />

                                    <TouchableOpacity disabled={restrictNumberOfPeopleInASlot} onPress={() => incrementCounter()} style={{ width: '45%' }}>
                                        <ThemedText type="title" style={[styles.incrementBtn, { color: restrictNumberOfPeopleInASlot ? theme.subText : theme.text }]}>
                                            +
                                        </ThemedText>
                                    </TouchableOpacity>

                                </View>
                            </View>
                        </View>
                    )}


                    <Divider />


                    <View style={[styles.row, { marginTop: 5 }]}>
                        <View style={styles.switchColumn}>
                            <ThemedText style={styles.sectionTitle}>
                                Repeat
                            </ThemedText>
                        </View>


                        <Switch
                            value={repeat}
                            onValueChange={setRepeat}
                            trackColor={{ false: "#ccc", true: '#a846c2' }}
                            thumbColor={repeat ? "#fff" : "#fff"}
                            style={{ marginTop: 10 }}
                        />
                    </View>

                    <SelectBox
                        disabled={!repeat}
                        options={firstElementArrayOfTimeRepetition}
                        value={timeRepetition[0].label}
                        onChange={(val) => {
                            const selectedOption = firstElementArrayOfTimeRepetition.find(opt => opt.value === val);

                            if (selectedOption) {
                                setTimeRepetition([selectedOption]);
                            }
                        }}
                        title="List of Repetitions"
                    />
                    {errors.timeRepetition && (
                        <ThemedText type="subLittleText" style={styles.error}>{errors.timeRepetition}</ThemedText>
                    )}

                </View>

                <View style={styles.card}>

                    <View style={styles.row}>
                        <View >
                            <ThemedText style={styles.sectionTitle}>Invitees</ThemedText>
                        </View>

                        <View style={styles.wrapperInviteesShows}>

                            {selected.length !== 0 && (<TouchableOpacity onPress={selectAllUsers} style={[styles.numberOfInvitees, { backgroundColor: theme.emergencyBackground }]}>
                                <ThemedText type="subText" style={{ color: '#212121' }}>
                                    Select All
                                </ThemedText>
                                <Feather name={"check-square"}
                                    size={15}
                                    color={'#212121'} />
                            </TouchableOpacity>)}

                            <View style={styles.numberOfInvitees}>
                                <Feather name="users" size={15} color={theme.text} />
                                <ThemedText style={styles.sectionTitle} type="middleTitle">{
                                    selected.length}</ThemedText>
                            </View>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} style={{ minHeight: 200, height: 300, maxHeight: 300 }}>
                        {data.map((person) => (
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
                        ))}

                    </ScrollView>
                    <Divider />
                    <TouchableOpacity style={styles.seeAll} >
                        <ThemedText style={styles.seeAllText}>See All Contacts</ThemedText>
                    </TouchableOpacity>


                </View>
                <TouchableOpacity style={styles.button} onPress={handleCreateEvent}>
                    <ThemedText style={styles.buttonText}>Create Event</ThemedText>
                </TouchableOpacity>


            </ScrollView >
        </View >
    );
}


export default CreateNewEvent