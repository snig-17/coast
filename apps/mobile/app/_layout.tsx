import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fontMap } from '../src/design/fonts';
import { coastStore } from '../src/store/store';
import { loadState, saveState } from '../src/store/persistence';
import { asyncStorageKV } from '../src/store/asyncStorage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadState(asyncStorageKV)
      .then((state) => coastStore.getState().hydrate(state))
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated) SplashScreen.hideAsync();
  }, [fontsLoaded, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const unsub = coastStore.subscribe((state) => {
      void saveState(asyncStorageKV, state.data);
    });
    return unsub;
  }, [hydrated]);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
