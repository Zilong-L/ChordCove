// editingSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface EditingSlotState {
  editingTrack: number;
  editingBeat: number;
  playingBeat: number | null; // 当前正在播放的 beat
  selectedDuration: 1 | 2 | 4 | 8 | 16 | 32;
  lastInputNote: string;
  noteInput: string;
  allowedDurations: [1, 2, 4, 8, 16];
  isDotted: boolean;
  useRelativePitch: boolean;
  isLyricsEditing: boolean;
  lyricsInputValue: string;
  isRecording: boolean;
  showLyricsByTrack: Record<string, boolean>; // Per-track toggle for showing lyrics under each track
  recordingSnapType: "whole" | "eighth" | "sixteenth";
  selectedMidiInputId: string | "all" | null; // Selected MIDI input device id
}

const initialState: EditingSlotState = {
  editingTrack: 0,
  editingBeat: 0,
  playingBeat: null, // 初始状态为 null
  selectedDuration: 4, // Default to quarter note
  lastInputNote: "C3", // Default value from SimpleEditor
  noteInput: "",
  allowedDurations: [1, 2, 4, 8, 16],
  isDotted: false,
  useRelativePitch: true,
  isLyricsEditing: false,
  lyricsInputValue: "",
  isRecording: false,
  showLyricsByTrack: {},
  recordingSnapType: "eighth",
  selectedMidiInputId: "all",
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

    toggleRelativePitch: (state) => {
      state.useRelativePitch = !state.useRelativePitch;
    },
    setLyricsEditing: (state, action: PayloadAction<boolean>) => {
      state.isLyricsEditing = action.payload;
    },
    setLyricsInputValue: (state, action: PayloadAction<string>) => {
      state.lyricsInputValue = action.payload;
    },
    setRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },
    setRecordingSnapType: (state, action: PayloadAction<"whole" | "eighth" | "sixteenth">) => {
      state.recordingSnapType = action.payload;
    },
    setShowLyricsForTrack: (state, action: PayloadAction<{ trackId: string; value: boolean }>) => {
      const { trackId, value } = action.payload;
      state.showLyricsByTrack = { ...state.showLyricsByTrack, [trackId]: value };
    },
    setSelectedMidiInputId: (state, action: PayloadAction<string | "all" | null>) => {
      state.selectedMidiInputId = action.payload;
    },
  },
});

export const {
  setEditingTrack,
  setEditingBeat,
  setPlayingBeat,
  setSelectedDuration,
  toggleDotted,
  setLastInputNote,
  setNoteInput,
  advanceEditingPosition,
  toggleRelativePitch,
  setLyricsEditing,
  setLyricsInputValue,
  setRecording,
  setShowLyricsForTrack,
  setRecordingSnapType,
  setSelectedMidiInputId,
} = editingSlice.actions;

export default editingSlice.reducer;
