// editingSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type EditingMode = "notes" | "lyrics" | "chords" | "comments";

export interface EditingSlotState {
  editingTrack: number;
  editingBeat: number;
  playbackStartBeat: number;
  playbackEndBeat: number | null;
  playingBeat: number | null; // 当前正在播放的 beat
  selectedDuration: 1 | 2 | 4 | 8 | 16 | 32;
  lastInputNote: string;
  noteInput: string;
  allowedDurations: [1, 2, 4, 8, 16];
  isDotted: boolean;
  editingMode: EditingMode;
  useRelativePitch: boolean;
}

const initialState: EditingSlotState = {
  editingTrack: 0,
  editingBeat: 0,
  playbackStartBeat: 0,
  playbackEndBeat: null,
  playingBeat: null, // 初始状态为 null
  selectedDuration: 4, // Default to quarter note
  lastInputNote: "C3", // Default value from SimpleEditor
  noteInput: "",
  allowedDurations: [1, 2, 4, 8, 16],
  isDotted: false,
  editingMode: "notes",
  useRelativePitch: true,
};

const editingSlice = createSlice({
  name: "editingSlot",
  initialState,
  reducers: {
    setEditingTrack: (state, action: PayloadAction<number>) => {
      state.editingTrack = action.payload;
    },
    setEditingBeat: (state, action: PayloadAction<number>) => {
      state.editingBeat = action.payload;
    },
    setPlaybackStartBeat: (state, action: PayloadAction<number>) => {
      state.playbackStartBeat = action.payload;
    },
    setPlaybackEndBeat: (state, action: PayloadAction<number | null>) => {
      state.playbackEndBeat = action.payload;
    },
    setPlayingBeat: (state, action: PayloadAction<number | null>) => {
      state.playingBeat = action.payload;
    },
    setSelectedDuration: (state, action: PayloadAction<1 | 2 | 4 | 8 | 16 | 32>) => {
      state.selectedDuration = action.payload;
    },
    toggleDotted: (state) => {
      state.isDotted = !state.isDotted;
    },
    setLastInputNote: (state, action: PayloadAction<string>) => {
      state.lastInputNote = action.payload;
    },
    setNoteInput: (state, action: PayloadAction<string>) => {
      state.noteInput = action.payload;
    },
    advanceEditingPosition: (state) => {
      state.editingBeat += 1;
    },
    setEditingMode: (state, action: PayloadAction<EditingMode>) => {
      state.editingMode = action.payload;
    },
    toggleRelativePitch: (state) => {
      state.useRelativePitch = !state.useRelativePitch;
    },
  },
});

export const {
  setEditingTrack,
  setEditingBeat,
  setPlaybackStartBeat,
  setPlaybackEndBeat,
  setPlayingBeat,
  setSelectedDuration,
  toggleDotted,
  setLastInputNote,
  setNoteInput,
  advanceEditingPosition,
  setEditingMode,
  toggleRelativePitch,
} = editingSlice.actions;

export default editingSlice.reducer;
