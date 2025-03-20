// editingSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface EditingSlotState {
  editingTrack: number;
  editingBeat: number;
  selectedDuration: 1 | 2 | 4 | 8 | 16 | 32;
  lastInputNote: string;
  noteInput: string;
  allowedDurations: [1, 2, 4, 8, 16];
  isDotted: boolean;
  showColors: boolean;
}

const initialState: EditingSlotState = {
  editingTrack: 0,
  editingBeat: 0,
  selectedDuration: 4,  // Default to quarter note
  lastInputNote: "C3",  // Default value from SimpleEditor
  noteInput: "",
  allowedDurations: [1, 2, 4, 8, 16],
  isDotted: false,
  showColors: true,
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
    setSelectedDuration: (state, action: PayloadAction<1 | 2 | 4 | 8 | 16 | 32>) => {
      state.selectedDuration = action.payload;
    },
    toggleDotted: (state) => {
      state.isDotted = !state.isDotted;
    },
    toggleColors: (state) => {
      state.showColors = !state.showColors;
    },
    setLastInputNote: (state, action: PayloadAction<string>) => {
      state.lastInputNote = action.payload;
    },
    setNoteInput: (state, action: PayloadAction<string>) => {
      state.noteInput = action.payload;
    },
    advanceEditingPosition: (state) => {
      state.editingBeat += 1;
    }
  }
});

export const {
  setEditingTrack,
  setEditingBeat,
  setSelectedDuration,
  toggleDotted,
  toggleColors,
  setLastInputNote,
  setNoteInput,
  advanceEditingPosition
} = editingSlice.actions;

export default editingSlice.reducer;
