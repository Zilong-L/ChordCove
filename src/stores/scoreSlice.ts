// store/scoreSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getNoteInKey, findCloestNote } from "@utils/theory/Note";
import { keyMap } from "@utils/theory/Note";

// Base slot type with common properties
export interface BaseSlot {
  beat: number;
  duration: number;
  comment: string;
}

// Specialized slot types
export interface MelodySlot extends BaseSlot {
  type: "melody";
  note: string; // Single note
  sustain?: boolean;
}

export interface ChordSlot extends BaseSlot {
  type: "chord";
  chord: string; // Chord symbol
}

export interface LyricsSlot extends BaseSlot {
  type: "lyrics";
  text: string; // Lyrics text
}

// Union type for all slot types
export type Slot = MelodySlot | ChordSlot | LyricsSlot;

// Helper functions for slot operations
export const slotHelpers = {
  isEmpty(slot: Slot): boolean {
    switch (slot.type) {
      case "melody":
        return !slot.note;
      case "chord":
        return !slot.chord;
      case "lyrics":
        return !slot.text;
    }
  },

  handleInput(
    slot: Slot,
    event: KeyboardEvent,
    key: string,
    lastInputNote: string
  ): { content: string; shouldMoveCursor: boolean } | null {
    let pressedKey: string;
    let degreeIndex: number | undefined;
    let rotatedScale: string[];
    let targetNoteLetter: string | undefined;
    let finalNote: string | null;

    switch (slot.type) {
      case "melody":
        // Handle note input via keyboard with accidentals
        pressedKey = event.key;
        if (event.ctrlKey && event.altKey) {
          pressedKey = "ctrl+alt+" + pressedKey;
        }
        degreeIndex = keyMap[pressedKey];
        if (degreeIndex !== undefined) {
          rotatedScale = getNoteInKey(key.split(/\d/)[0]);
          targetNoteLetter = rotatedScale[degreeIndex];
          if (targetNoteLetter) {
            finalNote = findCloestNote(lastInputNote, targetNoteLetter);
            if (finalNote) {
              return { content: finalNote, shouldMoveCursor: true };
            }
          }
        }
        break;

      case "chord":
        // Handle chord root notes (A-G)
        if (/^[A-Ga-g]$/.test(event.key)) {
          return { content: event.key.toUpperCase(), shouldMoveCursor: false };
        }
        // Handle chord modifiers (m, 7, maj, etc.)
        if (/^[m7Mdij]$/.test(event.key)) {
          return { content: event.key, shouldMoveCursor: false };
        }
        // Handle accidentals
        if (event.key === "#" || event.key === "b") {
          return { content: event.key, shouldMoveCursor: false };
        }
        break;

      case "lyrics":
        // Handle any printable character for lyrics
        if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
          return { content: event.key, shouldMoveCursor: false };
        }
        // Handle space
        if (event.key === " ") {
          return { content: " ", shouldMoveCursor: true };
        }
        break;
    }

    // Handle backspace for all types
    if (event.key === "Backspace") {
      return { content: "", shouldMoveCursor: false };
    }

    return null;
  },
};

// Helper function to create empty slots based on track type
export function createEmptySlot(type: TrackType, beat: number, duration: number): Slot {
  const baseSlot = {
    beat,
    duration,
    comment: "",
  };

  switch (type) {
    case "melody":
      return { ...baseSlot, type: "melody", note: "", sustain: false };
    case "chords":
      return { ...baseSlot, type: "chord", chord: "" };
    case "lyrics":
      return { ...baseSlot, type: "lyrics", text: "" };
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
        type: "melody",
        note: (data as Partial<MelodySlot>).note || "",
        sustain: (data as Partial<MelodySlot>).sustain || false,
      };
    case "chords":
      return {
        ...baseSlot,
        type: "chord",
        chord: (data as Partial<ChordSlot>).chord || "",
      };
    case "lyrics":
      return {
        ...baseSlot,
        type: "lyrics",
        text: (data as Partial<LyricsSlot>).text || "",
      };
    default:
      throw new Error(`Unknown track type: ${type}`);
  }
}

export type TrackType = "melody" | "accompaniment" | "lyrics" | "chords";

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
    setSlot(state, action: PayloadAction<{ trackId: string; slot: Slot }>) {
      const track = state.tracks.find((t) => t.id === action.payload.trackId);
      if (!track) return;

      if (action.payload.slot.type !== track.type) {
        console.error(
          `Slot type ${action.payload.slot.type} does not match track type ${track.type}`
        );
        return;
      }

      track.slots = replaceOrInsertSlot(track.slots, action.payload.slot);
      const lastSlot = track.slots[track.slots.length - 1];

      if (!slotHelpers.isEmpty(lastSlot)) {
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
