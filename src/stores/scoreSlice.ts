// store/scoreSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export type TrackType = "melody" | "accompaniment" | "lyrics" | "chord";

export interface Track {
  id: string;
  type: TrackType;
  slots: Slot[];
}

export interface Score {
  tracks: Track[];
  tempo: number;
  key: string;
}
// Base slot type with common properties
export interface BaseSlot {
  beat: number;
  duration: number;
  comment: string;
}

// Specialized slot types
export interface MelodySlot extends BaseSlot {
  note: string; // Single note
  sustain?: boolean;
}

export interface ChordSlot extends BaseSlot {
  chord: string; // Chord symbol
}

export interface LyricsSlot extends BaseSlot {
  text: string; // Lyrics text
}

// Union type for all slot types
export type Slot = MelodySlot | ChordSlot | LyricsSlot;

// Helper functions for slot operations
export const slotHelpers = {
  isEmpty(type: TrackType, slot: Slot): boolean {
    switch (type) {
      case "melody":
        return !(slot as MelodySlot).note;
      case "chord":
        return !(slot as ChordSlot).chord;
      case "lyrics":
        return !(slot as LyricsSlot).text;
      default:
        return false;
    }
  },
  isCorrectSlot(slot: Slot, trackType: TrackType): boolean {
    switch (trackType) {
      case "melody":
        return Object.prototype.hasOwnProperty.call(slot, "note");
      case "chord":
        return Object.prototype.hasOwnProperty.call(slot, "chord");
      case "lyrics":
        return Object.prototype.hasOwnProperty.call(slot, "text");
      default:
        return false;
    }
  },
};

// Helper function to create empty slots based on track type
export function createEmptySlot(type: TrackType, beat: number, duration: number): Slot {
  return createSlot(type, { beat, duration });
}

// Helper function to create a slot from raw data
export function createSlot(type: TrackType, data: Partial<Slot>): Slot {
  const { beat = 0, duration = 4, comment = "" } = data;
  const baseSlot = { beat, duration, comment };

  switch (type) {
    case "melody":
      return {
        ...baseSlot,
        note: (data as Partial<MelodySlot>).note || "",
        sustain: (data as Partial<MelodySlot>).sustain || false,
      };
    case "chord":
      return {
        ...baseSlot,
        chord: (data as Partial<ChordSlot>).chord || "",
      };
    case "lyrics":
      return {
        ...baseSlot,
        text: (data as Partial<LyricsSlot>).text || "",
      };
    default:
      throw new Error(`Unknown track type: ${type}`);
  }
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
    slotsCopy.splice(existingIndex, 0, newSlot);
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
  tracks: [
    {
      id: "melody1",
      type: "melody",
      slots: [createEmptySlot("melody", 0, 4)],
    },
    {
      id: "melody2",
      type: "melody",
      slots: [createEmptySlot("melody", 0, 4)],
    },
  ],
};

const scoreSlice = createSlice({
  name: "Score",
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
    setSlot(state, action: PayloadAction<{ trackId: string; slot: Slot; modifyOnly?: boolean }>) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId);
      if (!track) return;
      if (!slotHelpers.isCorrectSlot(action.payload.slot, track.type)) return;
      if (action.payload.modifyOnly) {
        const currentSlot = track.slots.find((s) => s.beat === action.payload.slot.beat);
        const duration = currentSlot?.duration;
        if (!currentSlot || !duration) return;
        Object.assign(currentSlot, action.payload.slot);
        currentSlot.duration = duration;
      } else {
        track.slots = replaceOrInsertSlot(track.slots, action.payload.slot);
      }
      const lastSlot = track.slots[track.slots.length - 1];
      if (!slotHelpers.isEmpty(track.type, lastSlot)) {
        const emptySlot = createEmptySlot(
          track.type,
          lastSlot.beat + lastSlot.duration,
          4 - ((lastSlot.beat + lastSlot.duration) % 4)
        );
        if (emptySlot) {
          track.slots.push(emptySlot);
        }
      }
    },

    // Clear operations
    clearTrack(state, action: PayloadAction<string>) {
      const track = state.tracks.find((t) => t.id === action.payload);
      if (track) {
        const emptySlot = createEmptySlot(track.type, 0, 4);
        track.slots = emptySlot ? [emptySlot] : [];
      }
    },

    clearScore(state) {
      state.tracks.forEach((track) => {
        const emptySlot = createEmptySlot(track.type, 0, 4);
        track.slots = emptySlot ? [emptySlot] : [];
      });
    },

    addTrack(state, action: PayloadAction<Track>) {
      state.tracks.push(action.payload);
    },

    removeTrack(state, action: PayloadAction<number>) {
      if (action.payload >= 0 && action.payload < state.tracks.length) {
        state.tracks.splice(action.payload, 1);
      }
    },
  },
});

export const { setTempo, setKey, setSlot, clearTrack, clearScore, addTrack, removeTrack } =
  scoreSlice.actions;
export default scoreSlice.reducer;
