import { useMemo } from 'react';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IOSBlurTint = string;

type SurfaceToken = {
  tint: IOSBlurTint;
  intensity: number;
  overlay: string;
  border: string;
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const number = parseInt(value, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function useIOSDesign() {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';

  return useMemo(() => {
    const tintBase: IOSBlurTint = isDark
      ? 'systemUltraThinMaterialDark'
      : 'systemUltraThinMaterialLight';

    const makeSurface = (intensity: number, overlayAlpha: number): SurfaceToken => ({
      tint: tintBase,
      intensity,
      overlay: hexToRgba(Colors.primary, overlayAlpha),
      border: 'rgba(255, 255, 255, 0.35)',
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    });

    return {
      isDark,
      cardCornerRadius: 20,
      dragHandleColor: hexToRgba(Colors.lightGray, 0.7),
      accentGlow: hexToRgba(Colors.primary, 0.35),
      materials: {
        screen: makeSurface(36, 0.1),
        card: makeSurface(52, 0.15),
        button: makeSurface(68, 0.15),
      },
      liquidTab: {
        blurTint: tintBase,
        blurIntensity: 40,
        sheen: 'rgba(255,255,255,0.18)',
        border: 'rgba(255,255,255,0.5)',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 12 },
      },
    };
  }, [isDark]);
}
