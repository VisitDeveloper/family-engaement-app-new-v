import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import Badge from "@/components/ui/badge";
import DatePicker from "@/components/ui/date-picker";
import Divider from "@/components/ui/divider";
import MapPicker from "@/components/ui/map-picker";
import SelectBox, { OptionsList } from "@/components/ui/select-box-modal";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useValidation } from "@/hooks/use-validation";
import {
  eventService,
  EventType as EventTypeEnum,
  RepeatType,
} from "@/services/event.service";
import { ParentDto, userService } from "@/services/user.service";
import { useStore } from "@/store";
import { enumToOptions } from "@/utils/make-array-for-select-box";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

enum EventType {
  Conference = "Conference",
  Fieldtrip = "Fieldtrip",
  Event = "Event",
  Holiday = "Holiday",
}

enum RepeatTypeEnum {
  None = "none",
  Daily = "daily",
  Weekly = "weekly",
  Monthly = "monthly",
  Yearly = "yearly",
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

// Helper function to convert ParentDto to Invitee
const convertParentToInvitee = (parent: ParentDto): Invitee => {
  const firstName = parent.firstName || "";
  const lastName = parent.lastName || "";
  const name = `${firstName} ${lastName}`.trim() || parent.email.split("@")[0];

  // Generate initials from name
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();

  return {
    id: parent.id,
    name,
    subtitle: parent.email,
    avatar: parent.profilePicture || undefined,
    initials,
    isAdmin: parent.role === "admin",
  };
};

function CreateNewEvent() {
  const theme = useStore((state) => state.theme);
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.eventId as string | undefined;
  const isEditMode = !!eventId;

  const [eventTitle, setEventTitle] = useState<string>("");
  const firstElementArray = useMemo(() => enumToOptions(EventType), []);
  const [eventType, setEventType] = useState<OptionsList[]>([
    firstElementArray[0],
  ]);
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [locationLatitude, setLocationLatitude] = useState<string>("");
  const [locationLongitude, setLocationLongitude] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [mapPickerVisible, setMapPickerVisible] = useState<boolean>(false);
  const [requestRSVP, setRequestRSVP] = useState<boolean>(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [allDayEvent, setAllDayEvent] = useState<boolean>(false);

  // time
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDateTime, setEndDateTime] = useState(new Date());

  const [multipleTimeSlots, setMultipleTimeSlots] = useState<boolean>(false);
  const [restrictNumberOfPeopleInASlot, setRestrictNumberOfPeopleInASlot] =
    useState<boolean>(false);

  const [counter, setCounter] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const incrementCounter = () => {
    setCounter((perv) => perv + 1);
  };

  const decrementCounter = () => {
    if (counter === 0) return;
    setCounter((perv) => perv - 1);
  };

  const [repeat, setRepeat] = useState<boolean>(false);
  const firstElementArrayOfRepeatType = useMemo(() => enumToOptions(RepeatTypeEnum), []);
  const [repeatType, setRepeatType] = useState<OptionsList[]>([
    firstElementArrayOfRepeatType[0],
  ]);
  const [slotDuration, setSlotDuration] = useState<number>(30); // Default 30 minutes

  const [selected, setSelected] = useState<string[]>([]);
  const [parents, setParents] = useState<Invitee[]>([]);
  const [loadingParents, setLoadingParents] = useState<boolean>(false);
  const [loadingEvent, setLoadingEvent] = useState<boolean>(false);

  // Fetch parents from API
  const fetchParents = useCallback(async () => {
    try {
      setLoadingParents(true);
      const response = await userService.getParents({
        page: 1,
        limit: 50,
      });
      const invitees = response.users.map(convertParentToInvitee);
      setParents(invitees);
    } catch (error: any) {
      console.error("Error fetching parents:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to load parents. Please try again."
      );
    } finally {
      setLoadingParents(false);
    }
  }, []);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  // Load event data if in edit mode
  const loadEventData = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoadingEvent(true);
      const eventData = await eventService.getById(eventId);

      // Populate form fields with event data
      setEventTitle(eventData.title);
      
      // Set event type - convert from lowercase API format to enum format
      const matchingType = firstElementArray.find(
        (opt) => opt.value.toLowerCase() === eventData.type.toLowerCase()
      );
      if (matchingType) {
        setEventType([matchingType]);
      }

      setDescription(extractString(eventData.description));
      const locationString = extractString(eventData.location);
      setLocation(locationString);
      
      // Set locationName from location if it's a string, otherwise use location string
      if (locationString) {
        setLocationName(locationString);
      }
      
      if (eventData.locationLatitude) {
        setLocationLatitude(eventData.locationLatitude.toString());
      }
      if (eventData.locationLongitude) {
        setLocationLongitude(eventData.locationLongitude.toString());
      }

      setRequestRSVP(eventData.requestRSVP || false);
      
      // Parse dates
      if (eventData.startDate) {
        setStartDate(new Date(eventData.startDate));
      }
      if (eventData.endDate) {
        setEndDate(new Date(eventData.endDate));
      }

      setAllDayEvent(eventData.allDay || false);

      // Parse times if not all day
      if (!eventData.allDay && eventData.startTime) {
        const startTimeStr = typeof eventData.startTime === "string" 
          ? eventData.startTime 
          : (eventData.startTime as any).time || (eventData.startTime as any).value || "";
        if (startTimeStr) {
          const [hours, minutes] = startTimeStr.split(":").map(Number);
          const startDateObj = new Date(eventData.startDate);
          startDateObj.setHours(hours || 0, minutes || 0, 0, 0);
          setStartDateTime(startDateObj);
        }
      }

      if (!eventData.allDay && eventData.endTime) {
        const endTimeStr = typeof eventData.endTime === "string"
          ? eventData.endTime
          : (eventData.endTime as any).time || (eventData.endTime as any).value || "";
        if (endTimeStr) {
          const [hours, minutes] = endTimeStr.split(":").map(Number);
          const endDateObj = new Date(eventData.endDate);
          endDateObj.setHours(hours || 0, minutes || 0, 0, 0);
          setEndDateTime(endDateObj);
        }
      }

      setMultipleTimeSlots(eventData.multipleTimeSlots || false);
      setRestrictNumberOfPeopleInASlot(eventData.slotRestriction || false);
      
      if (eventData.slotDuration) {
        const duration = typeof eventData.slotDuration === "number"
          ? eventData.slotDuration
          : (eventData.slotDuration as any).value || 30;
        setSlotDuration(duration);
      }

      if (eventData.maxParticipantsPerSlot) {
        setCounter(eventData.maxParticipantsPerSlot);
      }

      setRepeat(eventData.repeat !== "none");
      if (eventData.repeat && eventData.repeat !== "none") {
        const matchingRepeat = firstElementArrayOfRepeatType.find(
          (opt) => opt.value === eventData.repeat
        );
        if (matchingRepeat) {
          setRepeatType([matchingRepeat]);
        }
      }

      // Set selected invitees if any
      if (eventData.invitees && eventData.invitees.length > 0) {
        setSelected(eventData.invitees.map((inv) => inv.userId));
      }
    } catch (error: any) {
      console.error("Error loading event:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to load event. Please try again."
      );
      router.back();
    } finally {
      setLoadingEvent(false);
    }
  }, [eventId, router, firstElementArray, firstElementArrayOfRepeatType]);

  useEffect(() => {
    if (isEditMode && eventId) {
      loadEventData();
    }
  }, [isEditMode, eventId, loadEventData]);

  // Helper function to extract string from description/location
  const extractString = (
    value: Record<string, any> | string | null | undefined
  ): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && value !== null) {
      return (
        (value as any).en ||
        (value as any).fa ||
        (value as any).text ||
        (value as any).value ||
        JSON.stringify(value)
      );
    }
    return String(value);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllUsers = () => {
    if (selected.length === parents.length) {
      setSelected([]);
    } else {
      setSelected(parents.map((person) => person.id));
    }
  };

  const { errors, validate } = useValidation({
    eventTitle: { required: true, minLength: 3 },
    eventType: { required: true },
    description: { required: false, minLength: 10 },
    location: { required: false, minLength: 5 },
    startDate: { required: true },
    endDate: { required: true },
    ...(!allDayEvent && {
      startDateTime: { required: true },
      endDateTime: { required: true },
    }),
    ...(repeat && {
      repeatType: { required: true },
    }),
  });

  const handleCreateEvent = async () => {
    const isValid = validate({
      eventTitle,
      eventType,
      description,
      location,
      startDate,
      endDate,
      startDateTime: !allDayEvent ? startDateTime : undefined,
      endDateTime: !allDayEvent ? endDateTime : undefined,
      repeatType: repeat ? repeatType : undefined,
    });

    if (!isValid) {
      console.log("Form has errors", errors);
      return;
    }

    try {
      setLoading(true);

      // Format dates to YYYY-MM-DD
      const formatDate = (date: Date) => date.toISOString().split("T")[0];
      // Format time to HH:mm
      const formatTime = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      const eventData = {
        title: eventTitle,
        type: eventType[0].value as EventTypeEnum,
        description: description || undefined,
        location: location || undefined,
        locationLatitude: locationLatitude
          ? parseFloat(locationLatitude)
          : undefined,
        locationLongitude: locationLongitude
          ? parseFloat(locationLongitude)
          : undefined,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        allDay: allDayEvent,
        startTime: !allDayEvent ? formatTime(startDateTime) : undefined,
        endTime: !allDayEvent ? formatTime(endDateTime) : undefined,
        multipleTimeSlots: multipleTimeSlots || undefined,
        slotDuration: multipleTimeSlots ? slotDuration : undefined,
        slotRestriction: restrictNumberOfPeopleInASlot || undefined,
        maxParticipantsPerSlot: restrictNumberOfPeopleInASlot
          ? counter
          : undefined,
        repeat: repeat ? (repeatType[0].value as RepeatType) : "none",
        requestRSVP: requestRSVP || undefined,
        // Events are visible to all group members by default
        // Only send inviteeIds if specific people are selected (optional)
        inviteeIds: selected.length > 0 ? selected : undefined,
      };

      if (isEditMode && eventId) {
        await eventService.update(eventId, eventData);
        Alert.alert("Success", "Event updated successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        await eventService.create(eventData);
        Alert.alert("Success", "Event created successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} event:`, error);
      Alert.alert(
        "Error",
        error.message || `Failed to ${isEditMode ? "update" : "create"} event. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = useThemedStyles((theme) => ({
    container: { flex: 1, paddingHorizontal: 10, backgroundColor: theme.bg },
    containerScrollView: {
      flex: 1,
      backgroundColor: theme.bg,
      marginBottom: 30,
    },
    header: {
      paddingVertical: 15,
      marginBottom: 20,
      borderBottomWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 20,
    },
    title: { fontSize: 18, fontWeight: "600" },
    card: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
      backgroundColor: theme.bg,
      borderColor: theme.border,
    },
    subText: { fontSize: 14, textAlign: "center", marginBottom: 6 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      justifyContent: "space-between",
    },
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
      textAlignVertical: "top",
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
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
    },

    counterSetcion: {
      flexDirection: "row",
      gap: 5,
      alignItems: "center",
      justifyContent: "space-between",
    },
    counter: {
      backgroundColor: theme.panel,
      width: "65%",
      height: 35,
      borderRadius: 10,
      paddingVertical: 3,
    },
    counterBtns: {
      backgroundColor: theme.panel,
      paddingHorizontal: 8,
      flexDirection: "row",
      borderRadius: 25,
      width: "30%",
      alignItems: "center",
      justifyContent: "space-between",
    },
    incrementBtn: {
      marginHorizontal: "auto",
      fontWeight: 400,
    },
    decrementBtn: {
      marginHorizontal: "auto",
      fontWeight: 400,
    },

    wrapperInviteesShows: {
      flexDirection: "row",
      gap: 5,
      alignItems: "center",
    },
    numberOfInvitees: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      paddingVertical: 3,
      backgroundColor: theme.panel,
      borderRadius: 10,
    },

    wrapperTime: {
      flexDirection: "row",
      gap: 5,
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 20,
    },

    time: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      width: "50%",
    },

    leftRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#ccc",
      alignItems: "center",
      justifyContent: "center",
    },
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
      marginLeft: 3,
    },
    mapPickerButton: {
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
    },
    mapPickerButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    coordinatesDisplay: {
      marginTop: 8,
      padding: 8,
      backgroundColor: theme.panel,
      borderRadius: 8,
      gap: 4,
    },
  }));

  if (loadingEvent) {
    return (
      <View style={styles.container}>
        <HeaderInnerPage
          title={isEditMode ? "Edit Event" : "Create New Event"}
          addstyles={{ marginBottom: 20 }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <ActivityIndicator size="large" color={theme.tint} />
          <ThemedText style={{ marginTop: 10, color: theme.subText }}>
            Loading event...
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderInnerPage
        title={isEditMode ? "Edit Event" : "Create New Event"}
        addstyles={{ marginBottom: 20 }}
      />

      <ScrollView
        style={styles.containerScrollView}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
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
            style={styles.input}
          />
          {errors.eventTitle && (
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.eventTitle}
            </ThemedText>
          )}

          <View style={styles.row}>
            <ThemedText style={styles.sectionTitle}> Event Type</ThemedText>
          </View>
          <SelectBox
            options={firstElementArray}
            value={eventType[0].label}
            onChange={(val) => {
              const selectedOption = firstElementArray.find(
                (opt) => opt.value === val
              );

              if (selectedOption) {
                setEventType([selectedOption]);
              }
            }}
            title="List of Event Type"
          />
          {errors.eventType && (
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.eventType}
            </ThemedText>
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
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.description}
            </ThemedText>
          )}

          <Divider />

          <View style={styles.row}>
            <ThemedText style={styles.sectionTitle}>Location</ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.input, styles.mapPickerButton]}
            onPress={() => setMapPickerVisible(true)}
          >
            <View style={styles.mapPickerButtonContent}>
              <Feather name="map-pin" size={20} color={theme.tint} />
              <ThemedText
                style={{
                  color:
                    locationLatitude && locationLongitude
                      ? theme.text
                      : theme.subText,
                  flex: 1,
                }}
              >
                {locationName || (locationLatitude && locationLongitude
                  ? `${parseFloat(locationLatitude).toFixed(6)}, ${parseFloat(
                      locationLongitude
                    ).toFixed(6)}`
                  : "Tap to select location on map")}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={theme.subText} />
            </View>
          </TouchableOpacity>

          {errors.location && (
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.location}
            </ThemedText>
          )}

          <View style={styles.row}>
            <View style={styles.switchColumn}>
              <ThemedText style={styles.sectionTitle}>Request RSVP</ThemedText>
              <ThemedText
                type="subText"
                style={[
                  styles.sectionTitle,
                  { color: theme.subText, margin: 0 },
                ]}
              >
                Request Invitees for RSVP
              </ThemedText>
            </View>

            <Switch
              value={requestRSVP}
              onValueChange={setRequestRSVP}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
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
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.startDate}
            </ThemedText>
          )}

          <View style={styles.row}>
            <ThemedText style={styles.sectionTitle}>End Date</ThemedText>
            <DatePicker date={endDate} setDate={setEndDate} />
          </View>
          {errors.endDate && (
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.endDate}
            </ThemedText>
          )}

          <Divider />

          <View style={styles.row}>
            <View style={styles.switchColumn}>
              <ThemedText style={styles.sectionTitle}>All Day Event</ThemedText>
            </View>
            <Switch
              value={allDayEvent}
              onValueChange={setAllDayEvent}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
              thumbColor={allDayEvent ? "#fff" : "#fff"}
              style={{ marginTop: 10 }}
            />
          </View>

          {allDayEvent ? null : (
            <View style={styles.wrapperTime}>
              <View style={{ flexDirection: "column", gap: 10 }}>
                <View style={styles.time}>
                  <ThemedText
                    style={[styles.sectionTitle, { marginBottom: 5 }]}
                  >
                    Start Time
                  </ThemedText>
                  <DatePicker
                    mode="time"
                    disabled={allDayEvent}
                    date={startDateTime}
                    setDate={setStartDateTime}
                  />
                </View>
                {errors.startDateTime && (
                  <ThemedText type="subLittleText" style={styles.error}>
                    {errors.startDateTime}
                  </ThemedText>
                )}
              </View>

              <View style={{ flexDirection: "column", gap: 10 }}>
                <View style={styles.time}>
                  <ThemedText
                    style={[styles.sectionTitle, { marginBottom: 5 }]}
                  >
                    End Time
                  </ThemedText>
                  <DatePicker
                    mode="time"
                    disabled={allDayEvent}
                    date={endDateTime}
                    setDate={setEndDateTime}
                  />
                </View>
                {errors.endDateTime && (
                  <ThemedText type="subLittleText" style={styles.error}>
                    {errors.endDateTime}
                  </ThemedText>
                )}
              </View>
            </View>
          )}

          <View style={[styles.row, { marginTop: 20 }]}>
            <View style={styles.switchColumn}>
              <ThemedText style={styles.sectionTitle}>
                Multiple Time Slots
              </ThemedText>
            </View>
            <Switch
              value={multipleTimeSlots}
              onValueChange={setMultipleTimeSlots}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
              thumbColor={multipleTimeSlots ? "#fff" : "#fff"}
              style={{ marginTop: 10 }}
            />
          </View>

          {multipleTimeSlots && (
            <View>
              <View style={styles.row}>
                <ThemedText style={styles.sectionTitle}>
                  {" "}
                  Slot Duration
                </ThemedText>
              </View>

              <TextInput
                placeholder="30 min"
                style={styles.input}
                value={slotDuration.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  if (num >= 5 && num <= 1440) {
                    setSlotDuration(num);
                  }
                }}
                keyboardType="numeric"
              />
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
                  <ThemedText style={styles.sectionTitle}>
                    Slot Restriction
                  </ThemedText>
                  <ThemedText
                    type="subText"
                    style={[
                      styles.sectionTitle,
                      { color: theme.subText, margin: 0 },
                    ]}
                  >
                    Restrict No. of People in a Slot
                  </ThemedText>
                </View>

                <Switch
                  value={restrictNumberOfPeopleInASlot}
                  onValueChange={setRestrictNumberOfPeopleInASlot}
                  trackColor={{ false: "#ccc", true: "#a846c2" }}
                  thumbColor={restrictNumberOfPeopleInASlot ? "#fff" : "#fff"}
                  style={{ marginTop: 10 }}
                />
              </View>

              <View style={styles.counterSetcion}>
                <View style={styles.counter}>
                  <ThemedText
                    type="subtitle"
                    style={{ color: theme.subText, marginHorizontal: "auto" }}
                  >
                    {counter}
                  </ThemedText>
                </View>

                <View style={styles.counterBtns}>
                  <TouchableOpacity
                    disabled={restrictNumberOfPeopleInASlot}
                    onPress={() => decrementCounter()}
                    style={{ width: "45%" }}
                  >
                    <ThemedText
                      type="title"
                      style={[
                        styles.decrementBtn,
                        {
                          color: restrictNumberOfPeopleInASlot
                            ? theme.subText
                            : theme.text,
                        },
                      ]}
                    >
                      -
                    </ThemedText>
                  </TouchableOpacity>

                  <Divider horizontal={false} />

                  <TouchableOpacity
                    disabled={restrictNumberOfPeopleInASlot}
                    onPress={() => incrementCounter()}
                    style={{ width: "45%" }}
                  >
                    <ThemedText
                      type="title"
                      style={[
                        styles.incrementBtn,
                        {
                          color: restrictNumberOfPeopleInASlot
                            ? theme.subText
                            : theme.text,
                        },
                      ]}
                    >
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
              <ThemedText style={styles.sectionTitle}>Repeat</ThemedText>
            </View>

            <Switch
              value={repeat}
              onValueChange={setRepeat}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
              thumbColor={repeat ? "#fff" : "#fff"}
              style={{ marginTop: 10 }}
            />
          </View>

          <SelectBox
            disabled={!repeat}
            options={firstElementArrayOfRepeatType}
            value={repeatType[0].label}
            onChange={(val: string) => {
              const selectedOption = firstElementArrayOfRepeatType.find(
                (opt) => opt.value === val
              );

              if (selectedOption) {
                setRepeatType([selectedOption]);
              }
            }}
            title="List of Repetitions"
          />
          {errors.repeatType && (
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.repeatType}
            </ThemedText>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.switchColumn}>
              <ThemedText style={styles.sectionTitle}>Invitees (Optional)</ThemedText>
              <ThemedText
                type="subText"
                style={[
                  styles.sectionTitle,
                  { color: theme.subText, margin: 0, fontSize: 12 },
                ]}
              >
                Events are visible to all group members by default. Select specific people only if needed.
              </ThemedText>
            </View>

            <View style={styles.wrapperInviteesShows}>
              {selected.length !== 0 && (
                <TouchableOpacity
                  onPress={selectAllUsers}
                  style={[
                    styles.numberOfInvitees,
                    { backgroundColor: theme.emergencyBackground },
                  ]}
                >
                  <ThemedText type="subText" style={{ color: "#212121" }}>
                    Select All
                  </ThemedText>
                  <Feather name={"check-square"} size={15} color={"#212121"} />
                </TouchableOpacity>
              )}

              <View style={styles.numberOfInvitees}>
                <Feather name="users" size={15} color={theme.text} />
                <ThemedText style={styles.sectionTitle} type="middleTitle">
                  {selected.length}
                </ThemedText>
              </View>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            style={{ minHeight: 200, height: 300, maxHeight: 300 }}
          >
            {loadingParents ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 20,
                }}
              >
                <ActivityIndicator size="large" color={theme.tint} />
                <ThemedText style={{ marginTop: 10, color: theme.subText }}>
                  Loading parents...
                </ThemedText>
              </View>
            ) : parents.length === 0 ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 20,
                }}
              >
                <ThemedText style={{ color: theme.subText }}>
                  No parents found
                </ThemedText>
              </View>
            ) : (
              parents.map((person) => (
                <TouchableOpacity
                  key={person.id}
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
                        style={[styles.avatar, { backgroundColor: "#aaa" }]}
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
                      </View>
                      <ThemedText style={styles.subtitle}>
                        {person.subtitle}
                      </ThemedText>
                    </View>
                  </View>

                  <Feather
                    name={
                      selected.includes(person.id) ? "check-square" : "square"
                    }
                    size={22}
                    color={selected.includes(person.id) ? theme.tint : "#bbb"}
                  />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <Divider />
          <TouchableOpacity style={styles.seeAll}>
            <ThemedText style={styles.seeAllText}>See All Contacts</ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleCreateEvent}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
              ? "Update Event"
              : "Create Event"}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>

      <MapPicker
        visible={mapPickerVisible}
        onClose={() => setMapPickerVisible(false)}
        onSelectLocation={(lat, lng, name) => {
          setLocationLatitude(lat.toString());
          setLocationLongitude(lng.toString());
          setLocationName(name || "");
          if (name) {
            setLocation(name);
          }
        }}
        initialLatitude={locationLatitude ? parseFloat(locationLatitude) : null}
        initialLongitude={
          locationLongitude ? parseFloat(locationLongitude) : null
        }
      />
    </View>
  );
}

export default CreateNewEvent;
