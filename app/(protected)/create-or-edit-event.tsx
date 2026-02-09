import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import Badge from "@/components/ui/badge";
import DatePicker from "@/components/ui/date-picker";
import Divider from "@/components/ui/divider";
import { CheckboxIcon, CheckedboxIcon } from "@/components/ui/icons/common-icons";
import { EventIcon } from "@/components/ui/icons/event-icons";
import { UsersIcon } from "@/components/ui/icons/messages-icons";
import MapPicker from "@/components/ui/map-picker";
import SelectBox, { OptionsList } from "@/components/ui/select-box-modal";
import SelectListBottomSheet from "@/components/ui/select-list-bottom-sheet";
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
import { useTranslation } from "react-i18next";
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
  avatar?: string; // Profile picture
  initials?: string; // If no picture
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
  const { t } = useTranslation();
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
  const [contactsSheetVisible, setContactsSheetVisible] = useState<boolean>(false);
  const [loadingEvent, setLoadingEvent] = useState<boolean>(false);

  // Fetch parents from API
  const fetchParents = useCallback(async () => {
    try {
      setLoadingParents(true);
      const response = await userService.getAll({
        page: 1,
        limit: 50,
        role: ["parent"]
      });
      const invitees = response.users.map(convertParentToInvitee);
      setParents(invitees);
    } catch (error: any) {
      console.error("Error fetching parents:", error);
      Alert.alert(
        t("common.error"),
        error.message || t("createEvent.failedLoadParents")
      );
    } finally {
      setLoadingParents(false);
    }
  }, [t]);

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
      setRestrictNumberOfPeopleInASlot(
        eventData.slotRestriction ?? (eventData as any).slot_restriction ?? false
      );

      if (eventData.slotDuration) {
        const duration = typeof eventData.slotDuration === "number"
          ? eventData.slotDuration
          : (eventData.slotDuration as any).value || 30;
        setSlotDuration(duration);
      }

      const maxPerSlot =
        eventData.maxParticipantsPerSlot ??
        (eventData as any).max_participants_per_slot;
      if (maxPerSlot != null && maxPerSlot > 0) {
        setCounter(maxPerSlot);
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
        t("common.error"),
        error.message || t("createEvent.failedLoadEvent")
      );
      router.back();
    } finally {
      setLoadingEvent(false);
    }
  }, [eventId, router, firstElementArray, firstElementArrayOfRepeatType, t]);

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

  // const selectAllUsers = () => {
  //   if (selected.length === parents.length) {
  //     setSelected([]);
  //   } else {
  //     setSelected(parents.map((person) => person.id));
  //   }
  // };

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
        type: (eventType[0].value as string).toLowerCase() as EventTypeEnum,
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
        slotRestriction:
          multipleTimeSlots ? restrictNumberOfPeopleInASlot : undefined,
        maxParticipantsPerSlot:
          multipleTimeSlots && restrictNumberOfPeopleInASlot
            ? Math.max(1, counter)
            : undefined,
        repeat: repeat ? (repeatType[0].value as RepeatType) : "none",
        requestRSVP: requestRSVP || undefined,
        // Events are visible to all group members by default
        // Only send inviteeIds if specific people are selected (optional)
        inviteeIds: selected.length > 0 ? selected : undefined,
      };

      if (isEditMode && eventId) {
        await eventService.update(eventId, eventData);
        Alert.alert(t("common.success"), t("createEvent.eventUpdated"), [
          {
            text: t("common.ok"),
            onPress: () => router.back(),
          },
        ]);
      } else {
        await eventService.create(eventData);
        Alert.alert(t("common.success"), t("createEvent.eventCreated"), [
          {
            text: t("common.ok"),
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} event:`, error);
      Alert.alert(
        t("common.error"),
        error.message || t("createEvent.failedCreateOrUpdate")
      );
    } finally {
      setLoading(false);
    }
  };

  const styles = useThemedStyles((theme) => ({
    container: { flex: 1, paddingHorizontal: 0, backgroundColor: theme.bg },
    containerScrollView: {
      padding: 10,
      paddingVertical: 15,
      flex: 1,
      backgroundColor: theme.bg,
      marginBottom: 15,
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
    sectionTitle: { color: theme.text, fontWeight: 500 },
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
      // padding: 5,
      paddingVertical: 8,
      paddingHorizontal: 12,
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
      flex: 1,
      flexShrink: 1,
      minWidth: 0,
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
    },

    counterSection: {
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
      flexShrink: 0,
      gap: 5,
      alignItems: "center",
    },
    numberOfInvitees: {
      flexDirection: "row",
      gap: 4,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
      paddingVertical: 3,
      backgroundColor: theme.panel,
      borderRadius: 10,
    },

    wrapperTime: {
      flexDirection: "row",
      gap: 16,
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },

    time: {
      flexDirection: "row",
      gap: 0,
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
    initials: { color: theme.text, fontWeight: "600" },
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
          title={isEditMode ? t("createEvent.editEvent") : t("createEvent.createNewEvent")}
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
        title={isEditMode ? t("createEvent.editEvent") : t("createEvent.createNewEvent")}
      />

      <ScrollView
        style={styles.containerScrollView}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {/* Contact */}
        <View style={styles.card}>
          <View style={styles.row}>
            <ThemedText style={styles.sectionTitle}>{t("createEvent.eventTitle")}</ThemedText>
          </View>
          <TextInput
            value={eventTitle}
            onChangeText={setEventTitle}
            placeholder={t("placeholders.eventName")}
            placeholderTextColor={theme.subText}
            style={styles.input}
          />
          {errors.eventTitle && (
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.eventTitle}
            </ThemedText>
          )}

          <View style={styles.row}>
            <ThemedText style={styles.sectionTitle}>{t("createEvent.eventType")}</ThemedText>
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
            title={t("createEvent.listOfEventType")}
          />
          {errors.eventType && (
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.eventType}
            </ThemedText>
          )}

          <View style={[styles.row, { marginTop: 10 }]}>
            <ThemedText style={styles.sectionTitle}>{t("createEvent.description")}</ThemedText>
          </View>

          <TextInput
            style={styles.messageInput}
            value={description}
            onChangeText={setDescription}
            placeholder={t("placeholders.whatToTalkAbout")}
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
            <ThemedText style={styles.sectionTitle}>{t("createEvent.location")}</ThemedText>
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
                  : t("createEvent.tapToSelectLocationOnMap"))}
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
              <ThemedText style={styles.sectionTitle}>{t("createEvent.requestRSVP")}</ThemedText>
              <ThemedText
                type="subText"
                style={[
                  styles.sectionTitle,
                  { color: theme.subText, margin: 0 },
                ]}
              >
                {t("createEvent.requestInviteesForRSVP")}
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
          <View style={[styles.row, { marginBottom: 16, flexDirection: "column", alignItems: "flex-start" }]}>
            <ThemedText style={styles.sectionTitle}>{t("createEvent.startDate")}</ThemedText>
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              marginBottom: 10,
              borderRadius: 10,
              width: "100%",
              backgroundColor: theme.panel,
              position: "relative"
            }}>
              <DatePicker date={startDate} setDate={setStartDate} />

              <View style={{ position: "absolute", right: 12, top: 12 }}>
                <EventIcon size={16} color={theme.subText} />
              </View>
            </View>
          </View>
          {errors.startDate && (
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.startDate}
            </ThemedText>
          )}

          <View style={[styles.row, { flexDirection: "column", alignItems: "flex-start" }]}>
            <ThemedText style={styles.sectionTitle}>{t("createEvent.endDate")}</ThemedText>

            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              marginBottom: 10,
              borderRadius: 10,
              width: "100%",
              backgroundColor: theme.panel,
              position: "relative"
            }}>
              <DatePicker date={endDate} setDate={setEndDate} />

              <View style={{ position: "absolute", right: 12, top: 12 }}>
                <EventIcon size={16} color={theme.subText} />
              </View>
            </View>
          </View>
          {errors.endDate && (
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.endDate}
            </ThemedText>
          )}

          <Divider />

          <View style={styles.row}>
            <View style={styles.switchColumn}>
              <ThemedText style={styles.sectionTitle}>{t("createEvent.allDayEvent")}</ThemedText>
            </View>
            <Switch
              value={allDayEvent}
              onValueChange={setAllDayEvent}
              trackColor={{ false: "#ccc", true: "#a846c2" }}
              thumbColor={allDayEvent ? "#fff" : "#fff"}
            // style={{ marginTop: 10 }}
            />
          </View>

          {allDayEvent ? null : (
            <View style={styles.wrapperTime}>
              <View style={{ flexDirection: "column", gap: 4, flex: 1 }}>
                <View style={[styles.time, { flexDirection: "column", width: "100%" }]}>
                  <ThemedText
                    style={[styles.sectionTitle]}
                  >
                    {t("createEvent.startTime")}
                  </ThemedText>
                  <View style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    marginBottom: 10,
                    borderRadius: 10,
                    width: "100%",
                    backgroundColor: theme.panel,
                    position: "relative"
                  }}>
                    <DatePicker
                      mode="time"
                      disabled={allDayEvent}
                      date={startDateTime}
                      setDate={setStartDateTime}
                    />
                  </View>
                </View>
                {errors.startDateTime && (
                  <ThemedText type="subLittleText" style={styles.error}>
                    {errors.startDateTime}
                  </ThemedText>
                )}
              </View>

              <View style={{ flexDirection: "column", gap: 4, flex: 1 }}>
                <View style={[styles.time, { flexDirection: "column", width: "100%" }]}>
                  <ThemedText
                    style={[styles.sectionTitle]}
                  >
                    {t("createEvent.endTime")}
                  </ThemedText>
                  <View style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    marginBottom: 10,
                    borderRadius: 10,
                    width: "100%",
                    backgroundColor: theme.panel,
                    position: "relative"
                  }}>
                    <DatePicker
                      mode="time"
                      disabled={allDayEvent}
                      date={endDateTime}
                      setDate={setEndDateTime}
                    />
                  </View>
                </View>
                {errors.endDateTime && (
                  <ThemedText type="subLittleText" style={styles.error}>
                    {errors.endDateTime}
                  </ThemedText>
                )}
              </View>
            </View>
          )}

          <View style={[styles.row, { marginTop: 0 }]}>
            <View style={styles.switchColumn}>
              <ThemedText style={styles.sectionTitle}>
                {t("createEvent.multipleTimeSlots")}
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
                  {t("createEvent.slotDuration")}
                </ThemedText>
              </View>

              <TextInput
                placeholder={t("placeholders.eventDuration")}
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
                    {t("createEvent.slotRestriction")}
                  </ThemedText>
                  <ThemedText
                    type="subText"
                    style={[
                      styles.sectionTitle,
                      { color: theme.subText, margin: 0 },
                    ]}
                  >
                    {t("createEvent.restrictPeopleInSlot")}
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

              <View style={styles.counterSection}>
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
                    disabled={!restrictNumberOfPeopleInASlot}
                    onPress={() => decrementCounter()}
                    style={{ width: "45%" }}
                  >
                    <ThemedText
                      type="title"
                      style={[
                        styles.decrementBtn,
                        {
                          color: !restrictNumberOfPeopleInASlot
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
                    disabled={!restrictNumberOfPeopleInASlot}
                    onPress={() => incrementCounter()}
                    style={{ width: "45%" }}
                  >
                    <ThemedText
                      type="title"
                      style={[
                        styles.incrementBtn,
                        {
                          color: !restrictNumberOfPeopleInASlot
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
              <ThemedText style={styles.sectionTitle}>{t("createEvent.repeat")}</ThemedText>
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
            title={t("createEvent.listOfRepetitions")}
          />
          {errors.repeatType && (
            <ThemedText type="subLittleText" style={styles.error}>
              {errors.repeatType}
            </ThemedText>
          )}
        </View>

        <View style={styles.card}>
          <View style={[styles.row, { flexWrap: "wrap", gap: 8 }]}>
            <View style={styles.switchColumn}>
              <ThemedText style={styles.sectionTitle}>{t("createEvent.inviteesOptional")}</ThemedText>
              <ThemedText
                type="subText"
                style={[
                  styles.sectionTitle,
                  { color: theme.subText, margin: 0, fontSize: 12 },
                ]}
              >
                {t("createEvent.inviteesHint")}
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
                  <ThemedText type="subText" style={{ color: "#212121" }}>
                    {t("createEvent.selectAll")}
                  </ThemedText>
                  <Feather name={"check-square"} size={15} color={"#212121"} />
                </TouchableOpacity>
              )} */}

              <View style={styles.numberOfInvitees}>
                <UsersIcon size={15} color={theme.text} />
                <ThemedText style={[styles.sectionTitle, { fontWeight: 400 }]} type="subText">
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
                  {t("createEvent.loadingParents")}
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
                  {t("createEvent.noParentsFound")}
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
                        style={[styles.avatar, { backgroundColor: theme.panel }]}
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
                        {person.isAdmin && <Badge variant="Admin" title={t("common.admin")} />}
                      </View>
                      <ThemedText style={styles.subtitle}>
                        {person.subtitle}
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
              ))
            )}
          </ScrollView>
          <Divider />
          <TouchableOpacity
            style={styles.seeAll}
            onPress={() => setContactsSheetVisible(true)}
          >
            <ThemedText style={styles.seeAllText}>{t("createEvent.seeAllContacts")}</ThemedText>
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
                ? t("createEvent.updating")
                : t("createEvent.creating")
              : isEditMode
                ? t("createEvent.updateEvent")
                : t("createEvent.createEvent")}
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
      <SelectListBottomSheet
        visible={contactsSheetVisible}
        onClose={() => setContactsSheetVisible(false)}
        mode="users"
        items={parents}
        selectedIds={selected}
        onToggle={toggleSelect}
        title={t("createEvent.seeAllContacts")}
      />
    </View>
  );
}

export default CreateNewEvent;
