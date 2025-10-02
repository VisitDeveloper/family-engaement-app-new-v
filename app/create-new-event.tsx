import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import DatePicker from "@/components/ui/date-picker";
import Divider from "@/components/ui/divider";
import SelectBox, { OptionsList } from "@/components/ui/select-box-modal";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { enumToOptions } from "@/utils/make-array-for-select-box";
import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, Switch, TextInput, TouchableOpacity, View } from "react-native";

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



function CreateNewEvent() {
    const theme = useStore((state) => state.theme)

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
        row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
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

    }))


    const [message, setMessage] = useState<string>('');
    const firstElementArray = enumToOptions(EventType)
    const [eventType, setEventType] = useState<OptionsList[]>([firstElementArray[0]]);
    const [textMessages, setTextMessages] = useState<boolean>(false)


    // date
    const [startdate, setStartDate] = useState(new Date());
    const [enddate, setEndDate] = useState(new Date());


    // time
    const [startDateTime, setStartDateTime] = useState(new Date());
    const [enddateTime, setEndDateTime] = useState(new Date());

    useEffect(() => {
        // console.log('start date', startdate)
        // console.log('end date', enddate)

        console.log('Start Date Time', startDateTime)
        // console.log('End Date Time', enddateTime)
    }, [
        // startdate,
        // enddate,
        startDateTime,
        // enddateTime
    ])

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

    const firstElementArrayOfTimeRepetition = enumToOptions(TimeRepition)
    const [timeRepetition, setTimeRepetition] = useState<OptionsList[]>([firstElementArrayOfTimeRepetition[0]]);


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
                        <ThemedText style={styles.sectionTitle}> Event Title</ThemedText>
                    </View>
                    <TextInput placeholder="What’s the event called?" placeholderTextColor={theme.subText} style={styles.input} />


                    <View style={styles.row}>
                        <ThemedText style={styles.sectionTitle}> Event Type</ThemedText>
                    </View>
                    <SelectBox
                        options={firstElementArray}
                        value={eventType[0].label} // فقط label برای نمایش در SelectBox
                        onChange={(val) => {
                            const selectedOption = firstElementArray.find(opt => opt.value === val);

                            if (selectedOption) {
                                setEventType([selectedOption]); // کل گزینه رو ذخیره کن
                            }
                        }}
                        title="List of Post Visibility"
                    />


                    <View style={styles.row}>
                        <ThemedText style={styles.sectionTitle}> Description</ThemedText>
                    </View>
                    <TextInput
                        style={styles.messageInput}
                        value={message}
                        onChangeText={setMessage}
                        placeholder="What do you want to talk about?"
                        placeholderTextColor={theme.subText}
                        multiline
                    />

                    <Divider />


                    <View style={styles.row}>
                        <ThemedText style={styles.sectionTitle}>Location</ThemedText>
                    </View>
                    <TextInput placeholder="Venue Details" placeholderTextColor={theme.subText} style={styles.input} />


                    <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                        <View style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                            <ThemedText style={styles.sectionTitle}>Request RSVP</ThemedText>
                            <ThemedText type="subText" style={[styles.sectionTitle, { color: theme.subText, margin: 0 }]}>Request Invitees for RSVP</ThemedText>
                        </View>
                        <Switch
                            value={textMessages}
                            onValueChange={setTextMessages}
                            trackColor={{ false: "#ccc", true: '#a846c2' }}
                            thumbColor={textMessages ? "#fff" : "#fff"}
                            style={{ marginTop: 10 }}
                        />
                    </View>

                </View>

                <View style={styles.card}>

                    <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 30 }]}>
                        <ThemedText style={styles.sectionTitle}>Start Date</ThemedText>
                        <DatePicker date={startdate} setDate={setStartDate} />
                    </View>



                    <View style={[styles.row, { justifyContent: 'space-between' }]}>
                        <ThemedText style={styles.sectionTitle}>End Date</ThemedText>
                        <DatePicker date={enddate} setDate={setEndDate} />
                    </View>

                    <Divider />

                    <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                        <View style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                            <ThemedText style={styles.sectionTitle}>
                                All Day Event
                            </ThemedText>
                        </View>
                        <Switch
                            value={textMessages}
                            onValueChange={setTextMessages}
                            trackColor={{ false: "#ccc", true: '#a846c2' }}
                            thumbColor={textMessages ? "#fff" : "#fff"}
                            style={{ marginTop: 10 }}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'column', alignItems: 'flex-start', width: '50%' }}>
                            <ThemedText style={[styles.sectionTitle, { marginBottom: 5 }]}>
                                Start Time
                            </ThemedText>

                            <DatePicker mode="time" date={startDateTime} setDate={setStartDateTime} />
                        </View>


                        <View style={{ flexDirection: 'column', alignItems: 'flex-start', width: '50%' }}>
                            <ThemedText style={[styles.sectionTitle, { marginBottom: 5 }]}>
                                End Time
                            </ThemedText>
                            <DatePicker mode="time" date={enddateTime} setDate={setEndDateTime} />

                        </View>
                    </View>

                    <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }]}>
                        <View style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
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


                            <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                                <View style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
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

                            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ backgroundColor: theme.panel, width: '65%', height: 35, borderRadius: 10, paddingVertical: 3 }}>
                                    <ThemedText type="subtitle" style={{ color: theme.subText, marginHorizontal: 'auto' }}>

                                        {counter}

                                    </ThemedText>
                                </View>

                                <View style={{ backgroundColor: theme.panel, paddingHorizontal: 8, flexDirection: 'row', borderRadius: 25, width: '30%', alignItems: 'center', justifyContent: 'space-between' }}>

                                    <TouchableOpacity disabled={restrictNumberOfPeopleInASlot} onPress={() => decrementCounter()} style={{ width: '45%' }}>
                                        <ThemedText type="title" style={{ marginHorizontal: 'auto', fontWeight: 400, color: restrictNumberOfPeopleInASlot ? theme.subText : theme.text }}>
                                            -
                                        </ThemedText>
                                    </TouchableOpacity>


                                    <View style={{ height: 15, width: 2, backgroundColor: theme.text, }} />

                                    <TouchableOpacity disabled={restrictNumberOfPeopleInASlot} onPress={() => incrementCounter()} style={{ width: '45%' }}>
                                        <ThemedText type="title" style={{ marginHorizontal: 'auto', fontWeight: 400, color: restrictNumberOfPeopleInASlot ? theme.subText : theme.text }}>
                                            +
                                        </ThemedText>
                                    </TouchableOpacity>

                                </View>
                            </View>
                        </View>
                    )}


                    <Divider />


                    <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }]}>
                        <View style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                            <ThemedText style={styles.sectionTitle}>
                                Repeat
                            </ThemedText>
                        </View>
                        <Switch
                            value={textMessages}
                            onValueChange={setTextMessages}
                            trackColor={{ false: "#ccc", true: '#a846c2' }}
                            thumbColor={textMessages ? "#fff" : "#fff"}
                            style={{ marginTop: 10 }}
                        />
                    </View>

                    <SelectBox
                        options={firstElementArrayOfTimeRepetition}
                        value={timeRepetition[0].label} // فقط label برای نمایش در SelectBox
                        onChange={(val) => {
                            const selectedOption = firstElementArrayOfTimeRepetition.find(opt => opt.value === val);

                            if (selectedOption) {
                                setTimeRepetition([selectedOption]); // کل گزینه رو ذخیره کن
                            }
                        }}
                        title="List of Post Visibility"
                    />

                </View>

                <View style={styles.card}>

                    <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', }]}>
                        <View >
                            <ThemedText style={styles.sectionTitle}>Invitees</ThemedText>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 3, backgroundColor: theme.panel, borderRadius: 10 }}>
                            <Feather name="users" size={15} color="black" />
                            <ThemedText style={styles.sectionTitle} type="middleTitle">2</ThemedText>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>

                    </ScrollView>
                </View>


            </ScrollView>
        </View>
    );
}


export default CreateNewEvent