import HeaderTabItem from "@/components/reptitive-component/header-tab-item";
import StatCard from "@/components/reptitive-component/stat-card-admin";
import { ThemedText } from "@/components/themed-text";
import { useThemedStyles } from "@/hooks/use-theme-style";
import { useStore } from "@/store"; // همون Zustand store که theme رو برمی‌گردونه
import { AntDesign, Feather, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";


export default function Dashboard() {
  const { theme } = useStore(state => state);

  const teachers = [
    { name: "Ms. Alvarez", posts: 23, responses: 18, rate: 95 },
    { name: "Mr. Rodriguez", posts: 19, responses: 16, rate: 88 },
    { name: "Ms. Chen", posts: 21, responses: 19, rate: 92 },
    { name: "Mr. Thompson", posts: 15, responses: 12, rate: 85 },
  ];

  const styles = useThemedStyles((t) => ({
    container: {
      flex: 1,
      marginBottom: 90,
      backgroundColor: t.bg
    },
    headerWrap: {
      borderBottomWidth: 1, paddingBottom: 5, marginBottom: 10
    },
    row: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 10,
    },
    card: {
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,

    },
    statValue: {
      fontSize: 20,
      fontWeight: "700",
    },
    statLabel: {
      fontSize: 14,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
    },
    teacherRow: {
      marginBottom: 12,
    },
    teacherName: {
      fontWeight: "600",
      fontSize: 14,
    },
    teacherStats: {
      fontSize: 12,
      marginBottom: 4,
    },
    progressBar: {
      height: 6,
      borderRadius: 6,
      overflow: "hidden",
    },
    progressFill: {
      height: 6,
      borderRadius: 6,
    },
  }))

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, padding: 10 }}>

      <View style={[styles.headerWrap, { borderBottomColor: theme.border }]}>
        <HeaderTabItem
          title="Dashboard"
          subTitle="Family engagement analytics"
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}>

        {/* Top Stats */}
        <View style={styles.row}>

          <StatCard
            label="Active Families"
            value="22"
            sub="of 24 total families"
            icon={<Feather name="users" size={30} color={theme.iconDash} />}
          />


          <StatCard
            label="Engagement Rate"
            value="92%"
            sub="↑ 5% from last month"
            positive
            icon={<FontAwesome5 name="chart-line" size={30} color={theme.iconDash} />}
          />

        </View>

        <View style={styles.row}>

          <StatCard
            label="Posts Shared"
            value="120"
            sub="↓ 4% from last month"
            negative
            icon={<AntDesign name="picture" size={30} color={theme.iconDash} />}
          />

          <StatCard
            label="Messages Sent"
            value="340"
            sub="Same as last month"
            icon={<FontAwesome6 name="message" size={24} color={theme.iconDash} />}
          />
        </View>

        {/* Teacher Engagement */}
        <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Teacher Engagement</Text>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: theme.tint, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 8 }}>
              <AntDesign name="download" size={15} color={theme.tint} />
              <Text style={{ color: theme.tint }}>Export</Text>
            </TouchableOpacity>
          </View>

          {teachers.map((t, i) => (
            <View key={i} style={styles.teacherRow}>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
                <Text style={[styles.teacherName, { color: theme.text }]}>
                  {t.name}
                </Text>
                <View style={{ backgroundColor: theme.passDesc, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                  <ThemedText type="subText" style={{ color: theme.bg }}>{t.rate}%</ThemedText>
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 5 }}>
                <Text style={[styles.teacherStats, { color: theme.subText }]}>
                  {t.posts} posts
                </Text>
                <Text style={[styles.teacherStats, { color: theme.subText }]}>
                  {t.responses} responses
                </Text>
              </View>


              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { width: `${t.rate}%`, backgroundColor: theme.tint }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Average Response Time */}
        <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Average Response Time</Text>
          <Text style={{ fontSize: 20, fontWeight: "600", color: theme.iconDash, marginTop: 20 }}>
            2.3 hours
          </Text>
          <Text style={{ color: theme.passDesc, marginTop: 5 }}>↑ 15% faster than last month</Text>
        </View>
      </ScrollView>
    </View>
  );
}




