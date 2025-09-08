// store/scoreSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type TrackType = "melody" | "accompaniment" | "notes";

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

export interface BaseSlot {
  beat: number;
  duration: number;
  comment: string;
  dirty?: boolean;
}

// Specialized slot types
export interface MelodySlot extends BaseSlot {
  note: string; // Single note
  lyrics?: string; // Optional lyrics for the note
}

export interface NotesSlot extends BaseSlot {
  notes: string[]; // Multiple notes for chords
}

export interface AccompanimentSlot extends BaseSlot {
  notes: string[]; // Multiple notes for accompaniment
}

export interface ChordSlot extends BaseSlot {
  chord: string; // Chord symbol
}

// Union type for all slot types
export type Slot = MelodySlot | NotesSlot | AccompanimentSlot | ChordSlot;

// Helper functions for slot operations
export const slotHelpers = {
  isEmpty(type: TrackType, slot: Slot): boolean {
    switch (type) {
      case "melody":
        return !(slot as MelodySlot).note;
      case "notes":
        return !(slot as NotesSlot).notes.length;
      case "accompaniment":
        return (slot as AccompanimentSlot).notes.length === 0;
      default:
        return false;
    }
  },
  isCorrectSlot(slot: Slot, trackType: TrackType): boolean {
    switch (trackType) {
      case "melody":
        return Object.prototype.hasOwnProperty.call(slot, "note");
      case "notes":
        return Object.prototype.hasOwnProperty.call(slot, "notes");
      case "accompaniment":
        return Object.prototype.hasOwnProperty.call(slot, "notes");
      default:
        return false;
    }
  },
};

// Helper function to create empty slots
export function createEmptySlot(type: TrackType, beat: number, duration: number): Slot {
  const baseSlot = { beat, duration, comment: "" };
  switch (type) {
    case "melody":
      return { ...baseSlot, note: "" };
    case "notes":
      return { ...baseSlot, notes: [] };
    case "accompaniment":
      return { ...baseSlot, notes: [] };
    default:
      throw new Error(`Unknown track type: ${type}`);
  }
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
        lyrics: (data as Partial<MelodySlot>).lyrics,
      };
    case "notes":
      return {
        ...baseSlot,
        notes: (data as Partial<NotesSlot>).notes || [],
      };
    case "accompaniment":
      return {
        ...baseSlot,
        notes: (data as Partial<AccompanimentSlot>).notes || [],
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
  let existingIndex = slots.findIndex((s) => s.beat === newSlot.beat);
  console.log(newSlot);
  if (existingIndex === -1) {
    console.log("pushing");
    // Simple insertion
    slots.push({
      ...newSlot,
      duration: 0,
    });
    slots.sort((a, b) => a.beat - b.beat);
    existingIndex = slots.findIndex((s) => s.beat === newSlot.beat);
    if (existingIndex !== 0) {
      const previousSlot = slots[existingIndex - 1];
      previousSlot.duration = newSlot.beat - previousSlot.beat;
    }
  }
  const existingSlot = slots[existingIndex];
  const slotsCopy = slots;

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

  return slotsCopy.sort((a, b) => a.beat - b.beat).filter((s) => s.duration > 0);
}

const initialState: Score = {
  tempo: 60,
  key: "C3",
  tracks: [
    {
      id: "melody1",
      type: "melody",
      slots: [createEmptySlot("melody", 0, 4)],
    },
    {
      id: "accompaniment1",
      type: "accompaniment",
      slots: [createEmptySlot("accompaniment", 0, 4)],
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
    pushSlot(state, action: PayloadAction<{ trackId: string; slot: Slot }>) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId);
      if (!track) return;
      const starttingbeat = action.payload.slot.beat;
      const duration = action.payload.slot.duration;
      track.slots = track.slots.filter(
        (s) => s.beat + s.duration <= starttingbeat || s.beat >= starttingbeat + duration || s.dirty
      );
      //remove overlapping slots
      track.slots.push(action.payload.slot);
    },
    // Slot operations
    setSlot(state, action: PayloadAction<{ trackId: string; slot: Slot; modifyOnly?: boolean }>) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId);
      if (!track) return;
      if (!slotHelpers.isCorrectSlot(action.payload.slot, track.type)) return;
      console.log("setSlot", action.payload.slot);
      if (action.payload.modifyOnly) {
        const currentSlot = track.slots.find((s) => s.beat === action.payload.slot.beat);
        const duration = currentSlot?.duration;
        if (!currentSlot || !duration) return;
        Object.assign(currentSlot, action.payload.slot);
        currentSlot.duration = duration;
        return;
      } else {
        const tmp = replaceOrInsertSlot(track.slots, action.payload.slot);
        track.slots = tmp;
      }
      const lastSlot = track.slots[track.slots.length - 1];
      if (!slotHelpers.isEmpty(track.type, lastSlot)) {
        console.log(track.slots);
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
    clearDirtyBit(state) {
      for (const track of state.tracks) {
        for (const slot of track.slots) {
          slot.dirty = false;
        }
      }
    },

    clearScore(state) {
      state.tracks.forEach((track) => {
        const emptySlot = createEmptySlot(track.type, 0, 4);
        track.slots = emptySlot ? [emptySlot] : [];
      });
    },
    setScore(state, action: PayloadAction<Score>) {
      state.key = action.payload.key;
      state.tempo = action.payload.tempo;
      state.tracks = action.payload.tracks;
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

export const {
  setTempo,
  setKey,
  setSlot,
  clearTrack,
  clearScore,
  setScore,
  addTrack,
  removeTrack,
  pushSlot,
  clearDirtyBit,
} = scoreSlice.actions;
export { initialState };
export default scoreSlice.reducer;
