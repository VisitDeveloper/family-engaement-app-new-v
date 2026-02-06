import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import React from "react";
import { StyleProp, TouchableOpacity, View, ViewStyle } from "react-native";
import RoleGuard from "../check-permisions";
import { ThemedText } from "../themed-text";

interface HeaderTabItemProps {
  buttonLink?: string;
  buttonTitle?: string;
  buttonIcon?: React.ReactNode | React.ReactElement;
  buttonRoles?: string[];

  buttonSecondTtitle?: string;
  buttonSecondLink?: string;
  buttonSecondIcon?: React.ReactNode | React.ReactElement;
  buttonSecondRoles?: string[];

  title: string;
  subTitle: string;
  addstyles?: StyleProp<ViewStyle>;
}

export default function HeaderTabItem(props: HeaderTabItemProps) {
  const router = useRouter();
  const theme = useStore((state) => state.theme);

  const styles = useThemedStyles(
    (theme) =>
    ({
      header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        // padding: 10,
      },
      headerWrap: {
        flexDirection: "column",
        alignItems: "flex-start",
      },
      headerTitle: { fontWeight: "bold", color: theme.text },
      headerSubTitle: { color: theme.text },
      eventButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.tint,
        color: theme.bg,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderColor: theme.tint,
        borderWidth: 1,
      },
      eventText: { color: theme.bg, marginLeft: 5 },
    } as const)
  );

  return (
    <View style={[styles.header, props.addstyles]}>
      <View style={styles.headerWrap}>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          {props.title}
        </ThemedText>
        <ThemedText type="subText" style={styles.headerSubTitle}>
          {props.subTitle}
        </ThemedText>
      </View>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {props?.buttonTitle ? (
          <RoleGuard
            roles={props.buttonRoles || ["admin", "teacher", "parent"]}
          >
            <TouchableOpacity
              style={styles.eventButton}
              onPress={() => router.push(props.buttonLink as any)}
              accessibilityRole="button"
              accessibilityLabel={props.buttonTitle}
              accessibilityHint={`Double tap to ${props.buttonTitle?.toLowerCase()}`}
            >
              {/* <Feather name="calendar" size={16} color={theme.tint} /> */}
              {props.buttonIcon ? props.buttonIcon : null}
              <ThemedText type="subText" style={styles.eventText}>
                {props.buttonTitle!}
              </ThemedText>
            </TouchableOpacity>
          </RoleGuard>
        ) : null}
        {props?.buttonSecondTtitle || props.buttonSecondIcon ? (
          <RoleGuard roles={props.buttonSecondRoles || ["admin", "teacher"]}>
            <TouchableOpacity
              style={styles.eventButton}
              onPress={() => router.push(props.buttonSecondLink as any)}
              accessibilityRole="button"
              accessibilityLabel={props.buttonSecondTtitle || "Action button"}
              accessibilityHint={props.buttonSecondTtitle ? `Double tap to ${props.buttonSecondTtitle.toLowerCase()}` : "Double tap to perform action"}
            >
              {/* <Feather name="calendar" size={16} color={theme.tint} /> */}
              {props.buttonSecondIcon ? props.buttonSecondIcon : null}
              {props?.buttonSecondTtitle ? (
                <ThemedText type="subText" style={styles.eventText}>
                  {props.buttonSecondTtitle!}
                </ThemedText>
              ) : null}
            </TouchableOpacity>
          </RoleGuard>
        ) : null}
      </View>
    </View>
  );
}
