import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { Note } from "tonal";
import { getNoteInKey, findCloestNote } from "@utils/theory/Note";
import { keyMap } from "@utils/theory/Note";
import { type NoteDuration, durationValues } from "#types/sheet";
import {
  setEditingBeat,
  setLastInputNote,
  setSelectedDuration,
  toggleDotted,
} from "@stores/editingSlice";
import { RootState } from "@stores/store";
import { Slot, type Score, setSlot, TrackType, MelodySlot } from "@stores/scoreSlice";
import type { EditingSlotState } from "@stores/editingSlice";

export function useKeyInputs() {
  const dispatch = useDispatch();

  // Get states from Redux
  const { editingBeat, editingTrack, selectedDuration, isDotted, lastInputNote } = useSelector(
    (state: RootState) => state.editing as EditingSlotState
  );

  const score = useSelector((state: RootState) => state.score as Score);
  const currentTrack = score.tracks[editingTrack];
  const currentBeat = editingBeat;

  // Handle input via keyboard
  useHotkeys("*", (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    // Get existing slot or create a new one
    const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat);
    if (!existingSlot) return;

    // Let the slot handle the input
    const result = handleInput(existingSlot, event, score.key, lastInputNote, currentTrack.type);
    if (!result) return;

    event.preventDefault();

    // Calculate actual duration in beats
    const baseDuration = durationValues[selectedDuration as NoteDuration];
    const duration = isDotted ? baseDuration * 1.5 : baseDuration;

    // Update the slot with new content based on track type
    const updatedSlot = {
      ...existingSlot,
      beat: currentBeat,
      duration,
    };

    if (currentTrack.type === "melody") {
      Object.assign(updatedSlot, { note: result.content });
      // Update last input note for melody
      dispatch(setLastInputNote(result.content));
    } else if (currentTrack.type === "chord") {
      Object.assign(updatedSlot, { chord: result.content });
    } else if (currentTrack.type === "lyrics") {
      Object.assign(updatedSlot, { lyrics: result.content });
    }

    dispatch(
      setSlot({
        trackId: currentTrack.id,
        slot: updatedSlot,
      })
    );

    // Move cursor if needed
    if (result.shouldMoveCursor) {
      dispatch(setEditingBeat(currentBeat + duration));
    }
  });

  // Add keyboard shortcuts for durations
  useHotkeys("q,w,e,r,t,y", (event, handler) => {
    event.preventDefault();
    const durationMap: Record<string, NoteDuration> = {
      q: 1, // whole note
      w: 2, // half note
      e: 4, // quarter note
      r: 8, // eighth note
      t: 16, // sixteenth note
      y: 32, // thirty-second note
    };
    const pressedKey = handler.keys![0];
    dispatch(setSelectedDuration(durationMap[pressedKey]));
  });

  // Add keyboard shortcut for dotted notes
  useHotkeys("d", () => {
    dispatch(toggleDotted());
  });

  // Add keyboard shortcuts for navigation
  useHotkeys("left", (event) => {
    event.preventDefault();
    const currentIndex = currentTrack.slots.findIndex((slot) => slot.beat === editingBeat);
    if (currentIndex === 0) {
      dispatch(setEditingBeat(0));
    } else if (currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      dispatch(setEditingBeat(currentTrack.slots[previousIndex].beat));
    } else {
      dispatch(setEditingBeat(currentTrack.slots[currentTrack.slots.length - 1].beat));
    }
  });

  useHotkeys("right", (event) => {
    event.preventDefault();
    const currentIndex = currentTrack.slots.findIndex((slot) => slot.beat === editingBeat);
    if (currentIndex < currentTrack.slots.length - 1) {
      const nextIndex = currentIndex + 1;
      if (nextIndex < currentTrack.slots.length) {
        dispatch(setEditingBeat(currentTrack.slots[nextIndex].beat));
      }
    }
  });

  // Enable up/down navigation between tracks
  useHotkeys("up", (event) => {
    event.preventDefault();
    const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat);
    if (!existingSlot || currentTrack.type !== "melody" || !existingSlot.note) return;

    const currentNote = Note.get((existingSlot as MelodySlot).note);
    if (!currentNote.midi) return;

    const newNote = Note.fromMidi(currentNote.midi + 1);
    if (!newNote) return;

    dispatch(
      setSlot({
        trackId: currentTrack.id,
        slot: {
          ...existingSlot,
          note: newNote,
        },
      })
    );
    dispatch(setLastInputNote(newNote));
  });

  useHotkeys("down", (event) => {
    event.preventDefault();
    const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat);
    if (!existingSlot || currentTrack.type !== "melody") return;

    const currentNote = Note.get((existingSlot as MelodySlot).note);
    if (!currentNote.midi) return;

    const newNote = Note.fromMidi(currentNote.midi - 1);
    if (!newNote) return;

    dispatch(
      setSlot({
        trackId: currentTrack.id,
        slot: {
          ...existingSlot,
          note: newNote,
        },
      })
    );
    dispatch(setLastInputNote(newNote));
  });

  // Add keyboard shortcut for deleting content
  useHotkeys("backspace,delete", (event) => {
    event.preventDefault();
    const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat);
    if (!existingSlot) return;

    // Get the duration of the slot to be deleted
    const deletedDuration = existingSlot.duration;

    // Find all slots after the current beat
    const subsequentSlots = currentTrack.slots.filter((slot) => slot.beat > currentBeat);

    // Update each subsequent slot's beat position
    subsequentSlots.forEach((slot) => {
      dispatch(
        setSlot({
          trackId: currentTrack.id,
          slot: {
            ...slot,
            beat: slot.beat - deletedDuration,
          },
        })
      );
    });

    // Clear content of the current slot
    const updatedSlot = {
      ...existingSlot,
      beat: currentBeat,
    };

    if (currentTrack.type === "melody") {
      Object.assign(updatedSlot, { note: "" });
    } else if (currentTrack.type === "chord") {
      Object.assign(updatedSlot, { chord: "" });
    } else if (currentTrack.type === "lyrics") {
      Object.assign(updatedSlot, { lyrics: "" });
    }

    dispatch(
      setSlot({
        trackId: currentTrack.id,
        slot: updatedSlot,
      })
    );
  });
}

function handleInput(
  slot: Slot,
  event: KeyboardEvent,
  key: string,
  lastInputNote: string,
  trackType: TrackType
): { content: string; shouldMoveCursor: boolean } | null {
  let pressedKey: string;
  let degreeIndex: number | undefined;
  let rotatedScale: string[];
  let targetNoteLetter: string | undefined;
  let finalNote: string | null;

  switch (trackType) {
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
}
