import { messagingService, PollResponseDto, VotePollDto } from "@/services/messaging.service";
import { feedback } from "@/lib/feedback";
import { useEffectiveRole } from "@/hooks/use-effective-role";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { isManagementRole } from "@/utils/roles";
import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SpeakableText } from "@/components/speakable-text";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

const POLL_ACCENT = {
  buttonBg: "#A846C3",
  radioSelected: "#A846C3",
  radioUnselectedBorder: "#A846C3",
  borderRadius: 12,
  borderRadiusTop: 12,
};

interface PollMessageCardProps {
  pollId: string;
  isMe?: boolean;
  translatedQuestion?: string;
  translatedOptions?: Record<string, string>;
  isTranslating?: boolean;
  onVote?: () => void;
  onClosePoll?: () => void;
  onEditPoll?: () => void;
}

export default function PollMessageCard({
  pollId,
  isMe,
  translatedQuestion,
  translatedOptions,
  isTranslating,
  onVote,
  onClosePoll,
  onEditPoll,
}: PollMessageCardProps) {
  const { t } = useTranslation();
  const currentUser = useStore((state: any) => state.user);
  const effectiveRole = useEffectiveRole();
  const theme = useStore((state: any) => state.theme);
  const voiceEnabled = useStore((state) => state.voiceNarrationEnabled);
  const speak = useStore((state) => state.speak);

  const speakIfEnabled = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (voiceEnabled && trimmed) speak(trimmed);
    },
    [voiceEnabled, speak]
  );
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
      const userVotedOption = data.options.find((opt) => opt.userVoted);
      if (userVotedOption) setSelectedOptionId(userVotedOption.id);
    } catch (e) {
      console.error("Poll fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [pollId, currentUser?.id]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  const styles = useThemedStyles((t) => ({
    card: {
      backgroundColor: "rgba(215, 169, 227, 0.1)",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopLeftRadius: POLL_ACCENT.borderRadiusTop,
      borderTopRightRadius: POLL_ACCENT.borderRadiusTop,
      borderBottomLeftRadius: POLL_ACCENT.borderRadius,
      borderBottomRightRadius: POLL_ACCENT.borderRadius,
      borderWidth: 0.5,
      borderStyle: "solid" as const,
      borderColor: "#A846C3",
      maxWidth: "100%" as const,
      elevation: 0,
      minWidth: 256,
    },
    cardLeft: {
      alignSelf: "flex-start" as const,
    },
    cardRight: {
      alignSelf: "flex-end" as const,
    },
    loadingCard: {
      minHeight: 80,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    newPollBadge: {
      backgroundColor: "rgba(215, 169, 227, 0.25)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: "flex-start" as const,
      borderColor: "#D7A9E3",
      borderWidth: 1,
      borderStyle: "solid" as const,
      marginBottom: 12,
    },
    newPollBadgeText: {
      color: t.tint,
      fontSize: 12,
      fontWeight: "400" as const,
    },
    question: {
      fontSize: 14,
      fontWeight: "400" as const,
      color: t.text,
      marginBottom: 14,
    },
    optionRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginBottom: 10,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: POLL_ACCENT.radioUnselectedBorder,
      backgroundColor: "transparent",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginRight: 12,
    },
    radioOuterSelected: {
      borderColor: POLL_ACCENT.radioSelected,
      backgroundColor: "transparent",
    },
    radioOuterUnselected: {
      borderColor: POLL_ACCENT.radioUnselectedBorder,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: POLL_ACCENT.radioSelected,
    },
    optionText: {
      flex: 1,
      fontSize: 15,
      color: t.text,
      fontWeight: "400" as const,
    },
    resultOptionRow: {
      marginBottom: 4,
    },
    resultOptionText: {
      fontSize: 15,
      color: t.text,
      fontWeight: "500" as const,
      position: "absolute" as const,
      zIndex: 1,
      top: 11,
      left: 8,
      right: 8,
    },
    barRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      marginTop: 4,
    },
    barBg: {
      flex: 1,
      height: 32,
      borderRadius: 4,
      overflow: "hidden" as const,
    },
    barFill: {
      height: "100%" as const,
      backgroundColor: POLL_ACCENT.radioSelected,
      borderRadius: 4,
      minWidth: 0,
    },
    pctText: {
      fontSize: 14,
      fontWeight: "600" as const,
      color: t.text,
      minWidth: 36,
      textAlign: "right" as const,
    },
    viewResultsButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderStyle: "solid" as const,
      borderColor: t.tint,
      borderRadius: 4,
      paddingVertical: 8,
      paddingHorizontal: 16,
      flexDirection: "row" as const,
      gap: 4,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: 14,
      width: "100%" as const,
    },
    adminActionsRow: {
      flexDirection: "row" as const,
      gap: 12,
      marginTop: 12,
    },
    adminButton: {
      flex: 1,
      backgroundColor: "transparent",
      borderWidth: 1,
      borderStyle: "solid" as const,
      borderColor: t.tint,
      borderRadius: 4,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    adminButtonDisabled: {
      opacity: 0.6,
    },
    adminButtonText: {
      color: t.tint,
      fontSize: 14,
      fontWeight: "400" as const,
    },
    finalizeButton: {
      backgroundColor: POLL_ACCENT.buttonBg,
      borderRadius: 4,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: 14,
      width: "100%" as const,
    },
    finalizeButtonDisabled: {
      opacity: 0.7,
    },
    finalizeButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "400" as const,
    },
    cardText: {
      color: t.text,
      fontSize: 14,
    },
  }));

  const handleVote = async () => {
    if (!poll || !selectedOptionId || voting || poll.isClosed) return;
    try {
      setVoting(true);
      const voteData: VotePollDto = { pollOptionId: selectedOptionId };
      await messagingService.votePoll(pollId, voteData);
      await fetchPoll();
      onVote?.();
    } catch (err: any) {
      feedback.toast.error("Error", err.message || "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const hasVoted = poll?.options.some((opt) => opt.userVoted) ?? false;
  const canVote = !poll?.isClosed && !hasVoted;

  const isAdmin =
    poll &&
    (isManagementRole(effectiveRole) || isMe);

  const handleClosePoll = useCallback(() => {
    if (!poll || poll.isClosed) return;
    feedback.alert(
      "Close poll",
      "Are you sure you want to close this poll? No more votes will be accepted.",
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("buttons.closePoll"),
          style: "destructive",
          onPress: async () => {
            try {
              setClosingPoll(true);
              await messagingService.closePoll(pollId);
              await fetchPoll();
              onClosePoll?.();
            } catch (e: any) {
              feedback.toast.error("Error", e.message || "Failed to close poll");
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
        <ActivityIndicator size="small" color={theme.tint} />
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={styles.card}>
        <SpeakableText style={styles.cardText}>Poll unavailable</SpeakableText>
      </View>
    );
  }

  const questionDisplay = isTranslating && translatedQuestion === undefined
    ? "…"
    : (translatedQuestion ?? poll.question);
  const getOptionDisplay = (optionId: string, original: string) =>
    isTranslating && translatedOptions === undefined ? "…" : (translatedOptions?.[optionId] ?? original);

  if (isAdmin) {
    const totalVotes = poll.options.reduce((s, o) => s + o.voteCount, 0);

    return (
      <View style={[styles.card, isMe ? styles.cardRight : styles.cardLeft]}>
        {!showAdminResults ? (
          <>
            <View style={styles.newPollBadge}>
              <SpeakableText style={styles.newPollBadgeText}>New Poll</SpeakableText>
            </View>
            <SpeakableText style={styles.question}>{questionDisplay}</SpeakableText>

            {poll.options.map((option) => (
              <View key={option.id} style={styles.optionRow}>
                <View style={[styles.radioOuter, styles.radioOuterUnselected]} />
                <SpeakableText style={styles.optionText} numberOfLines={2}>
                  {getOptionDisplay(option.id, option.text)}
                </SpeakableText>
              </View>
            ))}

            <View>
              <TouchableOpacity
                style={styles.viewResultsButton}
                onPress={() => {
                  speakIfEnabled("View Poll Results");
                  setShowAdminResults(true);
                }}
                activeOpacity={0.9}
              >
                <SpeakableText narrationDisabled style={styles.adminButtonText}>View Poll Results</SpeakableText>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.newPollBadge}>
              <SpeakableText style={styles.newPollBadgeText}>Poll Results</SpeakableText>
            </View>
            <SpeakableText style={styles.question}>{questionDisplay}</SpeakableText>

            {poll.options.map((option) => {
              const pct = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
              return (
                <View key={option.id} style={styles.resultOptionRow}>
                  <View>
                    <SpeakableText style={styles.resultOptionText} numberOfLines={1} ellipsizeMode="tail">
                      {getOptionDisplay(option.id, option.text)}
                    </SpeakableText>
                  </View>
                  <View style={styles.barRow}>
                    <View style={styles.barBg}>
                      <View
                        style={[styles.barFill, { width: `${Math.round(pct)}%` }]}
                      />
                    </View>
                    <SpeakableText style={styles.pctText}>{Math.round(pct)}%</SpeakableText>
                  </View>
                </View>
              );
            })}

            <View>
              <TouchableOpacity
                style={styles.viewResultsButton}
                onPress={() => {
                  speakIfEnabled(t("buttons.back"));
                  setShowAdminResults(false);
                }}
                activeOpacity={0.9}
              >
                <Feather name="chevron-left" size={16} color={theme.tint} />
                <SpeakableText narrationDisabled style={styles.adminButtonText}>{t("buttons.back")}</SpeakableText>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.adminActionsRow}>
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => {
              speakIfEnabled("Edit Poll");
              onEditPoll?.();
            }}
            activeOpacity={0.9}
          >
            <SpeakableText narrationDisabled style={styles.adminButtonText}>Edit Poll</SpeakableText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminButton, (poll.isClosed || closingPoll) && styles.adminButtonDisabled]}
            onPress={() => {
              const label = closingPoll ? "Closing…" : "Close poll";
              speakIfEnabled(label);
              handleClosePoll();
            }}
            disabled={poll.isClosed || closingPoll}
            activeOpacity={0.9}
          >
            <SpeakableText narrationDisabled style={styles.adminButtonText}>
              {closingPoll ? "Closing…" : "Close poll"}
            </SpeakableText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, isMe ? styles.cardRight : styles.cardLeft]}>
      <View style={styles.newPollBadge}>
        <SpeakableText style={styles.newPollBadgeText}>New Poll</SpeakableText>
      </View>
      <SpeakableText style={styles.question}>{questionDisplay}</SpeakableText>

      {poll.options.map((option) => {
        const isSelected = selectedOptionId === option.id;
        const optionDisabled = poll.isClosed || !canVote;

        return (
          <TouchableOpacity
            key={option.id}
            style={styles.optionRow}
            onPress={() => {
              if (optionDisabled) return;
              speakIfEnabled(getOptionDisplay(option.id, option.text));
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
            <SpeakableText narrationDisabled style={styles.optionText} numberOfLines={2}>
              {getOptionDisplay(option.id, option.text)}
            </SpeakableText>
          </TouchableOpacity>
        );
      })}

      {canVote && (
        <View>
          <TouchableOpacity
            style={[styles.finalizeButton, voting && styles.finalizeButtonDisabled]}
            onPress={() => {
              speakIfEnabled("Finalize Vote");
              handleVote();
            }}
            disabled={!selectedOptionId || voting}
            activeOpacity={0.9}
          >
            {voting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <SpeakableText narrationDisabled style={styles.finalizeButtonText}>Finalize Vote</SpeakableText>
            )}
          </TouchableOpacity>
        </View>
      )}

      {hasVoted && (
        <View>
          <TouchableOpacity
            style={[styles.finalizeButton, styles.finalizeButtonDisabled]}
            disabled={true}
            activeOpacity={0.9}
          >
            <SpeakableText style={styles.finalizeButtonText}>You voted</SpeakableText>
          </TouchableOpacity>
        </View>
      )}
      {poll.isClosed && (
        <View>
          <TouchableOpacity
            style={[styles.finalizeButton, styles.finalizeButtonDisabled]}
            disabled={true}
            activeOpacity={0.9}
          >
            <SpeakableText style={styles.finalizeButtonText}>Poll closed</SpeakableText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
