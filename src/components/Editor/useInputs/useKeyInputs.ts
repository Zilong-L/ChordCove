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
  const { editingBeat, editingTrack, selectedDuration, isDotted, lastInputNote, isRecording } =
    useSelector((state: RootState) => state.editing as EditingSlotState);

  const score = useSelector((state: RootState) => state.score as Score);
  const currentTrack = score.tracks[editingTrack];
  const currentBeat = editingBeat;

  // Handle input via keyboard
  useHotkeys("1,2,3,4,5,6,7", (event) => {
    event.preventDefault();
    if (event.ctrlKey || event.altKey || event.metaKey || isRecording) return;
    const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat);
    if (!existingSlot) return;

    // Let the slot handle the input

    // Handle note input via keyboard with accidentals
    let finalNote = null;
    let pressedKey = event.key;
    if (event.ctrlKey && event.altKey) {
      pressedKey = "ctrl+alt+" + pressedKey;
    }
    const degreeIndex = keyMap[pressedKey];
    if (degreeIndex !== undefined) {
      const rotatedScale = getNoteInKey(score.key.split(/\d/)[0]);
      const targetNoteLetter = rotatedScale[degreeIndex];
      if (targetNoteLetter) {
        finalNote = findCloestNote(lastInputNote, targetNoteLetter);
      }
    }
    if (!finalNote) return;

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
      Object.assign(updatedSlot, { note: finalNote });
      // Update last input note for melody
      dispatch(setLastInputNote(finalNote));
      dispatch(
        setSlot({
          trackId: currentTrack.id,
          slot: updatedSlot,
        })
      );
      dispatch(setEditingBeat(currentBeat + duration));
    }
  });

  // Add keyboard shortcuts for durations
  useHotkeys("q,w,e,r,t,y", (event, handler) => {
    event.preventDefault();
    if (isRecording) return;
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
    if (isRecording) return;
    dispatch(toggleDotted());
  });

  // Add keyboard shortcuts for navigation
  useHotkeys("left", (event) => {
    event.preventDefault();
    if (isRecording) return;
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
    if (isRecording) return;
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
    if (isRecording) return;
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
    if (isRecording) return;
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
    if (isRecording) return;
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
