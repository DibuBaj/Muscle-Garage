import { useFonts as useExpoFonts, Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Prevent auto-hide at startup; safely ignore environments where native splash is unavailable.
void SplashScreen.preventAutoHideAsync().catch(() => {
  // No-op: some navigation/view-controller transitions may not have a registered native splash.
});

export function useFonts() {
  const [fontsLoaded, fontError] = useExpoFonts({
    'Poppins_300': Poppins_300Light,
    'Poppins_400': Poppins_400Regular,
    'Poppins_500': Poppins_500Medium,
    'Poppins_600': Poppins_600SemiBold,
    'Poppins_700': Poppins_700Bold,
    'Poppins_800': Poppins_800ExtraBold,
    Poppins: Poppins_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync().catch(() => {
        // No-op: avoid uncaught promise when splash is not registered for current view controller.
      });
    }
  }, [fontsLoaded, fontError]);

  return fontsLoaded || !!fontError;
}
