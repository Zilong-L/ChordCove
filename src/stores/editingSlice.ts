// editingSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EditingSlotState {
  barNumber: number | null;      // ID of the bar being edited
  slotBeat: number | null;   // The beat (start) of the slot being edited
  noteInput: string;         // The note text input by the user
  insertedDuration: number;  // Duration of the note being inserted
  allowedDurations: number[]; // List of allowed durations for splitting the slot (sorted descending ideally)
}

const initialState: EditingSlotState = {
  barNumber: null,
  slotBeat: null,
  noteInput: "",
  insertedDuration: 0,        // default value; update when setting the editing slot
  allowedDurations: [2, 1, 0.5, 0.25]  // example allowed durations (in quarter-note units)
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
    updateInputDuration(state, action: PayloadAction<number>) {
      state.insertedDuration = action.payload;
    },
    clearEditingSlot(state) {
      state.barNumber = null;
      state.slotBeat = null;
      state.noteInput = "";
      state.insertedDuration = 0;
      // Optionally, you could reset allowedDurations to a default here.
    }
  }
});

export const { setEditingSlot, updateNoteInput, clearEditingSlot } = editingSlice.actions;
export default editingSlice.reducer;
