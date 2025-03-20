// store/scoreSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface Note {
  beat: number; // absolute beat position
  duration: number;
  content: string; // note string (e.g., "C4")
}

export interface Track {
  notes: Note[];
}

export interface NewScore {
  tempo: number;
  key: string;
  tracks: Track[];
}

/**
 * Replaces or inserts a note at a specific beat position, handling duration conflicts.
 *
 * This function handles three scenarios:
 * 1. Simple replacement: When the new note has the same duration as the existing one
 * 2. Shortening: When the new note is shorter than existing one, splits the existing note
 * 3. Lengthening: When the new note is longer, consumes subsequent notes as needed
 *
 * @param notes - Array of notes in the track
 * @param newNote - The note to insert or replace with
 * @returns Modified array of notes, sorted by beat
 */
export function replaceOrInsertNote(notes: Note[], newNote: Note): Note[] {
  const existingIndex = notes.findIndex((n) => n.beat === newNote.beat);

  if (existingIndex === -1) {
    // Simple insertion
    notes.push(newNote);
    return notes.sort((a, b) => a.beat - b.beat);
  }

  const existingNote = notes[existingIndex];
  const notesCopy = [...notes];

  if (newNote.duration === existingNote.duration) {
    // Simple replacement
    notesCopy[existingIndex] = newNote;
  } else if (newNote.duration < existingNote.duration) {
    // Split existing note into two parts
    notesCopy[existingIndex].duration -= newNote.duration;
    notesCopy[existingIndex].beat += newNote.duration;
    notesCopy.splice(existingIndex - 1, 0, newNote);
  } else {
    // Consume subsequent notes if needed
    let remainingDuration = newNote.duration;
    let currentIndex = existingIndex;

    // Calculate how many notes will be consumed
    while (currentIndex < notesCopy.length && remainingDuration > 0) {
      remainingDuration -= notesCopy[currentIndex].duration;
      currentIndex++;
    }

    // Handle partial consumption of the last note
    if (remainingDuration < 0) {
      const lastConsumedNote = notesCopy[currentIndex - 1];

      // Add remaining part of the last consumed note
      notesCopy.splice(currentIndex, 0, {
        beat: newNote.beat + newNote.duration,
        duration: -remainingDuration,
        content: lastConsumedNote.content,
      });
    }

    // Remove consumed notes and insert new note
    notesCopy.splice(existingIndex, currentIndex - existingIndex, newNote);
  }

  return notesCopy.sort((a, b) => a.beat - b.beat);
}

const initialState: NewScore = {
  tempo: 120,
  key: "C3",
  tracks: [
    {
      notes: [
        {
          beat: 0,
          duration: 4,
          content: "0",
        },
      ],
    },
    {
      notes: [
        {
          beat: 0,
          duration: 4,
          content: "0",
        },
      ],
    },
  ],
};

const newScoreSlice = createSlice({
  name: "newScore",
  initialState,
  reducers: {
    // Basic score properties
    setTempo(state, action: PayloadAction<number>) {
      state.tempo = action.payload;
    },

    setKey(state, action: PayloadAction<string>) {
      state.key = action.payload;
    },

    // Track operations
    addTrack(state) {
      state.tracks.push({ notes: [] });
    },

    removeTrack(state, action: PayloadAction<number>) {
      const trackIndex = action.payload;
      if (trackIndex >= 0 && trackIndex < state.tracks.length) {
        state.tracks.splice(trackIndex, 1);
      }
    },

    // Note operations
    setNote(
      state,
      action: PayloadAction<{
        trackIndex: number;
        note: Note;
      }>
    ) {
      const { trackIndex, note } = action.payload;
      if (trackIndex >= 0 && trackIndex < state.tracks.length) {
        state.tracks[trackIndex].notes = replaceOrInsertNote(state.tracks[trackIndex].notes, note);
      }
      const lastnote = state.tracks[trackIndex].notes[state.tracks[trackIndex].notes.length - 1];
      console.log(
        lastnote,
        lastnote.beat,
        lastnote.duration,
        (lastnote.beat + lastnote.duration) % 4 === 0
      );
      if (lastnote.content != "0") {
        state.tracks[trackIndex].notes.push({
          beat: lastnote.beat + lastnote.duration,
          duration: 4 - ((lastnote.beat + lastnote.duration) % 4),
          content: "0",
        });
      }
    },

    // Clear operations
    clearTrack(state, action: PayloadAction<number>) {
      const trackIndex = action.payload;
      if (trackIndex >= 0 && trackIndex < state.tracks.length) {
        state.tracks[trackIndex].notes = [];
      }
    },

    clearScore(state) {
      state.tracks = [{ notes: [] }];
    },
  },
});

export const { setTempo, setKey, addTrack, removeTrack, setNote, clearTrack, clearScore } =
  newScoreSlice.actions;

export default newScoreSlice.reducer;
