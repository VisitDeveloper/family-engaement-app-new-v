import { useThemedStyles } from '@/hooks/use-theme-style'
import { useStore } from '@/store'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import RoleGuard from '../check-permisions'
import { ThemedText } from '../themed-text'

export interface HeaderRightAction {
    icon: React.ReactNode;
    onPress?: () => void | Promise<void>;
    disabled?: boolean;
}

interface HeaderThreeSectionsProps {
    title: string;
    desc?: string;
    icon?: React.ReactNode | React.ReactElement;
    colorDesc?: string;
    onPress?: () => void;
    onCenterPress?: () => void;
    /** When set, renders multiple right-side buttons instead of single icon+onPress */
    rightActions?: HeaderRightAction[];
    buttonRoles?: string[];
    titlePrefix?: React.ReactNode | React.ReactElement;
}

export default function HeaderThreeSections({ titlePrefix = <></>, ...props }: HeaderThreeSectionsProps) {
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
        headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
        headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        headerIconBtn: { padding: 6 },
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
                {props.onCenterPress ? (
                    <TouchableOpacity
                        style={{ gap: 12, flexDirection: "row", alignItems: "center" }}
                        onPress={props.onCenterPress}
                        activeOpacity={0.7}
                    >
                        {titlePrefix}
                        <View>
                            <ThemedText type="subtitle" style={{ fontWeight: 600, fontSize: 16 }}>
                                {props.title}
                            </ThemedText>
                            {props.desc ?
                                <ThemedText type="subText" style={{ color: `${props.colorDesc}` }}>
                                    {props.desc}
                                </ThemedText> : <></>}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={{ gap: 12, flexDirection: "row", alignItems: "center" }}>
                        {titlePrefix}
                        <View>
                            <ThemedText type="subtitle" style={{ fontWeight: 600, fontSize: 16 }}>
                                {props.title}
                            </ThemedText>
                            {props.desc ?
                                <ThemedText type="subText" style={{ color: `${props.colorDesc}` }}>
                                    {props.desc}
                                </ThemedText> : <></>}
                        </View>
                    </View>
                )}
            </View>
            <RoleGuard roles={props.buttonRoles || ["admin", "teacher", "parent"]}>
                {props.rightActions && props.rightActions.length > 0 ? (
                    <View style={styles.headerRight}>
                        {props.rightActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={action.onPress}
                                style={styles.headerIconBtn}
                                disabled={action.disabled}
                            >
                                {action.icon}
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <TouchableOpacity onPress={props.onPress} style={{ flexShrink: 1 }}>
                        {props.icon}
                    </TouchableOpacity>
                )}
            </RoleGuard>
        </View>
    )
}
