// app/school-calendar.tsx (or any path you want)
import HeaderThreeSections from "@/components/reptitive-component/header-three-sections";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CheckMarkCircleFillIcon, QuestionMarkCircleFillIcon, XMarkCircleFillIcon } from "@/components/ui/icons/event-icons";
import { useThemedStyles } from "@/hooks/use-theme-style";
import {
  EventResponseDto,
  eventService,
  RSVPStatus,
  TimeSlotDto,
} from "@/services/event.service";
import { useStore } from "@/store";
import {
  AntDesign,
  Feather,
  FontAwesome,
  FontAwesome6,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Helper function to format date (uses t for month names)
const formatDate = (dateString: string, t: (key: string) => string): string => {
  const date = new Date(dateString);
  const monthKey = `event.monthShort${date.getMonth()}` as const;
  return `${t(monthKey)} ${date.getDate()}`;
};

// Helper function to extract string from time field (can be object or string)
const extractTimeString = (
  time: Record<string, any> | string | null | undefined
): string | null => {
  if (!time) return null;
  if (typeof time === "string") return time;
  // If it's an object, try to extract a time string (adjust based on actual API structure)
  if (typeof time === "object" && time !== null) {
    // Try common time field names
    return (
      (time as any).time ||
      (time as any).value ||
      (time as any).startTime ||
      null
    );
  }
  return null;
};

// Helper function to format time string (HH:mm:ss or HH:mm) to readable format
const formatTimeString = (timeString: string, allDayLabel: string): string => {
  if (!timeString) return allDayLabel;

  // Handle time string format like "15:00:00" or "15:00"
  const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes} ${period}`;
  }

  // If it's a full datetime string, try to parse it
  try {
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
  } catch {
    // Ignore parsing errors
  }

  return timeString; // Return as-is if can't parse
};

// Helper function to format time
const formatTime = (
  time: Record<string, any> | string | null | undefined,
  allDayLabel: string
): string => {
  const timeString = extractTimeString(time);
  if (!timeString) return allDayLabel;
  return formatTimeString(timeString, allDayLabel);
};

// Helper function to format time range
const formatTimeRange = (
  startTime: Record<string, any> | string | null | undefined,
  endTime: Record<string, any> | string | null | undefined,
  allDay: boolean,
  allDayLabel: string
): string => {
  if (allDay) return allDayLabel;
  const start = formatTime(startTime, allDayLabel);
  const end = formatTime(endTime, allDayLabel);
  if (start === allDayLabel || end === allDayLabel) return allDayLabel;
  return `${start} - ${end}`;
};

// Helper function to format time slot range (for time slots which are always strings)
const formatTimeSlotRange = (startTime: string, endTime: string, allDayLabel: string): string => {
  const start = formatTimeString(startTime, allDayLabel);
  const end = formatTimeString(endTime, allDayLabel);
  return `${start} - ${end}`;
};

// Helper function to extract string from description/location (can be object or string)
const extractString = (
  value: Record<string, any> | string | null | undefined
): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    // Try common field names for localized strings
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

// Helper function to open location in maps
const openLocationInMaps = async (event: EventResponseDto, t: (key: string) => string) => {
  let url: string | null = null;

  // Prefer platform-specific maps, fallback to coordinates or location text
  if (Platform.OS === "ios" && event.appleMapsUrl) {
    url = event.appleMapsUrl;
  } else if (Platform.OS === "android" && event.googleMapsUrl) {
    url = event.googleMapsUrl;
  } else if (event.appleMapsUrl) {
    url = event.appleMapsUrl;
  } else if (event.googleMapsUrl) {
    url = event.googleMapsUrl;
  } else if (event.locationLatitude && event.locationLongitude) {
    // Generate maps URL from coordinates
    const lat = event.locationLatitude;
    const lng = event.locationLongitude;
    const locationName = encodeURIComponent(
      extractString(event.location) || t("event.locationLabel")
    );

    if (Platform.OS === "ios") {
      url = `https://maps.apple.com/?ll=${lat},${lng}&q=${locationName}`;
    } else {
      url = `https://www.google.com/maps?q=${lat},${lng}&label=${locationName}`;
    }
  }

  if (url) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t("common.error"), t("event.mapsError"));
      }
    } catch (error) {
      console.error("Error opening maps:", error);
      Alert.alert(t("common.error"), t("event.mapsFailed"));
    }
  } else {
    Alert.alert(t("event.noLocation"), t("event.noLocationDesc"));
  }
};

