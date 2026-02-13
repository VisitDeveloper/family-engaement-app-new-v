import { useThemedStyles } from "@/hooks/use-theme-style";
import { messagingService, PollResponseDto, VotePollDto } from "@/services/messaging.service";
import { useStore } from "@/store";
import { Feather } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../../themed-text";

interface PollViewBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  pollId: string;
  onVote?: () => void;
}

export default function PollViewBottomSheet({
  visible,
  onClose,
  pollId,
  onVote,
}: PollViewBottomSheetProps) {
  const theme = useStore((state) => state.theme);
  const currentUser = useStore((state: any) => state.user);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [poll, setPoll] = useState<PollResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const snapPoints = useMemo(() => ["70%"], []);

  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.bg, padding: 20 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    title: { fontSize: 20, fontWeight: "bold", color: t.text },
    question: {
      fontSize: 18,
      fontWeight: "600",
      color: t.text,
      marginBottom: 20,
    },
    optionContainer: {
      padding: 15,
      borderRadius: 10,
      borderWidth: 2,
      marginBottom: 12,
      backgroundColor: t.panel,
    },
    optionSelected: {
      borderColor: t.tint,
      backgroundColor: `${t.tint}15`,
    },
    optionUnselected: {
      borderColor: t.border,
    },
    optionContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      color: t.text,
      marginRight: 10,
    },
    optionVotes: {
      fontSize: 12,
      color: t.subText,
      marginTop: 8,
    },
    voteButton: {
      backgroundColor: t.tint,
      borderRadius: 10,
      padding: 15,
      alignItems: "center",
      marginTop: 20,
    },
    voteButtonDisabled: {
      opacity: 0.5,
    },
    voteButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    pollInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 15,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    pollInfoText: {
      fontSize: 12,
      color: t.subText,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxSelected: {
      borderColor: t.tint,
      backgroundColor: t.tint,
    },
    checkboxUnselected: {
      borderColor: t.border,
    },
  }));

  useEffect(() => {
    if (visible && pollId) {
      setTimeout(() => {
        bottomSheetRef.current?.present();
      }, 100);
      fetchPoll();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, pollId]);

  const fetchPoll = async () => {
    if (!pollId) return;

    try {
      setLoading(true);
      const pollData = await messagingService.getPoll(pollId);
      setPoll(pollData);

      // Find which options the current user has voted for
      const userVotedOptions: string[] = [];
      pollData.options.forEach((option) => {
        if (option.userVoted) {
          userVotedOptions.push(option.id);
        }
      });
      setSelectedOptions(userVotedOptions);
    } catch (error: any) {
      console.error("Error fetching poll:", error);
      Alert.alert("Error", error.message || "Failed to load poll");
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const toggleOption = (optionId: string) => {
    if (!poll || poll.isClosed) return;

    if (poll.isMultipleChoice) {
      setSelectedOptions((prev) => {
        if (prev.includes(optionId)) {
          return prev.filter((id) => id !== optionId);
        } else {
          return [...prev, optionId];
        }
      });
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (!poll || selectedOptions.length === 0 || voting) return;

    try {
      setVoting(true);
      // API only accepts a single pollOptionId, so we use the first selected option
      const voteData: VotePollDto = {
        pollOptionId: selectedOptions[0],
      };

      await messagingService.votePoll(pollId, voteData);

      // Refresh poll data
      await fetchPoll();

      if (onVote) {
        onVote();
      }

      Alert.alert("Success", "Your vote has been recorded");
    } catch (error: any) {
      console.error("Error voting:", error);
      Alert.alert("Error", error.message || "Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <View
        {...props}
        style={[
          props.style,
          {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        ]}
      />
    ),
    []
  );

  if (!visible) {
    return null;
  }

  const totalVotes = poll?.options.reduce((sum, opt) => sum + opt.voteCount, 0) || 0;
  const hasVoted = selectedOptions.length > 0;
  const canVote = !poll?.isClosed && !voting;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: theme.bg,
      }}
      handleIndicatorStyle={{ backgroundColor: theme.subText }}
    >
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            Poll
          </ThemedText>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={theme.tint} />
          </View>
        ) : poll ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.question}>{poll.question}</Text>

            {poll.options.map((option) => {
              const isSelected = selectedOptions.includes(option.id);
              const percentage =
                totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
              const hasUserVoted = option.userVoted;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionContainer,
                    isSelected
                      ? styles.optionSelected
                      : styles.optionUnselected,
                    poll.isClosed && { opacity: 0.7 },
                  ]}
                  onPress={() => canVote && toggleOption(option.id)}
                  disabled={poll.isClosed || !canVote}
                >
                  <View style={styles.optionContent}>
                    <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                      {poll.isMultipleChoice ? (
                        <View
                          style={[
                            styles.checkbox,
                            isSelected
                              ? styles.checkboxSelected
                              : styles.checkboxUnselected,
                          ]}
                        >
                          {isSelected && (
                            <Feather name="check" size={16} color="#fff" />
                          )}
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderRadius: 12,
                              borderColor: isSelected ? theme.tint : theme.border,
                              backgroundColor: isSelected ? theme.tint : "transparent",
                            },
                          ]}
                        >
                          {isSelected && (
                            <View
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "#fff",
                              }}
                            />
                          )}
                        </View>
                      )}
                      <Text style={[styles.optionText, { marginLeft: 12 }]}>
                        {option.text}
                      </Text>
                    </View>
                  </View>
                  {totalVotes > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <View
                        style={{
                          height: 6,
                          backgroundColor: theme.border,
                          borderRadius: 3,
                          overflow: "hidden",
                          marginTop: 4,
                        }}
                      >
                        <View
                          style={{
                            height: "100%",
                            width: `${percentage}%`,
                            backgroundColor: theme.tint,
                          }}
                        />
                      </View>
                      <Text style={styles.optionVotes}>
                        {option.voteCount} vote{option.voteCount !== 1 ? "s" : ""} ({percentage.toFixed(0)}%)
                        {hasUserVoted && " • You voted"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {!poll.isClosed && canVote && (
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  (!hasVoted || voting) && styles.voteButtonDisabled,
                ]}
                onPress={handleVote}
                disabled={!hasVoted || voting}
              >
                {voting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.voteButtonText}>
                    {hasVoted ? "Submit Vote" : "Select an option"}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.pollInfo}>
              <Text style={styles.pollInfoText}>
                {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
              </Text>
              {poll.isClosed && (
                <Text style={[styles.pollInfoText, { color: (theme as { error?: string }).error ?? "#ff4444" }]}>
                  Poll Closed
                </Text>
              )}
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: theme.subText }}>Poll not found</Text>
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
