import { useThemedStyles } from '@/hooks/use-theme-style';
import { useStore } from '@/store';
import { useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import RoleGuard from '../check-permisions';
import { ThemedText } from '../themed-text';

interface HeaderTabItemProps {
    buttonLink?: string;
    buttonTtitle?: string;
    buttonIcon?: React.ReactNode | React.ReactElement;

    buttonSecondTtitle?: string;
    buttonSecondLink?: string;
    buttonSecondIcon?: React.ReactNode | React.ReactElement;

    title: string;
    subTitle: string;

}

export default function HeaderTabItem(props: HeaderTabItemProps) {

    const router = useRouter();
    const theme = useStore(state => state.theme)

    const styles = useThemedStyles((theme) => ({
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            // padding: 10,
        },
        headerWrap: {
            flexDirection: 'column', alignItems: 'flex-start'
        },
        headerTitle: { fontWeight: 'bold', color: theme.text },
        headerSubTitle: { color: theme.text },
        eventButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.bg,
            color: theme.tint,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
            borderColor: theme.tint,
            borderWidth: 1
        },
        eventText: { color: theme.tint, marginLeft: 5 },
    }) as const)

    return (

        <View style={styles.header}>
            <View style={styles.headerWrap}>
                <ThemedText type="subtitle" style={styles.headerTitle}>
                    {props.title}
                </ThemedText>
                <ThemedText type="subText" style={styles.headerSubTitle}>
                    {props.subTitle}
                </ThemedText>
            </View>
            <View style={{ flexDirection: 'row', gap: 5 }}>

                {
                    props?.buttonTtitle ? (
                        <TouchableOpacity style={styles.eventButton} onPress={() => router.push(props.buttonLink as any)}>
                            {/* <Feather name="calendar" size={16} color={theme.tint} /> */}
                            {props.buttonIcon ? props.buttonIcon : null}
                            <ThemedText type="subText" style={styles.eventText}>
                                {props.buttonTtitle!}
                            </ThemedText>
                        </TouchableOpacity>
                    ) : null
                }
                {
                    (props?.buttonSecondTtitle || props.buttonSecondIcon) ? (
                        <RoleGuard roles={['admin', 'teacher']}>

                            <TouchableOpacity style={styles.eventButton} onPress={() => router.push(props.buttonSecondLink as any)}>
                                {/* <Feather name="calendar" size={16} color={theme.tint} /> */}
                                {props.buttonSecondIcon ? props.buttonSecondIcon : null}
                                {props?.buttonSecondTtitle ? <ThemedText type="subText" style={styles.eventText}>
                                    {props.buttonSecondTtitle!}
                                </ThemedText> : null}

                            </TouchableOpacity>
                        </RoleGuard>
                    ) : null
                }
            </View>

        </View>
    )
}
