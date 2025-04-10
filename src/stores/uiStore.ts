import { create, StateCreator } from "zustand";

// Export the interface
export interface UiState {
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}

// Explicitly type the state creator
const storeCreator: StateCreator<UiState> = (set) => ({
  isMobileSidebarOpen: false,
  openMobileSidebar: () => set({ isMobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
});

export const useUiStore = create<UiState>(storeCreator);
