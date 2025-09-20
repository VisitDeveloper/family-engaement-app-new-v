import { useThemedStyles } from '@/hooks/use-theme-style'
import { useStore } from '@/store'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { ThemedText } from '../themed-text'


interface HeaderThreeSectionsProps {
    title: string;
    desc?: string;
    icon: React.ReactNode | React.ReactElement;
    colorDesc?:string;
}

export default function HeaderThreeSections(props: HeaderThreeSectionsProps) {
    const theme = useStore(state => state.theme);
    const router = useRouter();

    const styles = useThemedStyles((t) => ({
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 10,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderColor: t.border,
        },
        headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        backBtn: { padding: 6 },
        cover: {
            width: '100%',
            height: 180,
            borderRadius: 12,
            marginTop: 12,
        },
    }) as const);


    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={20} color={theme.text} />
                </TouchableOpacity>
                <View>
                    <ThemedText type="defaultSemiBold">
                        {props.title}
                    </ThemedText>
                    <ThemedText type="subText" style={{color:`${props.colorDesc}`}}>
                        {props.desc}
                    </ThemedText>
                </View>
            </View>
            <TouchableOpacity>
                {/* <Ionicons name="bookmark-outline" size={20} color={theme.text} /> */}
                {props.icon}
            </TouchableOpacity>
        </View>
    )
}
