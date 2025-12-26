import RoleGuard from "@/components/check-permisions";
import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

// Helper function to format time string (HH:mm:ss or HH:mm) to readable format
const formatTimeString = (timeString: string): string => {
  if (!timeString) return "All Day";

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
const formatTimeRange = (startTime: string, endTime: string): string => {
  const start = formatTimeString(startTime);
  const end = formatTimeString(endTime);
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

// Helper function to format last seen time
const formatLastSeen = (dateString?: string | null): string => {
  if (!dateString) return "Never";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${String(minutes).padStart(2, "0")} ${ampm}`;
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch {
    return "Unknown";
  }
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

const kindChip = (k: EventKind) => {
  switch (k) {
    case "Conference":
      return {
        label: "Conference",
        bg: "#E6F0FF",
        text: "#1D4ED8",
        icon: <Feather name="users" size={15} color="#1D4ED8" />,
      };
    case "Fieldtrip":
      return {
        label: "Fieldtrip",
        bg: "#F3E8FF",
        text: "#7C3AED",
        icon: <FontAwesome6 name="bus" size={15} color="#7C3AED" />,
      };
    case "Event":
      return {
        label: "Event",
        bg: "#EAFCEF",
        text: "#16A34A",
        icon: <MaterialIcons name="event-note" size={15} color="#16A34A" />,
      };
    case "Holiday":
      return {
        label: "Holiday",
        bg: "#FEE2E2",
        text: "#DC2626",
        icon: <AntDesign name="gift" size={15} color="#DC2626" />,
      };
    default:
      return {
        label: "Event",
        bg: "#EAFCEF",
        text: "#16A34A",
        icon: <MaterialIcons name="event-note" size={15} color="#16A34A" />,
      };
  }
};

const EventDetailScreen = () => {
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
        err.message || "Failed to load event. Please try again.";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
      console.error("Error fetching event:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

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
          ? "Going"
          : status === "maybe"
          ? "Maybe"
          : "Not Going";
      Alert.alert("Success", `RSVP updated to ${statusText}`);
      // Refresh event data
      await fetchEvent();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "Failed to update RSVP. Please try again."
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
        extractString(event.location) || "Location"
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
          Alert.alert("Error", "Unable to open maps application.");
        }
      } catch (error) {
        console.error("Error opening maps:", error);
        Alert.alert("Error", "Failed to open maps. Please try again.");
      }
    } else {
      Alert.alert(
        "No Location",
        "Location information is not available for this event."
      );
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
      marginBottom: 16,
    },
    rsvpBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
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
            Loading event...
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
            {error || "Event not found"}
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
            <ThemedText style={{ color: "#fff" }}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  const kind = mapEventTypeToKind(event.type);
  const chip = kindChip(kind);
  const dateText = formatDate(event.startDate);
  const timeText = event.allDay
    ? "All Day"
    : formatTimeRange(
        typeof event.startTime === "string" ? event.startTime : "",
        typeof event.endTime === "string" ? event.endTime : ""
      );
  const locationText = extractString(event.location);
  const descriptionText = extractString(event.description);

  // Format repeat text
  const repeatText =
    event.repeat === "none"
      ? "No"
      : event.repeat === "daily"
      ? "Yes, Daily"
      : event.repeat === "weekly"
      ? "Yes, Weekly"
      : event.repeat === "monthly"
      ? "Yes, Monthly"
      : event.repeat === "yearly"
      ? "Yes, Yearly"
      : "No";

  // Format slot duration
  const slotDurationText = event.slotDuration
    ? typeof event.slotDuration === "number"
      ? `${event.slotDuration} min`
      : `${(event.slotDuration as any).value || event.slotDuration} min`
    : "N/A";

  // Get invitees to display (limit to first few, show "See All" if more)
  const displayedInvitees = event.invitees?.slice(0, 5) || [];
  const hasMoreInvitees = (event.invitees?.length || 0) > 5;

  return (
    <ThemedView style={styles.container}>
      <HeaderInnerPage
        title={event.title}
        subTitle="Event Details"
        addstyles={{ marginBottom: 0 }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Event Details Card */}
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Event Details</ThemedText>
            <RoleGuard roles={["admin", "teacher"]}>
              <TouchableOpacity style={styles.editButton}>
                <Feather name="edit-2" size={18} color={theme.tint} />
              </TouchableOpacity>
            </RoleGuard>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Event Title</ThemedText>
            <ThemedText style={styles.detailValue}>{event.title}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Event Type</ThemedText>
            <ThemedText style={styles.detailValue}>{chip.label}</ThemedText>
          </View>

          {!!descriptionText && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Description</ThemedText>
              <ThemedText style={styles.detailValue}>
                {descriptionText}
              </ThemedText>
            </View>
          )}

          {!!locationText && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Location</ThemedText>
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
            <ThemedText style={styles.detailLabel}>Request RSVP</ThemedText>
            <ThemedText style={styles.detailValue}>
              {event.requestRSVP ? "Yes" : "No"}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Date and Time Card */}
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Date and Time</ThemedText>
            <TouchableOpacity style={styles.editButton}>
              <Feather name="edit-2" size={18} color={theme.tint} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Dates</ThemedText>
            <ThemedText style={styles.detailValue}>{dateText}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Time Duration</ThemedText>
            <ThemedText style={styles.detailValue}>{timeText}</ThemedText>
          </View>

          {event.multipleTimeSlots && (
            <>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>
                  Multiple Time Slots:
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  Yes, {slotDurationText}
                </ThemedText>
              </View>

              {event.slotRestriction && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    Slot Restrictions:
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    Yes, {event.maxParticipantsPerSlot || "N/A"}
                  </ThemedText>
                </View>
              )}
            </>
          )}

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Repeat</ThemedText>
            <ThemedText style={styles.detailValue}>{repeatText}</ThemedText>
          </View>
        </ThemedView>

        {/* Invitees Card */}
        {event.requestRSVP && event.invitees && event.invitees.length > 0 && (
          <ThemedView style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>Invitees</ThemedText>
              <TouchableOpacity style={styles.editButton}>
                <Feather name="edit-2" size={18} color={theme.tint} />
              </TouchableOpacity>
            </View>

            {/* RSVP Status Badges */}
            <View style={styles.rsvpBadges}>
              <View style={[styles.rsvpBadge, { backgroundColor: "#EAFCEF" }]}>
                <Feather name="check" size={14} color="#16A34A" />
                <ThemedText
                  style={{ color: "#16A34A", fontSize: 12, fontWeight: "500" }}
                >
                  {rsvpCounts.going}
                </ThemedText>
              </View>
              <View style={[styles.rsvpBadge, { backgroundColor: "#FEE2E2" }]}>
                <Feather name="x" size={14} color="#DC2626" />
                <ThemedText
                  style={{ color: "#DC2626", fontSize: 12, fontWeight: "500" }}
                >
                  {rsvpCounts.notGoing}
                </ThemedText>
              </View>
              <View style={[styles.rsvpBadge, { backgroundColor: "#FEF3C7" }]}>
                <Feather name="help-circle" size={14} color="#F59E0B" />
                <ThemedText
                  style={{ color: "#F59E0B", fontSize: 12, fontWeight: "500" }}
                >
                  {rsvpCounts.pending}
                </ThemedText>
              </View>
            </View>

            {/* Invitees List */}
            {displayedInvitees.map((invitee) => {
              const firstName = invitee.firstName || "";
              const lastName = invitee.lastName || "";
              const fullName =
                `${firstName} ${lastName}`.trim() ||
                invitee.email?.split("@")[0] ||
                "Unknown";
              const initials =
                firstName && lastName
                  ? `${firstName[0]}${lastName[0]}`.toUpperCase()
                  : fullName.substring(0, 2).toUpperCase();

              // Determine RSVP icon
              const rsvpStatus = invitee.rsvpStatus as string;
              let rsvpIcon = null;
              if (rsvpStatus === "going" || rsvpStatus === "accepted") {
                rsvpIcon = (
                  <Feather name="check-circle" size={20} color="#16A34A" />
                );
              } else if (
                rsvpStatus === "not_going" ||
                rsvpStatus === "declined"
              ) {
                rsvpIcon = (
                  <Feather name="x-circle" size={20} color="#DC2626" />
                );
              } else {
                rsvpIcon = (
                  <Feather name="help-circle" size={20} color="#F59E0B" />
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
                            Admin
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
              <TouchableOpacity>
                <ThemedText style={styles.seeAllLink}>
                  See All Invitees
                </ThemedText>
              </TouchableOpacity>
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
                Choose Time Slot
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
                      {formatTimeRange(slot.startTime, slot.endTime)}
                    </ThemedText>
                    {slotsLeft !== null && (
                      <ThemedText
                        type="subText"
                        style={{ color: theme.subText }}
                      >
                        {slotsLeft} of {slot.maxParticipants} slots left
                      </ThemedText>
                    )}
                    {isFull && (
                      <ThemedText type="subText" style={{ color: "#DC2626" }}>
                        Full
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
              RSVP
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
                <Feather
                  name="check-circle"
                  size={20}
                  color={rsvpStatus === "going" ? "#16A34A" : theme.subText}
                />
                <ThemedText
                  style={{
                    marginTop: 4,
                    color: rsvpStatus === "going" ? "#16A34A" : theme.subText,
                    fontWeight: rsvpStatus === "going" ? "600" : "400",
                  }}
                >
                  Going
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
                <Feather
                  name="help-circle"
                  size={20}
                  color={rsvpStatus === "maybe" ? "#F59E0B" : theme.subText}
                />
                <ThemedText
                  style={{
                    marginTop: 4,
                    color: rsvpStatus === "maybe" ? "#F59E0B" : theme.subText,
                    fontWeight: rsvpStatus === "maybe" ? "600" : "400",
                  }}
                >
                  Maybe
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
                <Feather
                  name="x-circle"
                  size={20}
                  color={rsvpStatus === "not_going" ? "#DC2626" : theme.subText}
                />
                <ThemedText
                  style={{
                    marginTop: 4,
                    color:
                      rsvpStatus === "not_going" ? "#DC2626" : theme.subText,
                    fontWeight: rsvpStatus === "not_going" ? "600" : "400",
                  }}
                >
                  Not Going
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
