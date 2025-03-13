// editingSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";


interface EditingSlotState {
  barNumber: number | null;      // ID of the bar being edited
  slotBeat: number | null;       // The beat (start) of the slot being edited
  lastInputNote: string;         // The note text input by the user
  noteInput: string;             // The note text input by the user
  insertedDuration: number;      // Duration of the note being inserted
  insertNoteTime: number;
  allowedNoteTime: [1,2,4,8,16]; // Allowed note durations
  allowedDurations: number[];    // List of allowed durations for splitting the slot (sorted descending ideally)
  isdotted: boolean;
  editingMode: string; // New state for tracking editing mode
  allowedEditingModes: string[]; // Allowed editing modes
}

const initialState: EditingSlotState = {
  barNumber: 0,
  slotBeat: 0,
  lastInputNote: "",
  noteInput: "",
  insertedDuration: 1,        // default value; update when setting the editing slot
  insertNoteTime: 4,
  allowedNoteTime: [1, 2, 4, 8, 16],        // default value; update when setting the editing slot
  allowedDurations: [4, 2, 1, 0.5, 0.25],  // example allowed durations (in quarter-note units)
  isdotted: false,
  editingMode: "melody" ,        // Default mode is "chord"
  allowedEditingModes: ["chord", "lyric", "extrainfo", "melody"]
};

const editingSlice = createSlice({
  name: "editingSlot",
  initialState,
  reducers: {
    setEditingSlot(
      state,
      action: PayloadAction<{
        barNumber: number;
        slotBeat: number;
      }>
    ) {
      state.barNumber = action.payload.barNumber;
      state.slotBeat = action.payload.slotBeat;
    },
    updateNoteInput(state, action: PayloadAction<string>) {
      state.noteInput = action.payload;
    },
    updateLastInputNote(state, action: PayloadAction<string>) {
      state.lastInputNote = action.payload;
    },
    updateInputDuration(state, action: PayloadAction<{ newInputTime: number, baseBeat: number }>) {
      if (state.isdotted && action.payload.newInputTime === 16) {
        state.isdotted = false;
      }
      state.insertNoteTime = action.payload.newInputTime;
      state.insertedDuration = action.payload.baseBeat / action.payload.newInputTime;
    },
    clearEditingSlot(state) {
      console.log('logs')
      state.barNumber = null;
      state.slotBeat = null;
      state.noteInput = "";
      // Optionally, you could reset allowedDurations to a default here.
    },
    toggleDotted(state) {
      if (state.insertNoteTime === 16) {
        return;
      }
      state.isdotted = !state.isdotted;
    },
    setEditingMode(state, action: PayloadAction<string>) {
      state.editingMode = action.payload;
    }
  }
});

export const {
  setEditingSlot,
  updateNoteInput,
  clearEditingSlot,
  updateInputDuration,
  updateLastInputNote,
  toggleDotted,
  setEditingMode
} = editingSlice.actions;

export default editingSlice.reducer;
