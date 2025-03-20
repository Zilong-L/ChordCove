// store/scoreSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface Slot {
  beat: number;
  duration: number;
  notes: string[];
  chord: string;
  lyrics: string;
  comment: string;
}

export interface Track {
  slots: Slot[];
}

export interface Score {
  track: Track;
  tempo: number;
  key: string;
}

/**
 * Replaces or inserts a slot at a specific beat position, handling duration conflicts.
 *
 * This function handles three scenarios:
 * 1. Simple replacement: When the new slot has the same duration as the existing one
 * 2. Shortening: When the new slot is shorter than existing one, splits the existing slot
 * 3. Lengthening: When the new slot is longer, consumes subsequent slots as needed
 *
 * @param slots - Array of slots in the track
 * @param newSlot - The slot to insert or replace with
 * @returns Modified array of slots, sorted by beat
 */
export function replaceOrInsertSlot(slots: Slot[], newSlot: Slot): Slot[] {
  const existingIndex = slots.findIndex((s) => s.beat === newSlot.beat);

  if (existingIndex === -1) {
    // Simple insertion
    slots.push(newSlot);
    return slots.sort((a, b) => a.beat - b.beat);
  }

  const existingSlot = slots[existingIndex];
  const slotsCopy = [...slots];

  if (newSlot.duration === existingSlot.duration) {
    // Simple replacement
    slotsCopy[existingIndex] = newSlot;
  } else if (newSlot.duration < existingSlot.duration) {
    // Split existing slot into two parts
    slotsCopy[existingIndex].duration -= newSlot.duration;
    slotsCopy[existingIndex].beat += newSlot.duration;
    slotsCopy.splice(existingIndex - 1, 0, newSlot);
  } else {
    // Consume subsequent slots if needed
    let remainingDuration = newSlot.duration;
    let currentIndex = existingIndex;

    // Calculate how many slots will be consumed
    while (currentIndex < slotsCopy.length && remainingDuration > 0) {
      remainingDuration -= slotsCopy[currentIndex].duration;
      currentIndex++;
    }

    // Handle partial consumption of the last slot
    if (remainingDuration < 0) {
      const lastConsumedSlot = slotsCopy[currentIndex - 1];

      // Add remaining part of the last consumed slot
      slotsCopy.splice(currentIndex, 0, {
        ...lastConsumedSlot,
        beat: newSlot.beat + newSlot.duration,
        duration: -remainingDuration,
      });
    }

    // Remove consumed slots and insert new slot
    slotsCopy.splice(existingIndex, currentIndex - existingIndex, newSlot);
  }

  return slotsCopy.sort((a, b) => a.beat - b.beat);
}

const initialState: Score = {
  tempo: 120,
  key: "C3",
  track: {
    slots: [
      {
        beat: 0,
        duration: 4,
        notes: [],
        chord: "",
        lyrics: "",
        comment: "",
      },
    ],
  },
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

    // Slot operations
    setSlot(state, action: PayloadAction<Slot>) {
      state.track.slots = replaceOrInsertSlot(state.track.slots, action.payload);
      const lastSlot = state.track.slots[state.track.slots.length - 1];

      // Add empty slot if needed
      if (lastSlot.notes.length > 0 || lastSlot.chord || lastSlot.lyrics || lastSlot.comment) {
        state.track.slots.push({
          beat: lastSlot.beat + lastSlot.duration,
          duration: 4 - ((lastSlot.beat + lastSlot.duration) % 4),
          notes: [],
          chord: "",
          lyrics: "",
          comment: "",
        });
      }
    },

    // Clear operations
    clearTrack(state) {
      state.track.slots = [];
    },

    clearScore(state) {
      state.track.slots = [];
    },
  },
});

export const { setTempo, setKey, setSlot, clearTrack, clearScore } = newScoreSlice.actions;

export default newScoreSlice.reducer;
