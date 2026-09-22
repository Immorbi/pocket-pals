import { create } from 'zustand';

export type SheetName = 'food' | 'play';

interface UiState {
  /** Which bottom sheet the Home screen should be showing, if any. */
  sheet: SheetName | null;
  openSheet: (sheet: SheetName) => void;
  closeSheet: () => void;
}

/**
 * Lives apart from the saved game: nothing here survives a reload. It exists because the
 * food and play sheets are opened from the tab bar, which sits outside the screen that
 * renders them.
 */
export const useUiStore = create<UiState>((set) => ({
  sheet: null,
  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),
}));
