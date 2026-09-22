import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useGameStore } from '@/store/gameStore';

const TICK_INTERVAL_MS = 15_000;

/**
 * Drives the live simulation while the app is foregrounded: runs the big "how long was I away"
 * catch-up once on mount (and again on every foreground), then ticks needs/events on an interval.
 * Must only be mounted after the store has hydrated from disk (see useStoreHydrated).
 */
export function useGameLoop() {
  const catchUpOnOpen = useGameStore((s) => s.catchUpOnOpen);
  const tick = useGameStore((s) => s.tick);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    catchUpOnOpen();
    intervalRef.current = setInterval(tick, TICK_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        catchUpOnOpen();
        if (!intervalRef.current) intervalRef.current = setInterval(tick, TICK_INTERVAL_MS);
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    });

    return () => {
      subscription.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
