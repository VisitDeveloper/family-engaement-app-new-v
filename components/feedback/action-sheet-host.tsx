import { useFeedbackUiStore } from "@/store/feedback-ui";
import { useStore } from "@/store";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/i18n";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function ActionSheetHost() {
  const theme = useStore((s) => s.theme);
  const visible = useFeedbackUiStore((s) => s.actionVisible);
  const sheetTitle = useFeedbackUiStore((s) => s.actionTitle);
  const sheetMessage = useFeedbackUiStore((s) => s.actionMessage);
  const options = useFeedbackUiStore((s) => s.actionOptions);
  const finishActionSheet = useFeedbackUiStore((s) => s.finishActionSheet);

  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (!visible) {
      ref.current?.dismiss();
      return;
    }
    const id = requestAnimationFrame(() => ref.current?.present());
    return () => cancelAnimationFrame(id);
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: ComponentProps<typeof BottomSheetBackdrop>) => <BottomBackdrop {...props} />,
    []
  );

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1) {
        finishActionSheet(null);
      }
    },
    [finishActionSheet]
  );

  const pick = useCallback(
    (index: number) => {
      finishActionSheet(index);
    },
    [finishActionSheet]
  );

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      enableDynamicSizing
      enablePanDownToClose
      onChange={handleChange}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: theme.bg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      handleIndicatorStyle={{
        width: 44,
        height: 5,
        borderRadius: 100,
        backgroundColor: theme.border,
        opacity: 0.85,
      }}
    >
      <BottomSheetView style={styles.sheet}>
        <View style={[styles.accentLine, { backgroundColor: theme.tint }]} />

        {sheetTitle ? (
          <Text style={[styles.title, { color: theme.text }]}>{sheetTitle}</Text>
        ) : null}
        {sheetMessage ? (
          <Text style={[styles.message, { color: theme.subText }]}>{sheetMessage}</Text>
        ) : null}

        <View
          style={[
            styles.optionGroup,
            styles.optionGroupElev,
            {
              backgroundColor: theme.panel,
              borderColor: theme.border,
            },
          ]}
        >
          {options.map((opt, i) => (
            <TouchableOpacity
              key={`${opt.label}-${i}`}
              style={[
                styles.row,
                i < options.length - 1 && {
                  borderBottomColor: theme.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
              onPress={() => pick(i)}
              activeOpacity={0.65}
            >
              {opt.destructive ? (
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={theme.emergencyColor}
                  style={styles.rowIcon}
                />
              ) : (
                <Ionicons
                  name="ellipse"
                  size={8}
                  color={theme.tint}
                  style={styles.rowDot}
                />
              )}
              <Text
                style={[
                  styles.rowLabel,
                  { color: opt.destructive ? theme.emergencyColor : theme.text },
                ]}
              >
                {opt.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.subText} style={styles.chevron} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.cancelBtn,
            styles.optionGroupElev,
            {
              backgroundColor: `${theme.tint}14`,
              borderColor: `${theme.tint}35`,
            },
          ]}
          onPress={() => finishActionSheet(null)}
          activeOpacity={0.72}
        >
          <Text style={[styles.cancelLabel, { color: theme.tint }]}>{i18n.t("common.cancel")}</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

function BottomBackdrop(props: ComponentProps<typeof BottomSheetBackdrop>) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.58}
    />
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingBottom: Platform.OS === "ios" ? 36 : 26,
    paddingHorizontal: 18,
    paddingTop: 2,
  },
  accentLine: {
    alignSelf: "center",
    width: 56,
    height: 3,
    borderRadius: 2,
    marginBottom: 14,
    opacity: 0.85,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.45,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 18,
    letterSpacing: -0.1,
    paddingHorizontal: 10,
    opacity: 0.92,
  },
  optionGroup: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 12,
  },
  optionGroupElev:
    Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
        }
      : { elevation: 3 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 14,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowDot: {
    marginRight: 14,
    marginLeft: 4,
    opacity: 0.9,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.28,
  },
  chevron: {
    opacity: 0.45,
  },
  cancelBtn: {
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
});
