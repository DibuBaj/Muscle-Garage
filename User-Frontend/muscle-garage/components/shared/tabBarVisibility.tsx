import React, { createContext, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import { useAnimatedScrollHandler, useSharedValue, withSpring } from 'react-native-reanimated';

type TabBarVisibilityContextValue = {
  hiddenProgress: SharedValue<number>;
  showTabBar: () => void;
  hideTabBar: () => void;
};

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue | null>(null);

const springConfig = { mass: 0.6, damping: 15, stiffness: 180 };

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const hiddenProgress = useSharedValue(0);

  const showTabBar = () => {
    hiddenProgress.value = withSpring(0, springConfig);
  };

  const hideTabBar = () => {
    hiddenProgress.value = withSpring(1, springConfig);
  };

  return (
    <TabBarVisibilityContext.Provider value={{ hiddenProgress, showTabBar, hideTabBar }}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  return useContext(TabBarVisibilityContext);
}

export function useLiquidTabBarScrollHandler() {
  const context = useTabBarVisibility();
  const fallbackHiddenProgress = useSharedValue(0);
  const hiddenProgress = context?.hiddenProgress ?? fallbackHiddenProgress;
  const lastY = useSharedValue(0);

  return useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const deltaY = y - lastY.value;

      if (deltaY > 5 && y > 20) {
        hiddenProgress.value = withSpring(1, springConfig);
      } else if (deltaY < -5 || y <= 10) {
        hiddenProgress.value = withSpring(0, springConfig);
      }

      lastY.value = y;
    },
  });
}
