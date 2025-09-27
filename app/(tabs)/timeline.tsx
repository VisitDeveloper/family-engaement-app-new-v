import HeaderTabItem from '@/components/reptitive-component/header-tab-item';
import TimelineItem from '@/components/reptitive-component/timeline-item';
import { ThemedText } from '@/components/themed-text';
import { useThemedStyles } from '@/hooks/use-theme-style';
import { useStore } from '@/store';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TimelineScreen = () => {
  const insets = useSafeAreaInsets();
  const theme = useStore(state => state.theme);


  const styles = useThemedStyles((theme) => ({
    container: { flex: 1, backgroundColor: theme.bg, padding: 10, },
    tabs: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: theme.border,
    },
    tab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: theme.bg,
    },
    tabActive: {
      backgroundColor: theme.tint,
    },
    postCard: {
      backgroundColor: theme.bg,
      borderRadius: 10,
      padding: 15,
      marginTop: 15,
      borderWidth: 1,
      borderColor: theme.border,
    },
    postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.panel,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      borderColor: theme.border,
      borderWidth: 1
    },
    badge: {
      marginLeft: 'auto',
      backgroundColor: theme.star,
      borderRadius: 50,
      paddingHorizontal: 5,
      paddingVertical: 5,
    },
    postImage: { width: '100%', height: 180, borderRadius: 8, marginTop: 10 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
    tag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.panel,

    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 20,
      marginTop: 10,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.border,
      paddingVertical: 5,
    },
    actionButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 10 },
    ationItem: { flexDirection: 'row', alignItems: 'center' },
    comments: { marginTop: 10 },
    commentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
    },
    commentInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginLeft: 8,
      color: theme.text,
      height: 40,
      backgroundColor: theme.panel
    },
    generalmargin: {
      marginLeft: 5,
    }
  }) as const);

  return (
    <View style={styles.container}>

      {/* Header */}
      <HeaderTabItem
        title='Sarah’s Timeline'
        subTitle='Learning journey & memories'
        buttonIcon={<Feather name="calendar" size={16} color={theme.tint} />}
        buttonLink='/event'
        buttonTtitle='Events'

        buttonSecondLink='/new-post'
        buttonSecondTtitle=''
        buttonSecondIcon={<MaterialCommunityIcons name="timeline-plus-outline" size={16} color={theme.tint} />}
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        {['All Posts', 'Media', 'Reports', 'Highlights', 'Saved'].map((tab, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.tab, idx === 0 && styles.tabActive]}
          >
            <ThemedText
              type="subText"
              style={{ color: idx === 0 ? '#fff' : theme.text }}
            >
              {tab}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
      >

        <TimelineItem
          name='Ms. Alvarez'
          seen='2 hours ago'
          desc='Sarah built an amazing tower with 20 blocks today! She showed excellent spatial reasoning and counted each block as she added it. This demonstrates her growing math skills and patience.'
          numberOfComment={1}
          numberOfLike={3}
          commenter='Mom'
          commnet='This is wonderful! Thank you for sharing.'
          // require('./../../assets/images/partial-react-logo.png')
          image={require('./../../assets/images/timeline-1.jpg')}
        />

        <TimelineItem
          name='Ms. Alvarez'
          seen='2 hours ago'
          desc='Sarah built an amazing tower with 20 blocks today! She showed excellent spatial reasoning and counted each block as she added it. This demonstrates her growing math skills and patience.'
          numberOfComment={1}
          numberOfLike={3}
          commenter='Mom'
          commnet='This is wonderful! Thank you for sharing.'
          image={require('./../../assets/images/timeline-2.jpg')}
        />

        <TimelineItem
          name='Ms. Alvarez'
          seen='2 hours ago'
          desc='Sarah built an amazing tower with 20 blocks today! She showed excellent spatial reasoning and counted each block as she added it. This demonstrates her growing math skills and patience.'
          numberOfComment={1}
          numberOfLike={3}
          commenter='Mom'
          commnet='This is wonderful! Thank you for sharing.'
          image={require('./../../assets/images/timeline-3.jpg')}
        />
      </ScrollView>
    </View>
  );
};

export default TimelineScreen;
