import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Screen options={{ title: 'Oops!' }} />
        <ThemedView style={styles.container}>
          <ThemedText type="title">This screen does not exist.</ThemedText>
          <Link href="/(tabs)/dashboard" style={styles.link}>
            <ThemedText type="link">Go to home screen!</ThemedText>
          </Link>
        </ThemedView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
