import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CheckMarkCircleFillIcon, QuestionMarkCircleFillIcon, XMarkCircleFillIcon } from "@/components/ui/icons/event-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
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
  FontAwesome6,
  MaterialIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
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

// Helper function to format time string (HH:mm:ss or HH:mm) to readable format
const formatTimeString = (timeString: string, allDayLabel: string): string => {
  if (!timeString) return allDayLabel;

  const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes} ${period}`;
  }

  return timeString;
};

// Helper function to format time range
const formatTimeRange = (startTime: string, endTime: string, allDayLabel: string): string => {
  const start = formatTimeString(startTime, allDayLabel);
  const end = formatTimeString(endTime, allDayLabel);
  return `${start} - ${end}`;
};

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

type EventKind = "Conference" | "Fieldtrip" | "Event" | "Holiday";

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

const EventDetailScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useStore((s) => s.theme);
  const colorScheme = useColorScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useStore((s) => s.user);

  const [event, setEvent] = useState<EventResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string | null>(
    null
  );
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>("pending");
  const [submitting, setSubmitting] = useState(false);
  const [showAllInvitees, setShowAllInvitees] = useState(false);

  // Get current user's RSVP status from invitees
  const currentUserInvitee = event?.invitees?.find((invitee) => {
    return invitee.userId === currentUser?.id;
  });

  useEffect(() => {
    if (currentUserInvitee) {
      // Normalize RSVP status (handle both old and new API formats)
      const rawStatus = currentUserInvitee.rsvpStatus as string;
      const normalizedStatus: RSVPStatus =
        rawStatus === "accepted"
          ? "going"
          : rawStatus === "declined"
            ? "not_going"
            : (rawStatus as RSVPStatus);
      setRsvpStatus(normalizedStatus);
      setSelectedTimeSlotId(currentUserInvitee.selectedTimeSlotId || null);
    }
  }, [currentUserInvitee, currentUser]);

  const fetchEvent = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const eventData = await eventService.getById(id);
      setEvent(eventData);
    } catch (err: any) {
      const errorMessage =
        err.message || t("createEvent.failedLoadEvent");
      setError(errorMessage);
      Alert.alert(t("common.error"), errorMessage);
      console.error("Error fetching event:", err);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleRSVP = async (status: RSVPStatus, timeSlotId?: string) => {
    if (!event) return;

    try {
      setSubmitting(true);
      await eventService.rsvp(event.id, status, timeSlotId);
      setRsvpStatus(status);
      if (timeSlotId) {
        setSelectedTimeSlotId(timeSlotId);
      }
      const statusText =
        status === "going"
          ? t("buttons.going")
          : status === "maybe"
            ? t("buttons.maybe")
            : t("buttons.notGoing");
      Alert.alert(t("common.success"), t("event.rsvpUpdated", { status: statusText }));
      // Refresh event data
      await fetchEvent();
    } catch (err: any) {
      Alert.alert(
        t("common.error"),
        err.message || t("event.failedUpdateRsvp")
      );
      console.error("Error updating RSVP:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenLocation = async () => {
    if (!event) return;

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

  // Calculate RSVP counts
  const rsvpCounts = useMemo(() => {
    if (!event?.invitees) return { going: 0, notGoing: 0, pending: 0 };

    return event.invitees.reduce(
      (acc, invitee) => {
        const status = invitee.rsvpStatus as string;
        if (status === "going" || status === "accepted") {
          acc.going++;
        } else if (status === "not_going" || status === "declined") {
          acc.notGoing++;
        } else {
          acc.pending++;
        }
        return acc;
      },
      { going: 0, notGoing: 0, pending: 0 }
    );
  }, [event?.invitees]);

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.bg },
    content: { padding: 16, paddingBottom: insets.bottom + 20 },
    card: {
      backgroundColor: t.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      padding: 16,
      marginBottom: 16,
      position: "relative",
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: t.text,
      flex: 1,
    },
    editButton: {
      padding: 4,
    },
    detailRow: {
      flexDirection: "column",
      marginBottom: 12,
      alignItems: "flex-start",
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: t.subText,
      width: 120,
      marginRight: 8,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "700",
      color: t.text,
      flex: 1,
    },
    chip: {
      flexDirection: "row",
      alignSelf: "flex-start",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    locationLink: {
      color: t.tint,
      textDecorationLine: "underline",
    },
    rsvpBadges: {
      flexDirection: "row",
      gap: 8,
      // marginBottom: 16,
    },
    rsvpBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: t.panel,
    },
    inviteeItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: t.panel,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.panel,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    avatarInitials: {
      fontSize: 14,
      fontWeight: "600",
      color: t.text,
    },
    inviteeInfo: {
      flex: 1,
    },
    inviteeName: {
      fontSize: 14,
      fontWeight: "500",
      color: t.text,
      marginBottom: 2,
    },
    inviteeMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    roleBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: "#FEF3C7",
    },
    roleBadgeText: {
      fontSize: 11,
      color: "#92400E",
      fontWeight: "500",
    },
    lastSeen: {
      fontSize: 12,
      color: t.subText,
    },
    rsvpIcon: {
      marginLeft: "auto",
    },
    seeAllLink: {
      color: t.tint,
      fontSize: 14,
      fontWeight: "500",
      marginTop: 8,
    },
  }));

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.tint} />
          <ThemedText style={{ marginTop: 10, color: theme.subText }}>
            {t("event.loadingEvent")}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !event) {
    return (
      <ThemedView style={styles.container}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <ThemedText style={{ color: theme.text, textAlign: "center" }}>
            {error || t("event.eventNotFound")}
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginTop: 20,
              padding: 12,
              borderRadius: 8,
              backgroundColor: theme.tint,
            }}
          >
            <ThemedText style={{ color: "#fff" }}>{t("event.goBack")}</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const kind = mapEventTypeToKind(event.type);
  const chip = kindChip(kind, t);
  const dateText = formatDate(event.startDate, t);
  const timeText = event.allDay
    ? t("event.allDay")
    : formatTimeRange(
      typeof event.startTime === "string" ? event.startTime : "",
      typeof event.endTime === "string" ? event.endTime : "",
      t("event.allDay")
    );
  const locationText = extractString(event.location);
  const descriptionText = extractString(event.description);

  // Format repeat text
  const repeatText =
    event.repeat === "none"
      ? t("event.repeatNone")
      : event.repeat === "daily"
        ? t("event.repeatDaily")
        : event.repeat === "weekly"
          ? t("event.repeatWeekly")
          : event.repeat === "monthly"
            ? t("event.repeatMonthly")
            : event.repeat === "yearly"
              ? t("event.repeatYearly")
              : t("event.repeatNone");

  // Format slot duration
  const slotDurationText = event.slotDuration
    ? typeof event.slotDuration === "number"
      ? `${event.slotDuration} min`
      : `${(event.slotDuration as any).value || event.slotDuration} min`
    : t("event.nA");

  // Get invitees to display (limit to first few unless "See All" was tapped)
  const inviteeLimit = showAllInvitees ? undefined : 5;
  const displayedInvitees = inviteeLimit
    ? (event.invitees?.slice(0, inviteeLimit) || [])
    : (event.invitees || []);
  const hasMoreInvitees = (event.invitees?.length || 0) > 5;

  return (
    <ThemedView style={styles.container}>
      <HeaderInnerPage
        title={event.title}
        subTitle={t("event.eventDetails")}
        addstyles={{ marginBottom: 0 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Event Details Card */}
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>{t("event.eventDetails")}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>{t("createEvent.eventTitle")}</ThemedText>
            <ThemedText style={styles.detailValue}>{event.title}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>{t("createEvent.eventType")}</ThemedText>
            <ThemedText style={styles.detailValue}>{chip.label}</ThemedText>
          </View>

          {!!descriptionText && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>{t("createEvent.description")}</ThemedText>
              <ThemedText style={styles.detailValue}>
                {descriptionText}
              </ThemedText>
            </View>
          )}

          {!!locationText && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>{t("createEvent.location")}</ThemedText>
              <TouchableOpacity
                onPress={handleOpenLocation}
                style={{ flex: 1 }}
              >
                <ThemedText style={[styles.detailValue, styles.locationLink]}>
                  {locationText}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>{t("createEvent.requestRSVP")}</ThemedText>
            <ThemedText style={styles.detailValue}>
              {event.requestRSVP ? t("event.yes") : t("event.no")}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Date and Time Card */}
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>{t("event.dateAndTime")}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>{t("event.dates")}</ThemedText>
            <ThemedText style={styles.detailValue}>{dateText}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>{t("event.timeDuration")}</ThemedText>
            <ThemedText style={styles.detailValue}>{timeText}</ThemedText>
          </View>

          {event.multipleTimeSlots && (
            <>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>
                  {t("event.multipleTimeSlotsLabel")}
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {t("event.yes")}, {slotDurationText}
                </ThemedText>
              </View>

              {event.slotRestriction && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    {t("event.slotRestrictionsLabel")}
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {t("event.yes")}, {event.maxParticipantsPerSlot || t("event.nA")}
                  </ThemedText>
                </View>
              )}
            </>
          )}

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>{t("createEvent.repeat")}</ThemedText>
            <ThemedText style={styles.detailValue}>{repeatText}</ThemedText>
          </View>
        </ThemedView>

        {/* Invitees Card */}
        {event.requestRSVP && event.invitees && event.invitees.length > 0 && (
          <ThemedView style={styles.card}>
            <View style={[styles.cardHeader, { alignItems: "center" }]}>
              <ThemedText style={styles.cardTitle}>{t("event.invitees")}</ThemedText>

              {/* RSVP Status Badges */}
              <View style={styles.rsvpBadges}>
                <View style={styles.rsvpBadge}>
                  <CheckMarkCircleFillIcon size={14} color="#467A39" />
                  <ThemedText
                    style={{ fontSize: 12, fontWeight: "500" }}
                  >
                    {rsvpCounts.going}
                  </ThemedText>
                </View>
                <View style={styles.rsvpBadge}>
                  <XMarkCircleFillIcon size={14} color="#E7000B" />
                  <ThemedText
                    style={{ fontSize: 12, fontWeight: "500" }}
                  >
                    {rsvpCounts.notGoing}
                  </ThemedText>
                </View>
                <View style={styles.rsvpBadge}>
                  <QuestionMarkCircleFillIcon size={14} color="#EDB95E" />
                  <ThemedText
                    style={{ fontSize: 12, fontWeight: "500" }}
                  >
                    {rsvpCounts.pending}
                  </ThemedText>
                </View>
              </View>
            </View>



            {/* Invitees List */}
            {displayedInvitees.map((invitee) => {
              const firstName = invitee.firstName || "";
              const lastName = invitee.lastName || "";
              const fullName =
                `${firstName} ${lastName}`.trim() ||
                invitee.email?.split("@")[0] ||
                t("event.unknown");
              const initials =
                firstName && lastName
                  ? `${firstName[0]}${lastName[0]}`.toUpperCase()
                  : fullName.substring(0, 2).toUpperCase();

              // Determine RSVP icon
              const rsvpStatus = invitee.rsvpStatus as string;
              let rsvpIcon = null;
              if (rsvpStatus === "going" || rsvpStatus === "accepted") {
                rsvpIcon = (
                  <CheckMarkCircleFillIcon color="#467A39" size={20} />
                );
              } else if (
                rsvpStatus === "not_going" ||
                rsvpStatus === "declined"
              ) {
                rsvpIcon = (
                  <XMarkCircleFillIcon size={20} color="#E7000B" />
                );
              } else {
                rsvpIcon = (
                  <QuestionMarkCircleFillIcon size={20} color="#EDB95E" />
                );
              }

              // Check if user is admin (you might need to add this to the invitee data)
              const isAdmin = false; // TODO: Add admin check from invitee data

              return (
                <View key={invitee.id} style={styles.inviteeItem}>
                  {invitee.profilePicture ? (
                    <Image
                      source={{ uri: invitee.profilePicture }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <ThemedText style={styles.avatarInitials}>
                        {initials}
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.inviteeInfo}>
                    <View style={styles.inviteeMeta}>
                      <ThemedText style={styles.inviteeName}>
                        {fullName}
                      </ThemedText>
                      {isAdmin && (
                        <View style={styles.roleBadge}>
                          <ThemedText style={styles.roleBadgeText}>
                            {t("common.admin")}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText style={styles.lastSeen}>
                      {invitee.email}
                    </ThemedText>
                  </View>
                  <View style={styles.rsvpIcon}>{rsvpIcon}</View>
                </View>
              );
            })}

            {hasMoreInvitees && (
              <View style={{ borderTopWidth: 1, borderColor: theme.border }}>
                <TouchableOpacity
                  style={{ justifyContent: "center", alignItems: "center", paddingTop: 8 }}
                  onPress={() => setShowAllInvitees((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.seeAllLink}>
                    {showAllInvitees ? t("event.showLess") : t("event.seeAllInvitees")}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ThemedView>
        )}

        {/* Time Slots Selection (if multipleTimeSlots) */}
        {event.multipleTimeSlots &&
          event.timeSlots &&
          event.timeSlots.length > 0 && (
            <ThemedView style={styles.card}>
              <ThemedText
                type="defaultSemiBold"
                style={{ marginBottom: 12, color: theme.text }}
              >
                {t("event.chooseTimeSlot")}
              </ThemedText>

              {event.timeSlots.map((slot: TimeSlotDto) => {
                const isSelected = selectedTimeSlotId === slot.id;
                const slotsLeft = slot.maxParticipants
                  ? slot.maxParticipants - slot.currentParticipants
                  : null;
                const isFull = slotsLeft !== null && slotsLeft <= 0;

                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      borderWidth: 1,
                      marginBottom: 12,
                      borderColor: isSelected ? theme.tint : theme.border,
                      backgroundColor: isSelected
                        ? `${theme.tint}10`
                        : theme.bg,
                      opacity: isFull ? 0.5 : 1,
                    }}
                    onPress={() => !isFull && handleRSVP("going", slot.id)}
                    disabled={isFull || submitting}
                  >
                    <ThemedText
                      type="defaultSemiBold"
                      style={{ color: theme.text, marginBottom: 4 }}
                    >
                      {formatTimeRange(slot.startTime, slot.endTime, t("event.allDay"))}
                    </ThemedText>
                    {slotsLeft !== null && (
                      <ThemedText
                        type="subText"
                        style={{ color: theme.subText }}
                      >
                        {t("event.slotsLeft", { count: slotsLeft, max: slot.maxParticipants })}
                      </ThemedText>
                    )}
                    {isFull && (
                      <ThemedText type="subText" style={{ color: "#DC2626" }}>
                        {t("event.full")}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ThemedView>
          )}

        {/* RSVP Section (if requestRSVP and not multipleTimeSlots) */}
        {event.requestRSVP && !event.multipleTimeSlots && (
          <ThemedView style={styles.card}>
            <ThemedText
              type="defaultSemiBold"
              style={{ marginBottom: 12, color: theme.text }}
            >
              {t("buttons.rsvp")}
            </ThemedText>

            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  minWidth: 100,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: rsvpStatus === "going" ? 2 : 1,
                  borderColor:
                    rsvpStatus === "going" ? "#16A34A" : theme.border,
                  backgroundColor:
                    rsvpStatus === "going" ? "#EAFCEF" : theme.bg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => handleRSVP("going")}
                disabled={submitting}
              >
                <CheckMarkCircleFillIcon
                  size={20}
                  color={rsvpStatus === "going" ? "#16A34A" : theme.subText}
                />
                <ThemedText
                  style={{
                    fontSize: 14,
                    marginTop: 4,
                    color: rsvpStatus === "going" ? "#16A34A" : theme.subText,
                    fontWeight: rsvpStatus === "going" ? "600" : "400",
                  }}
                >
                  {t("buttons.going")}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  minWidth: 100,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: rsvpStatus === "maybe" ? 2 : 1,
                  borderColor:
                    rsvpStatus === "maybe" ? "#F59E0B" : theme.border,
                  backgroundColor:
                    rsvpStatus === "maybe" ? "#FEF3C7" : theme.bg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => handleRSVP("maybe")}
                disabled={submitting}
              >
                <QuestionMarkCircleFillIcon
                  size={20}
                  color={rsvpStatus === "maybe" ? "#F59E0B" : theme.subText}
                />
                <ThemedText
                  style={{
                    fontSize: 14,
                    marginTop: 4,
                    color: rsvpStatus === "maybe" ? "#F59E0B" : theme.subText,
                    fontWeight: rsvpStatus === "maybe" ? "600" : "400",
                  }}
                >
                  {t("buttons.maybe")}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  minWidth: 100,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: rsvpStatus === "not_going" ? 2 : 1,
                  borderColor:
                    rsvpStatus === "not_going" ? "#DC2626" : theme.border,
                  backgroundColor:
                    rsvpStatus === "not_going" ? "#FEE2E2" : theme.bg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => handleRSVP("not_going")}
                disabled={submitting}
              >
                <XMarkCircleFillIcon
                  size={20}
                  color={rsvpStatus === "not_going" ? "#DC2626" : theme.subText}
                />
                <ThemedText
                  style={{
                    fontSize: 14,
                    marginTop: 4,
                    color:
                      rsvpStatus === "not_going" ? "#DC2626" : theme.subText,
                    fontWeight: rsvpStatus === "not_going" ? "600" : "400",
                  }}
                >
                  {t("buttons.notGoing")}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
};

export default EventDetailScreen;
