import { useFonts as useExpoFonts, Poppins_300Light, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

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
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return fontsLoaded || false;
}
