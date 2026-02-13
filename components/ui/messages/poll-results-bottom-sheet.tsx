import { messagingService, PollResponseDto } from "@/services/messaging.service";
import { Feather } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const POLL_THEME = {
  purple: "#A846C3",
  purpleDark: "rgba(120, 50, 140, 1)",
  text: "#FFFFFF",
  barBg: "rgba(255, 255, 255, 0.3)",
};

interface PollResultsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  pollId: string;
  onPollClosed?: () => void;
  onEditPoll?: (poll: PollResponseDto) => void;
}

export default function PollResultsBottomSheet({
  visible,
  onClose,
  pollId,
  onPollClosed,
  onEditPoll,
}: PollResultsBottomSheetProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [poll, setPoll] = useState<PollResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);

  const snapPoints = useMemo(() => ["70%"], []);

  useEffect(() => {
    if (visible && pollId) {
      setTimeout(() => bottomSheetRef.current?.present(), 100);
      fetchPoll();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, pollId]);

  const fetchPoll = async () => {
    if (!pollId) return;
    try {
      setLoading(true);
      const data = await messagingService.getPoll(pollId);
      setPoll(data);
    } catch (e) {
      console.error("Poll fetch error:", e);
      Alert.alert("Error", "Failed to load poll results");
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

  const handleClosePoll = async () => {
    if (!pollId || poll?.isClosed) return;
    Alert.alert(
      "Close poll",
      "Are you sure you want to close this poll? No more votes will be accepted.",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("buttons.closePoll"),
          style: "destructive",
          onPress: async () => {
            try {
              setClosing(true);
              await messagingService.closePoll(pollId);
              await fetchPoll();
              onPollClosed?.();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to close poll");
            } finally {
              setClosing(false);
            }
          },
        },
      ]
    );
  };

  const handleGoBack = () => {
    onClose();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <View
        {...props}
        style={[props.style, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
      />
    ),
    []
  );

  if (!visible) return null;

  const totalVotes = poll?.options.reduce((s, o) => s + o.voteCount, 0) ?? 0;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: POLL_THEME.purple }}
      handleIndicatorStyle={{ backgroundColor: POLL_THEME.text }}
    >
      <BottomSheetView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.headerTitle}>Poll Results</Text>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={POLL_THEME.text} />
            </View>
          ) : poll ? (
            <>
              <Text style={styles.question}>{poll.question}</Text>

              {poll.options.map((option) => {
                const pct = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
                return (
                  <View key={option.id} style={styles.optionRow}>
                    <Text style={styles.optionText} numberOfLines={2}>
                      {option.text}
                    </Text>
                    <View style={styles.barRow}>
                      <View style={styles.barBg}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.round(pct)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.pctText}>{Math.round(pct)}%</Text>
                    </View>
                  </View>
                );
              })}

              <TouchableOpacity
                style={styles.goBackRow}
                onPress={handleGoBack}
                activeOpacity={0.8}
              >
                <Feather name="chevron-left" size={20} color={POLL_THEME.text} />
                <Text style={styles.goBackText}>Go Back</Text>
              </TouchableOpacity>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => poll && onEditPoll?.(poll)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.actionButtonText}>Edit Poll</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, poll?.isClosed && styles.actionButtonDisabled]}
                  onPress={handleClosePoll}
                  disabled={poll?.isClosed || closing}
                  activeOpacity={0.9}
                >
                  {closing ? (
                    <ActivityIndicator size="small" color={POLL_THEME.text} />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {poll?.isClosed ? "Poll closed" : "Close poll"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.errorText}>Poll not found</Text>
          )}
        </ScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: POLL_THEME.text,
    marginBottom: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: "700",
    color: POLL_THEME.text,
    marginBottom: 20,
  },
  optionRow: {
    marginBottom: 16,
  },
  optionText: {
    fontSize: 15,
    color: POLL_THEME.text,
    marginBottom: 6,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  barBg: {
    flex: 1,
    height: 10,
    backgroundColor: POLL_THEME.barBg,
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: POLL_THEME.purple,
    borderRadius: 5,
    minWidth: 0,
  },
  pctText: {
    fontSize: 15,
    fontWeight: "600",
    color: POLL_THEME.text,
    minWidth: 40,
    textAlign: "right",
  },
  goBackRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 20,
    gap: 4,
  },
  goBackText: {
    fontSize: 16,
    color: POLL_THEME.text,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: POLL_THEME.purpleDark,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: POLL_THEME.text,
    fontSize: 16,
    fontWeight: "600",
  },
  loadingBox: {
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: POLL_THEME.text,
    fontSize: 14,
  },
});
