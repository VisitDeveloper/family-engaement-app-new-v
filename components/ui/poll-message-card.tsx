import { messagingService, PollResponseDto, VotePollDto } from "@/services/messaging.service";
import { useStore } from "@/store";
import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const POLL_CARD = {
  background: "rgba(215, 169, 227, 0.1)",
  buttonBg: "#A846C3",
  text: "#121212",
  radioSelected: "#A846C3",
  radioUnselectedBorder: "#A846C3",
  borderRadius: 12,
  borderRadiusTop: 12,
};

interface PollMessageCardProps {
  pollId: string;
  isMe?: boolean;
  onVote?: () => void;
  onClosePoll?: () => void;
  onEditPoll?: () => void;
}

export default function PollMessageCard({
  pollId,
  isMe,
  onVote,
  onClosePoll,
  onEditPoll,
}: PollMessageCardProps) {
  const currentUser = useStore((state: any) => state.user);
  const [poll, setPoll] = useState<PollResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [closingPoll, setClosingPoll] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showAdminResults, setShowAdminResults] = useState(false);

  const fetchPoll = useCallback(async () => {
    if (!pollId) return;
    try {
      setLoading(true);
      const data = await messagingService.getPoll(pollId);
      setPoll(data);
      const userVoted = data.options.find((opt) =>
        opt.voters?.some((v) => v.id === currentUser?.id)
      );
      if (userVoted) setSelectedOptionId(userVoted.id);
    } catch (e) {
      console.error("Poll fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [pollId, currentUser?.id]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  const handleVote = async () => {
    if (!poll || !selectedOptionId || voting || poll.isClosed) return;
    try {
      setVoting(true);
      const voteData: VotePollDto = { pollOptionId: selectedOptionId };
      await messagingService.votePoll(pollId, voteData);
      await fetchPoll();
      onVote?.();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const hasVoted = poll?.options.some((opt) =>
    opt.voters?.some((v) => v.id === currentUser?.id)
  );
  const canVote = !poll?.isClosed && !hasVoted;

  // Admin view: app admin (role === "admin") OR the person who created this poll
  const isAdmin =
    poll &&
    (currentUser?.role === "admin" || isMe);

  const handleClosePoll = useCallback(() => {
    if (!poll || poll.isClosed) return;
    Alert.alert(
      "Close poll",
      "Are you sure you want to close this poll? No more votes will be accepted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close poll",
          style: "destructive",
          onPress: async () => {
            try {
              setClosingPoll(true);
              await messagingService.closePoll(pollId);
              await fetchPoll();
              onClosePoll?.();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to close poll");
            } finally {
              setClosingPoll(false);
            }
          },
        },
      ]
    );
  }, [poll, pollId, fetchPoll, onClosePoll]);

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator size="small" color={POLL_CARD.text} />
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardText}>Poll unavailable</Text>
      </View>
    );
  }

  // Admin view: options or results inline; "View Poll Results" / "Back"; Edit Poll, Close poll
  if (isAdmin) {
    const totalVotes = poll.options.reduce((s, o) => s + o.voteCount, 0);

    return (
      <View style={[styles.card, isMe ? styles.cardRight : styles.cardLeft]}>
        {!showAdminResults ? (
          <>
            <View style={styles.newPollBadge}>
              <Text style={styles.newPollBadgeText}>New Poll</Text>
            </View>
            <Text style={styles.question}>{poll.question}</Text>

            {poll.options.map((option) => (
              <View key={option.id} style={styles.optionRow}>
                <View style={[styles.radioOuter, styles.radioOuterUnselected]} />
                <Text style={styles.optionText} numberOfLines={2}>
                  {option.text}
                </Text>
              </View>
            ))}

            <View>
              <TouchableOpacity
                style={styles.viewResultsButton}
                onPress={() => setShowAdminResults(true)}
                activeOpacity={0.9}
              >
                <Text style={styles.adminButtonText}>View Poll Results</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.newPollBadge}>
              <Text style={styles.newPollBadgeText}>Poll Results</Text>
            </View>
            <Text style={styles.question}>{poll.question}</Text>

            {poll.options.map((option) => {
              const pct = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
              return (
                <View key={option.id} style={styles.resultOptionRow}>
                  <View>
                    <Text 
                      style={{
                        fontSize: 15,
                        color: POLL_CARD.text,
                        fontWeight: "500",
                        position: "absolute",
                        zIndex: 1,
                        top: 11,
                        left: 8,
                        right: 8,
                      }} 
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {option.text}
                    </Text>
                  </View>
                  <View style={styles.barRow}>
                    <View style={styles.barBg}>
                      <View
                        style={[styles.barFill, { width: `${Math.round(pct)}%` }]}
                      />
                    </View>
                    <Text style={styles.pctText}>{Math.round(pct)}%</Text>
                  </View>
                </View>
              );
            })}

            <View>
              <TouchableOpacity
                style={styles.viewResultsButton}
                onPress={() => setShowAdminResults(false)}
                activeOpacity={0.9}
              >
                <Feather name="chevron-left" size={16} color="#87189D" />
                <Text style={styles.adminButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.adminActionsRow}>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={onEditPoll}
            activeOpacity={0.9}
          >
            <Text style={styles.adminButtonText}>Edit Poll</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminButton, (poll.isClosed || closingPoll) && styles.adminButtonDisabled]}
            onPress={handleClosePoll}
            disabled={poll.isClosed || closingPoll}
            activeOpacity={0.9}
          >
            <Text style={styles.adminButtonText}>
              {closingPoll ? "Closing…" : "Close poll"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Parent/viewer: voting UI
  return (
    <View style={[styles.card, isMe ? styles.cardRight : styles.cardLeft]}>
      <View style={styles.newPollBadge}>
        <Text style={styles.newPollBadgeText}>New Poll</Text>
      </View>
      <Text style={styles.question}>{poll.question}</Text>

      {poll.options.map((option) => {
        const isSelected = selectedOptionId === option.id;
        const optionDisabled = poll.isClosed || !canVote;

        return (
          <TouchableOpacity
            key={option.id}
            style={styles.optionRow}
            onPress={() => {
              if (optionDisabled) return;
              setSelectedOptionId(option.id);
            }}
            disabled={optionDisabled}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.radioOuter,
                isSelected && styles.radioOuterSelected,
              ]}
            >
              {isSelected && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.optionText} numberOfLines={2}>
              {option.text}
            </Text>
          </TouchableOpacity>
        );
      })}

      {canVote && (
        <View>
          <TouchableOpacity
            style={[styles.finalizeButton, voting && styles.finalizeButtonDisabled]}
            onPress={handleVote}
            disabled={!selectedOptionId || voting}
            activeOpacity={0.9}
          >
            {voting ? (
              <ActivityIndicator size="small" color={POLL_CARD.text} />
            ) : (
              <Text style={styles.finalizeButtonText}>Finalize Vote</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {hasVoted && (
        <Text style={styles.votedLabel}>You voted</Text>
      )}
      {poll.isClosed && (
        <Text style={styles.closedLabel}>Poll closed</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: POLL_CARD.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopLeftRadius: POLL_CARD.borderRadiusTop,
    borderTopRightRadius: POLL_CARD.borderRadiusTop,
    borderBottomLeftRadius: POLL_CARD.borderRadius,
    borderBottomRightRadius: POLL_CARD.borderRadius,
    borderWidth: 0.5,
    borderStyle: "solid",
    borderColor: "#A846C3",
    maxWidth: "100%",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.15,
    // shadowRadius: 6,
    elevation: 3,
    minWidth: 256
  },
  cardLeft: {
    alignSelf: "flex-start",
  },
  cardRight: {
    alignSelf: "flex-end",
  },
  loadingCard: {
    minHeight: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  newPollBadge: {
    backgroundColor: "rgba(215, 169, 227, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    borderColor: "#D7A9E3",
    borderWidth: 1,
    borderStyle: "solid",
    marginBottom: 12
  },
  newPollBadgeText: {
    color: "#87189D",
    fontSize: 12,
    fontWeight: "400",
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
    color: POLL_CARD.text,
    marginBottom: 6,
  },
  question: {
    fontSize: 14,
    fontWeight: "400",
    color: POLL_CARD.text,
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: POLL_CARD.radioUnselectedBorder,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: POLL_CARD.radioSelected,
    backgroundColor: "transparent",
  },
  radioOuterUnselected: {
    borderColor: POLL_CARD.radioUnselectedBorder,
  },
  resultOptionRow: {
    marginBottom: 4,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  barBg: {
    flex: 1,
    height: 32,
    // backgroundColor: "rgba(168, 70, 195, 0.25)",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: POLL_CARD.radioSelected,
    borderRadius: 4,
    minWidth: 0,
  },
  pctText: {
    fontSize: 14,
    fontWeight: "600",
    color: POLL_CARD.text,
    minWidth: 36,
    textAlign: "right",
  },
  viewResultsButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#87189D",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    display: "flex",
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    width: "100%",
  },
  adminActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  adminButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#87189D",
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  adminButtonDisabled: {
    opacity: 0.6,
  },
  adminButtonText: {
    color: "#87189D",
    fontSize: 14,
    fontWeight: "400",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: POLL_CARD.radioSelected,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: POLL_CARD.text,
    fontWeight: "400",
  },
  finalizeButton: {
    backgroundColor: POLL_CARD.buttonBg,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    width: "100%",
  },
  finalizeButtonDisabled: {
    opacity: 0.7,
  },
  finalizeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "400",
  },
  cardText: {
    color: POLL_CARD.text,
    fontSize: 14,
  },
  votedLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 10,
  },
  closedLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 10,
  },
});
