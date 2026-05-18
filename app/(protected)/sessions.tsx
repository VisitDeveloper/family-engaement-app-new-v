import HeaderInnerPage from "@/components/reptitive-component/header-inner-page";
import { feedback } from "@/lib/feedback";
import { ThemedText } from "@/components/themed-text";
import { authService } from "@/services/auth.service";
import type { AuthSessionItem } from "@/types";
import { useStore } from "@/store";
import { AntDesign } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

function formatWhen(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(locale || undefined);
  } catch {
    return iso;
  }
}

export default function SessionsScreen() {
  const { t, i18n } = useTranslation();
  const theme = useStore((state) => state.theme);
  const [sessions, setSessions] = useState<AuthSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authService.listSessions();
      setSessions(res.sessions ?? []);
    } catch (e) {
      feedback.error(
        (e as { message?: string })?.message ?? t("sessions.loadError")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRevoke = async (id: string) => {
    setActionId(id);
    try {
      const res = await authService.revokeSession(id);
      feedback.success(res.message || t("sessions.revoked"));
      if (res.wasCurrent) {
        await authService.logout();
      } else {
        await load();
      }
    } catch (e) {
      feedback.error(
        (e as { message?: string })?.message ?? t("sessions.revokeError")
      );
    } finally {
      setActionId(null);
    }
  };

  const onRevokeOthers = async () => {
    setRevokingOthers(true);
    try {
      const res = await authService.revokeOtherSessions();
      feedback.success(
        res.message ||
          t("sessions.revokedOthers", { count: res.revokedCount })
      );
      await load();
    } catch (e) {
      feedback.error(
        (e as { message?: string })?.message ?? t("sessions.revokeOthersError")
      );
    } finally {
      setRevokingOthers(false);
    }
  };

  const hasOthers = sessions.some((s) => !s.isCurrent);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <HeaderInnerPage
        title={t("sessions.title")}
        subTitle={t("sessions.subTitle")}
        addstyles={{ marginBottom: 0 }}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={theme.tint} style={{ marginTop: 24 }} />
        ) : (
          <>
            <TouchableOpacity
              onPress={() => void load()}
              style={[styles.refreshBtn, { borderColor: theme.border }]}
            >
              <ThemedText type="subText" style={{ color: theme.text }}>
                {t("sessions.refresh")}
              </ThemedText>
              <AntDesign name="reload1" size={16} color={theme.text} />
            </TouchableOpacity>

            {hasOthers ? (
              <TouchableOpacity
                disabled={revokingOthers}
                onPress={() => void onRevokeOthers()}
                style={[
                  styles.dangerOutline,
                  {
                    borderColor: theme.emergencyColor ?? "#c00",
                    opacity: revokingOthers ? 0.6 : 1,
                  },
                ]}
              >
                {revokingOthers ? (
                  <ActivityIndicator color={theme.emergencyColor ?? "#c00"} />
                ) : (
                  <ThemedText
                    type="middleTitle"
                    style={{ color: theme.emergencyColor ?? "#c00" }}
                  >
                    {t("sessions.revokeAllOthers")}
                  </ThemedText>
                )}
              </TouchableOpacity>
            ) : null}

            {sessions.length === 0 ? (
              <ThemedText
                type="subText"
                style={[styles.empty, { color: theme.subText }]}
              >
                {t("sessions.empty")}
              </ThemedText>
            ) : (
              sessions.map((s) => (
                <View
                  key={s.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.bg,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <ThemedText type="subtitle" style={{ color: theme.text }}>
                      {s.clientLabel || t("sessions.unknownClient")}
                    </ThemedText>
                    {s.isCurrent ? (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: theme.tint + "33" },
                        ]}
                      >
                        <ThemedText type="subText" style={{ color: theme.tint }}>
                          {t("sessions.current")}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  <ThemedText
                    type="subText"
                    style={[styles.meta, { color: theme.subText }]}
                  >
                    {t("sessions.lastActive")}:{" "}
                    {formatWhen(s.lastActiveAt, i18n.language)}
                  </ThemedText>
                  {s.userAgent ? (
                    <ThemedText
                      type="subText"
                      style={[styles.meta, { color: theme.subText }]}
                      numberOfLines={2}
                    >
                      {s.userAgent}
                    </ThemedText>
                  ) : null}
                  <TouchableOpacity
                    disabled={actionId === s.id}
                    onPress={() => void onRevoke(s.id)}
                    style={[styles.revokeBtn, { borderColor: theme.border }]}
                  >
                    {actionId === s.id ? (
                      <ActivityIndicator size="small" color={theme.tint} />
                    ) : (
                      <ThemedText
                        type="middleTitle"
                        style={{ color: theme.emergencyColor ?? "#c00" }}
                      >
                        {s.isCurrent
                          ? t("sessions.terminateThis")
                          : t("sessions.terminate")}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100, gap: 12 },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dangerOutline: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  empty: { marginTop: 24, textAlign: "center" },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  meta: { marginTop: 2 },
  revokeBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
});
