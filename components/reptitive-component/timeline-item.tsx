import { useThemedStyles } from '@/hooks/use-theme-style'
import { useStore } from '@/store'
import { AntDesign, EvilIcons, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { Image, TextInput, TouchableOpacity, View } from 'react-native'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'

export interface ResourceItemProps {

    name: string;
    seen?: string;
    desc: string;
    numberOfLike: number;
    numberOfComment: number;
    commenter: string;
    commnet: string;
    image?: any;
    styles?: any;
    onPress?: (i: any) => void;
    comment?: string;
    setComment?: () => void;
}

export default function TimelineItem(props: ResourceItemProps) {

    const theme = useStore(state => state.theme);
    const router = useRouter();

    const styles = useThemedStyles((theme) => ({
        
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
        <ThemedView style={styles.postCard}>
            <View style={styles.postHeader}>
                <View style={styles.avatar}>
                    <ThemedText type="subText" style={{ color: theme.subText }}>MA</ThemedText>
                </View>
                <View>
                    <ThemedText type="defaultSemiBold" style={{ color: theme.text }}>
                        {props.name}
                    </ThemedText>
                    <ThemedText type="subLittleText" style={{ color: theme.subText }}>
                        {props.seen}
                    </ThemedText>
                </View>
                <View style={styles.badge}>
                    <AntDesign name="star" size={12} color="#fff" />
                </View>
            </View>

            <ThemedText type="subText" style={{ color: theme.text }}>
                {props.desc}
            </ThemedText>

            {/* Tags */}
            <View style={styles.tags}>
                {['Math', 'Building', 'Problem Solving'].map((tag, idx) => (
                    <ThemedView key={idx} style={styles.tag}>
                        <ThemedText type="subText" style={{ fontWeight: '600', color: theme.text }}>{tag}</ThemedText>
                    </ThemedView>
                ))}
            </View>

            {/* Post Image */}
            {props.image && (
                // require('./../../assets/images/partial-react-logo.png')
                <TouchableOpacity onPress={() => router.push('/sampleTimeline')}>
                    <Image
                        source={props.image}
                        style={styles.postImage}
                    />
                </TouchableOpacity>
            )}

            {/* Actions */}
            <View style={styles.actions}>
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.ationItem}>
                        <EvilIcons name="heart" size={22} color={theme.text} />
                        <ThemedText type="subText" style={[styles.generalmargin, { color: theme.text }]}>

                            {props.numberOfLike}
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ationItem}>
                        <Ionicons name="chatbubble-outline" size={16} color={theme.text} />
                        <ThemedText type="subText" style={[styles.generalmargin, { color: theme.text }]}>
                            {props.numberOfComment}
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.ationItem}>
                        <Ionicons name="return-up-forward-outline" size={18} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <View>
                    <Ionicons name="bookmark-outline" size={20} color={theme.text} />
                </View>


            </View>

            {/* Comments */}
            <View style={styles.comments}>
                <View style={styles.commentRow}>
                    <ThemedText type="defaultSemiBold" style={{ color: theme.text }}>
                        {props.commenter}
                    </ThemedText>
                    <ThemedText type="subText" style={[styles.generalmargin, { color: theme.text }]}>
                        {props.commnet}
                    </ThemedText>
                </View>
                <View style={styles.commentRow}>
                    <Ionicons name="person-circle" size={24} color={theme.subText} />
                    <TextInput
                        style={[styles.commentInput, { color: theme.text }]}
                        value={props.comment}
                        onChangeText={props.setComment}
                        placeholder="Add a comment..."
                        placeholderTextColor={theme.subText}
                    />
                </View>
            </View>
        </ThemedView>
    )
}
