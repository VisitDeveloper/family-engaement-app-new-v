import { useThemedStyles } from '@/hooks/use-theme-style'
import { useStore } from '@/store'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { ThemedText } from '../themed-text'

interface HeaderInnerPageprops {
    title: string;
    subTitle?: string;
    addstyles?:any;
}

export default function HeaderInnerPage(props: HeaderInnerPageprops) {
    const router = useRouter();
    const theme = useStore(state => state.theme)

    const styles = useThemedStyles((t) => ({
        header: {
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: t.border,
            flexDirection: 'row',
            alignItems: 'center',
        },
        backBtn: { padding: 6, marginRight: 6 },
        headerTexts: { flexDirection: 'column' },
        subtitle: { color: t.subText },
    }) as const);

    return (
        <View style={[styles.header, props.addstyles]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerTexts}>
                <ThemedText type="subtitle" style={{ color: theme.text, fontWeight: 500 }}>
                    {props.title}
                </ThemedText>
                {props.subTitle ? (
                    <ThemedText type="subText" style={styles.subtitle}>
                        {props.subTitle}
                    </ThemedText>
                ) : null}
            </View>
        </View>
    )
}
