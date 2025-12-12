import { useStore } from '@/store';
import { StyleSheet, View } from 'react-native';

export default function Card({ children }: { children: React.ReactNode }) {
    const theme = useStore(state => state.theme);
    return <View style={[styles.card, { backgroundColor: theme.bg, borderColor: theme.border }]}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        elevation: 2,
    },
});