type EventKind = "Conference" | "Fieldtrip" | "Event" | "Holiday";

// Map type string (lowercase) to EventKind for display
const mapEventTypeToKind = (type: string): EventKind => {
  const normalizedType = type.toLowerCase();
  switch (normalizedType) {
    case "conference":
      return "Conference";
    case "fieldtrip":
      return "Fieldtrip";
    case "event":
      return "Event";
    case "holiday":
      return "Holiday";
    default:
      return "Event";
  }
};

const kindChip = (k: EventKind, t: (key: string) => string) => {
  switch (k) {
    case "Conference":
      return {
        label: t("event.kindConference"),
        bg: "#E6F0FF",
        text: "#1D4ED8",
        icon: <Feather name="users" size={15} color="#1D4ED8" />,
      };
    case "Fieldtrip":
      return {
        label: t("event.kindFieldtrip"),
        bg: "#F3E8FF",
        text: "#7C3AED",
        icon: <FontAwesome6 name="bus" size={15} color="#7C3AED" />,
      };
    case "Event":
      return {
        label: t("event.kindEvent"),
        bg: "#EAFCEF",
        text: "#16A34A",
        icon: <MaterialIcons name="event-note" size={15} color="#16A34A" />,
      };
    case "Holiday":
      return {
        label: t("event.kindHoliday"),
        bg: "#FEE2E2",
        text: "#DC2626",
        icon: <AntDesign name="gift" size={15} color="#DC2626" />,
      };
    default:
      return {
        label: t("event.kindEvent"),
        bg: "#EAFCEF",
        text: "#16A34A",
        icon: <MaterialIcons name="event-note" size={15} color="#16A34A" />,
      };
  }
};

const SchoolCalendarScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useStore((s) => s.theme);
  const currentDate = new Date();
  const [monthIndex, setMonthIndex] = useState(currentDate.getMonth()); // Current month
  const [year, setYear] = useState(currentDate.getFullYear()); // Current year
  const [events, setEvents] = useState<EventResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [timeSlotModalVisible, setTimeSlotModalVisible] = useState(false);
  const [selectedEventForSlot, setSelectedEventForSlot] =
    useState<EventResponseDto | null>(null);
  const [expandedRsvpEventId, setExpandedRsvpEventId] = useState<string | null>(
    null
  );
  const [openDropdownEventId, setOpenDropdownEventId] = useState<string | null>(
    null
  );
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const currentUser = useStore((s) => s.user);
  const isAdmin = currentUser?.role === "admin";
  const isTeacher = currentUser?.role === "teacher";

  // Helper function to check if user can edit/delete an event
  const canEditDeleteEvent = (event: EventResponseDto): boolean => {
    if (isAdmin) return true; // Admins can edit/delete any event
    if (isTeacher) {
      // Teachers can only edit/delete events they created
      return event.creatorId === currentUser?.id;
    }
    return false;
  };

  const monthTitle = useMemo(() => {
    const months = [
      t("event.month0"),
      t("event.month1"),
      t("event.month2"),
      t("event.month3"),
      t("event.month4"),
      t("event.month5"),
      t("event.month6"),
      t("event.month7"),
      t("event.month8"),
      t("event.month9"),
      t("event.month10"),
      t("event.month11"),
    ];
    return `${months[monthIndex]} ${year}`;
  }, [monthIndex, year, t]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // monthIndex is 0-based (0-11), API expects 1-based (1-12)
      const month = monthIndex + 1;

      const response = await eventService.getAll({
        page: 1,
        limit: 100,
        filter: "upcoming",
        month,
        year,
      });

      setEvents(response.events);
    } catch (err: any) {
      const errorMessage =
        err.message || t("event.failedLoadEvents");
      setError(errorMessage);
      Alert.alert(t("common.error"), errorMessage);
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }, [monthIndex, year, t]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Refresh events when screen comes into focus (e.g., after creating an event)
  useFocusEffect(
    useCallback(() => {
      fetchEvents();
      // Close dropdown when screen comes into focus
      setOpenDropdownEventId(null);
    }, [fetchEvents])
  );

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.bg, paddingHorizontal: 0 },

    monthBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: t.border,
      marginBottom: 20,
    },
    monthSelector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "95%",
    },
    chevronBtn: {
      borderWidth: 1,
      borderColor: t.border,
      padding: 6,
      borderRadius: 8,
      backgroundColor: t.bg,
    },
    monthText: { color: t.text },
    list: { paddingBottom: insets.bottom + 40 },
    card: {
      backgroundColor: t.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      padding: 14,
      margin: 10,
    },
    row: { flexDirection: "row", alignItems: "center" },
    chip: {
      flexDirection: "row",
      alignSelf: "flex-start",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: 8,
    },
    metaRow: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      flexWrap: "wrap",
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      flexShrink: 1,
    },
    desc: { marginTop: 10, color: t.text },
    endmessage: {
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      marginTop: 20,
    },
    dropdownSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    rsvpButtons: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    rsvpButton: {
      flex: 1,
      minWidth: 90,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    timeSlotItem: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      marginBottom: 12,
      minHeight: 60,
      justifyContent: "center",
    },
    timeSlotHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    timeSlotInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    selectSlotButton: {
      marginTop: 12,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    dropdownContainer: {
      position: "relative",
    },
    dropdownMenu: {
      position: "absolute",
      top: 30,
      right: 0,
      backgroundColor: theme.bg,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      minWidth: 120,
      zIndex: 1000,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
  }));

  const handlePrev = () => {
    setMonthIndex((m) => {
      const newMonth = (m - 1 + 12) % 12;
      if (newMonth === 11) {
        setYear((y) => y - 1);
      }
      return newMonth;
    });
  };
  const handleNext = () => {
    setMonthIndex((m) => {
      const newMonth = (m + 1) % 12;
      if (newMonth === 0) {
        setYear((y) => y + 1);
      }
      return newMonth;
    });
  };

  const handleRSVP = async (
    eventId: string,
    status: RSVPStatus,
    timeSlotId?: string
  ) => {
    try {
      setSubmitting(eventId);
      await eventService.rsvp(eventId, status, timeSlotId);
      const statusText =
        status === "going"
          ? t("buttons.going")
          : status === "maybe"
            ? t("buttons.maybe")
            : t("buttons.notGoing");
      Alert.alert(t("common.success"), t("event.rsvpUpdated", { status: statusText }));
      // Refresh events
      await fetchEvents();
      // Close modal if time slot was selected
      if (timeSlotId) {
        closeTimeSlotModal();
      }
    } catch (err: any) {
      Alert.alert(
        t("common.error"),
        err.message || t("event.failedUpdateRsvp")
      );
      console.error("Error updating RSVP:", err);
    } finally {
      setSubmitting(null);
    }
  };

  const openTimeSlotModal = (event: EventResponseDto) => {
    setSelectedEventForSlot(event);
    setTimeSlotModalVisible(true);
  };

  const closeTimeSlotModal = () => {
    setTimeSlotModalVisible(false);
    setSelectedEventForSlot(null);
  };

  const toggleRsvpDropdown = (eventId: string) => {
    setExpandedRsvpEventId(expandedRsvpEventId === eventId ? null : eventId);
  };

  const handleEditEvent = (eventId: string) => {
    setOpenDropdownEventId(null);
    router.push(`/create-or-edit-event?eventId=${eventId}`);
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    setOpenDropdownEventId(null);
    Alert.alert(
      t("event.deleteEvent"),
      t("event.deleteEventConfirm", { title: eventTitle }),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("buttons.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingEventId(eventId);
              await eventService.delete(eventId);
              Alert.alert(t("common.success"), t("event.eventDeleted"));
              // Refresh events
              await fetchEvents();
            } catch (error: any) {
              console.error("Error deleting event:", error);
              Alert.alert(
                t("common.error"),
                error.message || t("event.failedDeleteEvent")
              );
            } finally {
              setDeletingEventId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <HeaderThreeSections
        title={t("event.schoolCalendar")}
        desc={t("event.schoolCalendarDesc")}
        icon={
          <Ionicons name="add-circle-outline" size={24} color={theme.tint} />
        }
        colorDesc={theme.subText}
        onPress={() => router.push("/create-or-edit-event")}
        buttonRoles={["admin", "teacher"]}
      />

      {/* Month Selector */}
      <View style={styles.monthBar}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePrev} style={styles.chevronBtn}>
            <AntDesign name="left" size={16} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="defaultSemiBold" style={styles.monthText}>
            {monthTitle}
          </ThemedText>
          <TouchableOpacity onPress={handleNext} style={styles.chevronBtn}>
            <AntDesign name="right" size={16} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {loading ? (
          <View style={styles.endmessage}>
            <ThemedText type="subtitle" style={{ color: theme.text }}>
              {t("event.loadingEvents")}
            </ThemedText>
          </View>
        ) : error ? (
          <View style={styles.endmessage}>
            <ThemedText type="subtitle" style={{ color: theme.text }}>
              {error}
            </ThemedText>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.endmessage}>
            <FontAwesome name="calendar" size={24} color={theme.subText} />
            <ThemedText type="subtitle" style={{ color: theme.text }}>
              {t("event.noEventsFound")}
            </ThemedText>
            <ThemedText type="subText" style={{ color: theme.subText }}>
              {t("event.checkBackLater")}
            </ThemedText>
          </View>
        ) : (
          events.map((ev) => {
            const kind = mapEventTypeToKind(ev.type);
            const chip = kindChip(kind, t);
            const dateText = formatDate(ev.startDate, t);
            const timeText = formatTimeRange(
              ev.startTime,
              ev.endTime,
              ev.allDay,
              t("event.allDay")
            );
            const locationText = extractString(ev.location);
            const descriptionText = extractString(ev.description);

            // Get current user's RSVP status
            const currentUser = useStore.getState().user;
            const currentUserInvitee = ev.invitees?.find((invitee) => {
              return invitee.userId === currentUser?.id;
            });
            // Normalize RSVP status (handle both old and new API formats)
            const rawStatus = (currentUserInvitee?.rsvpStatus ||
              "pending") as string;
            const currentRsvpStatus: RSVPStatus =
              rawStatus === "accepted"
                ? "going"
                : rawStatus === "declined"
                  ? "not_going"
                  : (rawStatus as RSVPStatus);

            const isSubmittingEvent = submitting === ev.id;
            const isRsvpExpanded = expandedRsvpEventId === ev.id;

            // Determine RSVP display for button
            let rsvpButtonDisplay = null;
            if (ev.requestRSVP && !ev.multipleTimeSlots) {
              if (currentRsvpStatus === "going") {
                rsvpButtonDisplay = {
                  text: t("buttons.going"),
                  icon: "check-circle",
                  color: "#16A34A",
                  bg: "#EAFCEF",
                };
              } else if (currentRsvpStatus === "maybe") {
                rsvpButtonDisplay = {
                  text: t("buttons.maybe"),
                  icon: "help-circle",
                  color: "#F59E0B",
                  bg: "#FEF3C7",
                };
              } else if (currentRsvpStatus === "not_going") {
                rsvpButtonDisplay = {
                  text: t("buttons.notGoing"),
                  icon: "x-circle",
                  color: "#DC2626",
                  bg: "#FEE2E2",
                };
              } else {
                rsvpButtonDisplay = {
                  text: t("buttons.rsvp"),
                  icon: "question",
                  color: theme.subText,
                  bg: theme.panel,
                };
              }
            }

            return (
              <TouchableOpacity
                key={ev.id}
                onPress={() => router.push(`/event/${ev.id}`)}
              >
                <ThemedView style={styles.card}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <ThemedText
                      type="defaultSemiBold"
                      style={{ color: theme.text, flex: 1 }}
                    >
                      {ev.title}
                    </ThemedText>
                    {canEditDeleteEvent(ev) && (
                      <View style={styles.dropdownContainer}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            setOpenDropdownEventId(
                              openDropdownEventId === ev.id ? null : ev.id
                            );
                          }}
                          style={{
                            padding: 6,
                          }}
                        >
                          <Ionicons
                            name="ellipsis-horizontal"
                            size={20}
                            color={theme.text}
                          />
                        </TouchableOpacity>
                        {openDropdownEventId === ev.id && (
                          <Pressable
                            onPress={(e) => e.stopPropagation()}
                            style={styles.dropdownMenu}
                          >
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => handleEditEvent(ev.id)}
                            >
                              <Ionicons
                                name="create-outline"
                                size={18}
                                color={theme.text}
                              />
                              <ThemedText
                                type="subText"
                                style={{ color: theme.text }}
                              >
                                {t("event.edit")}
                              </ThemedText>
                            </TouchableOpacity>
                            <View
                              style={{
                                height: 1,
                                backgroundColor: theme.border,
                                marginVertical: 4,
                              }}
                            />
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => handleDeleteEvent(ev.id, ev.title)}
                              disabled={deletingEventId === ev.id}
                            >
                              {deletingEventId === ev.id ? (
                                <ActivityIndicator size="small" color="#DC2626" />
                              ) : (
                                <Ionicons
                                  name="trash-outline"
                                  size={18}
                                  color="#DC2626"
                                />
                              )}
                              <ThemedText
                                type="subText"
                                style={{
                                  color: deletingEventId === ev.id ? theme.subText : "#DC2626",
                                }}
                              >
                                {t("buttons.delete")}
                              </ThemedText>
                            </TouchableOpacity>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Kind Chip */}
                  <View style={[styles.chip, { backgroundColor: chip.bg }]}>
                    {chip.icon}
                    <ThemedText type="subText" style={{ color: chip.text }}>
                      {chip.label}
                    </ThemedText>
                  </View>

                  {/* Meta */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Feather name="calendar" size={16} color={theme.text} />
                      <ThemedText
                        type="subText"
                        style={{ color: theme.subText }}
                      >
                        {dateText}
                      </ThemedText>
                    </View>
                    <View style={styles.metaItem}>
                      <Feather name="clock" size={16} color={theme.text} />
                      <ThemedText
                        type="subText"
                        style={{ color: theme.subText }}
                      >
                        {timeText}
                      </ThemedText>
                    </View>
                    {!!locationText && (
                      <TouchableOpacity
                        style={[
                          styles.metaItem,
                          { flex: 1, flexShrink: 1, minWidth: 0 },
                        ]}
                        onPress={() => openLocationInMaps(ev, t)}
                        activeOpacity={0.7}
                      >
                        <Feather name="map-pin" size={16} color={theme.tint} />
                        <ThemedText
                          type="subText"
                          style={{
                            color: theme.tint,
                            textDecorationLine: "underline",
                            flex: 1,
                            flexShrink: 1,
                          }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {locationText}
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Description */}
                  {!!descriptionText && (
                    <ThemedText type="default" style={styles.desc}>
                      {descriptionText}
                    </ThemedText>
                  )}

                  {/* Time Slot Button */}
                  {ev.requestRSVP && ev.multipleTimeSlots && (
                    <TouchableOpacity
                      style={{
                        marginTop: 12,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: theme.panel,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => openTimeSlotModal(ev)}
                      disabled={isSubmittingEvent}
                    >
                      {isSubmittingEvent ? (
                        <ActivityIndicator size="small" color={theme.tint} />
                      ) : (
                        <>
                          <Feather name="clock" size={18} color={theme.tint} />
                          <ThemedText
                            style={{
                              color: theme.tint,
                              fontWeight: "500",
                              marginLeft: 8,
                            }}
                          >
                            {t("event.chooseTimeSlot")}
                          </ThemedText>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* RSVP Button with Dropdown */}
                  {ev.requestRSVP &&
                    !ev.multipleTimeSlots &&
                    rsvpButtonDisplay && (
                      <View style={{ marginTop: 12 }}>
                        <TouchableOpacity
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            backgroundColor: rsvpButtonDisplay.bg,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                          onPress={() => toggleRsvpDropdown(ev.id)}
                          disabled={isSubmittingEvent}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {isSubmittingEvent ? (
                              <ActivityIndicator
                                size="small"
                                color={rsvpButtonDisplay.color}
                              />
                            ) : (
                              <Feather
                                name={rsvpButtonDisplay.icon as any}
                                size={18}
                                color={rsvpButtonDisplay.color}
                              />
                            )}
                            <ThemedText
                              style={{
                                color: rsvpButtonDisplay.color,
                                fontWeight: "500",
                              }}
                            >
                              {rsvpButtonDisplay.text}
                            </ThemedText>
                          </View>
                          <Feather
                            name={
                              isRsvpExpanded ? "chevron-up" : "chevron-down"
                            }
                            size={16}
                            color={rsvpButtonDisplay.color}
                          />
                        </TouchableOpacity>

                        {/* RSVP Dropdown Options */}
                        {isRsvpExpanded && (
                          <View
                            style={[styles.dropdownSection, { marginTop: 8 }]}
                          >
                            <View style={styles.rsvpButtons}>
                              <TouchableOpacity
                                style={[
                                  styles.rsvpButton,
                                  {
                                    borderColor:
                                      currentRsvpStatus === "going"
                                        ? "#16A34A"
                                        : theme.border,
                                    backgroundColor:
                                      currentRsvpStatus === "going"
                                        ? "#EAFCEF"
                                        : theme.bg,
                                  },
                                ]}
                                onPress={() => {
                                  handleRSVP(ev.id, "going");
                                  toggleRsvpDropdown(ev.id);
                                }}
                                disabled={isSubmittingEvent}
                              >
                                <CheckMarkCircleFillIcon
                                  size={18}
                                  color={
                                    currentRsvpStatus === "going"
                                      ? "#16A34A"
                                      : theme.subText
                                  }
                                />
                                <ThemedText
                                  style={{
                                    marginTop: 4,
                                    color:
                                      currentRsvpStatus === "going"
                                        ? "#16A34A"
                                        : theme.subText,
                                    fontWeight:
                                      currentRsvpStatus === "going"
                                        ? "600"
                                        : "400",
                                  }}
                                >
                                  {t("buttons.going")}
                                </ThemedText>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.rsvpButton,
                                  {
                                    borderColor:
                                      currentRsvpStatus === "maybe"
                                        ? "#F59E0B"
                                        : theme.border,
                                    backgroundColor:
                                      currentRsvpStatus === "maybe"
                                        ? "#FEF3C7"
                                        : theme.bg,
                                  },
                                ]}
                                onPress={() => {
                                  handleRSVP(ev.id, "maybe");
                                  toggleRsvpDropdown(ev.id);
                                }}
                                disabled={isSubmittingEvent}
                              >
                                <QuestionMarkCircleFillIcon
                                  size={18}
                                  color={
                                    currentRsvpStatus === "maybe"
                                      ? "#F59E0B"
                                      : theme.subText
                                  }
                                />
                                <ThemedText
                                  style={{
                                    marginTop: 4,
                                    color:
                                      currentRsvpStatus === "maybe"
                                        ? "#F59E0B"
                                        : theme.subText,
                                    fontWeight:
                                      currentRsvpStatus === "maybe"
                                        ? "600"
                                        : "400",
                                  }}
                                >
                                  {t("buttons.maybe")}
                                </ThemedText>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.rsvpButton,
                                  {
                                    borderColor:
                                      currentRsvpStatus === "not_going"
                                        ? "#DC2626"
                                        : theme.border,
                                    backgroundColor:
                                      currentRsvpStatus === "not_going"
                                        ? "#FEE2E2"
                                        : theme.bg,
                                  },
                                ]}
                                onPress={() => {
                                  handleRSVP(ev.id, "not_going");
                                  toggleRsvpDropdown(ev.id);
                                }}
                                disabled={isSubmittingEvent}
                              >
                                <XMarkCircleFillIcon
                                  size={18}
                                  color={
                                    currentRsvpStatus === "not_going"
                                      ? "#DC2626"
                                      : theme.subText
                                  }
                                />
                                <ThemedText
                                  style={{
                                    marginTop: 4,
                                    color:
                                      currentRsvpStatus === "not_going"
                                        ? "#DC2626"
                                        : theme.subText,
                                    fontWeight:
                                      currentRsvpStatus === "not_going"
                                        ? "600"
                                        : "400",
                                  }}
                                >
                                  {t("buttons.notGoing")}
                                </ThemedText>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                </ThemedView>
              </TouchableOpacity>
            );
          })
        )}
        {!loading && events.length > 0 && (
          <View style={styles.endmessage}>
            <FontAwesome name="calendar" size={24} color={theme.subText} />
            <ThemedText type="subtitle" style={{ color: theme.text }}>
              {t("event.thatsAllForNow")}
            </ThemedText>
            <ThemedText type="subText" style={{ color: theme.subText }}>
              {t("event.checkBackLater")}
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Time Slot Selection Modal */}
      <Modal
        visible={timeSlotModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeTimeSlotModal}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <ThemedView
            style={{
              backgroundColor: theme.bg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: insets.bottom + 20,
              maxHeight: "80%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <ThemedText
                type="defaultSemiBold"
                style={{ fontSize: 18, color: theme.text }}
              >
                {t("event.chooseTimeSlot")}
              </ThemedText>
              <TouchableOpacity onPress={closeTimeSlotModal}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedEventForSlot &&
              selectedEventForSlot.timeSlots &&
              Array.isArray(selectedEventForSlot.timeSlots) &&
              selectedEventForSlot.timeSlots.length > 0 ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 400 }}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                {selectedEventForSlot.timeSlots.map((slot: TimeSlotDto) => {
                  if (!slot || !slot.id) return null;

                  const currentUser = useStore.getState().user;
                  const currentUserInvitee =
                    selectedEventForSlot.invitees?.find((invitee) => {
                      return invitee.userId === currentUser?.id;
                    });
                  const isSelected =
                    currentUserInvitee?.selectedTimeSlotId === slot.id;
                  const slotsLeft = slot.maxParticipants
                    ? slot.maxParticipants - slot.currentParticipants
                    : null;
                  const isFull = slotsLeft !== null && slotsLeft <= 0;
                  const isSubmittingSlot =
                    submitting === selectedEventForSlot.id;

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.timeSlotItem,
                        {
                          borderColor: isSelected ? theme.tint : theme.border,
                          backgroundColor: isSelected
                            ? `${theme.tint}15`
                            : theme.panel,
                          opacity: isFull ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => {
                        if (
                          !isFull &&
                          !isSubmittingSlot &&
                          selectedEventForSlot
                        ) {
                          handleRSVP(selectedEventForSlot.id, "going", slot.id);
                        }
                      }}
                      disabled={isFull || isSubmittingSlot}
                    >
                      <View style={styles.timeSlotInfo}>
                        <View
                          style={[
                            styles.radioButton,
                            {
                              borderColor: isSelected
                                ? theme.tint
                                : theme.border,
                              backgroundColor: isSelected
                                ? theme.tint
                                : "transparent",
                            },
                          ]}
                        >
                          {isSelected && (
                            <View
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: theme.bg,
                              }}
                            />
                          )}
                        </View>
                        <ThemedText
                          type="defaultSemiBold"
                          style={{
                            color: theme.text,
                            fontSize: 16,
                          }}
                        >
                          {slot.startTime && slot.endTime
                            ? formatTimeSlotRange(slot.startTime, slot.endTime, t("event.allDay"))
                            : t("event.timeSlot")}
                        </ThemedText>
                      </View>
                      {slotsLeft !== null && (
                        <ThemedText
                          type="subText"
                          style={{
                            color: theme.subText,
                            marginTop: 8,
                            fontSize: 14,
                          }}
                        >
                          {t("event.slotsLeft", { count: slotsLeft, max: slot.maxParticipants })}
                        </ThemedText>
                      )}
                      {isFull && (
                        <ThemedText
                          type="subText"
                          style={{
                            color: "#DC2626",
                            marginTop: 8,
                            fontSize: 14,
                            fontWeight: "600",
                          }}
                        >
                          {t("event.full")}
                        </ThemedText>
                      )}
                      {isSubmittingSlot && isSelected && (
                        <ActivityIndicator
                          size="small"
                          color={theme.tint}
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ThemedText
                  style={{
                    color: theme.subText,
                    textAlign: "center",
                    fontSize: 16,
                  }}
                >
                  {selectedEventForSlot
                    ? t("event.noTimeSlots")
                    : t("common.loading")}
                </ThemedText>
              </View>
            )}
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default SchoolCalendarScreen;
