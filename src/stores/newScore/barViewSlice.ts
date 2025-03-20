import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Note } from "./newScoreSlice";

export interface BarNote extends Note {
  originalBeat: number;  // Reference to the original note's beat
  sustain: boolean;     // Whether this note is a continuation
}

export interface Bar {
  notes: BarNote[];
  startBeat: number;
}

export interface BarRow {
  bars: Bar[];
}

export interface BarViewState {
  rows: BarRow[];
  beatsPerBar: number;
  barsPerRow: number;
}

const initialState: BarViewState = {
  rows: [],
  beatsPerBar: 4,
  barsPerRow: 4
};

function splitNotesIntoRows(notes: Note[], beatsPerBar: number, barsPerRow: number): BarRow[] {
  const rows: BarRow[] = [];
  let currentRow: BarRow = { bars: [] };
  let currentBar: Bar = { notes: [], startBeat: 0 };
  
  // Sort notes by beat
  const sortedNotes = [...notes].sort((a, b) => a.beat - b.beat);
  
  for (let i = 0; i < sortedNotes.length; i++) {
    const note = sortedNotes[i];
    const barIndex = Math.floor(note.beat / beatsPerBar);
    const rowIndex = Math.floor(barIndex / barsPerRow);
    
    // Create new row if needed
    while (rows.length <= rowIndex) {
      if (currentRow.bars.length > 0) {
        rows.push(currentRow);
      }
      currentRow = { bars: [] };
    }
    
    // Create new bar if needed
    while (currentRow.bars.length <= barIndex % barsPerRow) {
      if (currentBar.notes.length > 0) {
        currentRow.bars.push(currentBar);
      }
      currentBar = { 
        notes: [], 
        startBeat: (barIndex * beatsPerBar)
      };
    }
    
    // Split note if it crosses bar boundary
    let remainingDuration = note.duration;
    let currentBeat = note.beat;
    let isFirst = true;
    
    while (remainingDuration > 0) {
      const currentBarEndBeat = Math.ceil(currentBeat / beatsPerBar) * beatsPerBar;
      const durationInCurrentBar = Math.min(
        remainingDuration,
        currentBarEndBeat - currentBeat
      );
      
      const barNote: BarNote = {
        beat: currentBeat,
        duration: durationInCurrentBar,
        content: note.content,
        originalBeat: note.beat,
        sustain: !isFirst
      };
      
      // Add note to current bar
      currentBar.notes.push(barNote);
      
      remainingDuration -= durationInCurrentBar;
      currentBeat += durationInCurrentBar;
      isFirst = false;
      
      // Move to next bar if needed
      if (remainingDuration > 0) {
        currentRow.bars.push(currentBar);
        const newBarIndex = Math.floor(currentBeat / beatsPerBar);
        const newRowIndex = Math.floor(newBarIndex / barsPerRow);
        
        // Create new row if needed
        if (newRowIndex > rowIndex) {
          rows.push(currentRow);
          currentRow = { bars: [] };
        }
        
        currentBar = {
          notes: [],
          startBeat: (newBarIndex * beatsPerBar)
        };
      }
    }
  }
  
  // Add remaining bars and rows
  if (currentBar.notes.length > 0) {
    currentRow.bars.push(currentBar);
  }
  if (currentRow.bars.length > 0) {
    rows.push(currentRow);
  }
  
  return rows;
}

const barViewSlice = createSlice({
  name: "barView",
  initialState,
  reducers: {
    updateFromTrack: (state, action: PayloadAction<Note[]>) => {
      state.rows = splitNotesIntoRows(action.payload, state.beatsPerBar, state.barsPerRow);
    },
    setBeatsPerBar: (state, action: PayloadAction<number>) => {
      state.beatsPerBar = action.payload;
    },
    setBarsPerRow: (state, action: PayloadAction<number>) => {
      state.barsPerRow = action.payload;
    }
  }
});

export const {
  updateFromTrack,
  setBeatsPerBar,
  setBarsPerRow
} = barViewSlice.actions;

export default barViewSlice.reducer; 