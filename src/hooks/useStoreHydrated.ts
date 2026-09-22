import { useSyncExternalStore } from 'react';

import { useGameStore } from '@/store/gameStore';

function subscribe(callback: () => void) {
  return useGameStore.persist.onFinishHydration(callback);
}

function getSnapshot() {
  return useGameStore.persist.hasHydrated();
}

/** True once the persisted save has been loaded from AsyncStorage (or confirmed empty on first launch). */
export function useStoreHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
