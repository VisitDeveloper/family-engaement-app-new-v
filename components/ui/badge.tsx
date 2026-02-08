import { useThemedStyles } from '@/hooks/use-theme-style';
import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '../themed-text';


interface BadgeProps {
    title: string
    variant?: 'Admin' | 'Group'
}

function Badge(props: BadgeProps) {
    const v = props.variant ?? (props.title === 'Admin' || props.title?.toLowerCase() === 'admin' ? 'Admin' : 'Group');
    const styles = useThemedStyles((theme) => ({
        badge: {
            backgroundColor: v === 'Admin' ? '#fdd835' : '#666',
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 6,
            marginLeft: 6,
        },
        badgeText: { fontSize: 10, fontWeight: "600", color: v === 'Admin' ? '#333' : '#fff' },
    }))
    return (

        <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>
                {props.title}
            </ThemedText>
        </View>

    )
}
export default Badge