import { Pangolin_400Regular } from '@expo-google-fonts/pangolin';
import { GolosText_400Regular, GolosText_500Medium, GolosText_700Bold } from '@expo-google-fonts/golos-text';
import { Onest_700Bold, Onest_800ExtraBold } from '@expo-google-fonts/onest';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';
import { useStoreHydrated } from '@/hooks/useStoreHydrated';

// The dev server's default HTML omits viewport-fit=cover, so env(safe-area-inset-*) — and
// with it, insets.bottom below — reports 0 on iOS Safari, letting the bottom bar sit under
// the browser's own chrome. Patch it in directly since it can't be set from app.json/+html
// while running through the (non-static) dev server.
function useCoverViewportOnWeb() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta && !meta.getAttribute('content')?.includes('viewport-fit')) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover');
    }
  }, []);
}

export default function RootLayout() {
  useCoverViewportOnWeb();
  const hydrated = useStoreHydrated();
  const [fontsLoaded] = useFonts({
    Onest_700Bold,
    Onest_800ExtraBold,
    GolosText_400Regular,
    GolosText_500Medium,
    GolosText_700Bold,
    Pangolin_400Regular,
  });
  const ready = hydrated && fontsLoaded;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        {!ready ? (
          <View style={styles.splash}>
            <Text style={styles.splashEmoji}>🐾</Text>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <Stack screenOptions={{ headerShown: false }} />
        )}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E3B6B',
    gap: 16,
  },
  splashEmoji: {
    fontSize: 56,
  },
});
