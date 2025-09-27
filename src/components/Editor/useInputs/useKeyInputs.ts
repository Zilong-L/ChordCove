import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react";
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
import { snapToGrid } from "@utils/snap";
import { type Score, setSlot, MelodySlot } from "@stores/scoreSlice";
import type { EditingSlotState } from "@stores/editingSlice";

export function useKeyInputs() {
  const dispatch = useDispatch();

  // Get states from Redux
  const {
    editingBeat,
    editingTrack,
    selectedDuration,
    isDotted,
    lastInputNote,
    isRecording,
    recordingSnapType,
  } = useSelector((state: RootState) => state.editing as EditingSlotState);

  const score = useSelector((state: RootState) => state.score as Score);
  const currentTrack = score.tracks[editingTrack];
  const currentBeat = editingBeat;

  // Refs for recording-mode keyboard handling
  const pressingRef = useRef<null | { key: string; startTime: number; startBeat: number }>(null);
  const lastInputNoteRef = useRef(lastInputNote);
  const recordingSnapTypeRef = useRef(recordingSnapType);
  const tempoRef = useRef(score.tempo);
  const currentTrackRef = useRef(currentTrack);
  const currentBeatRef = useRef(currentBeat);
  useEffect(() => {
    lastInputNoteRef.current = lastInputNote;
  }, [lastInputNote]);
  useEffect(() => {
    recordingSnapTypeRef.current = recordingSnapType;
  }, [recordingSnapType]);
  useEffect(() => {
    tempoRef.current = score.tempo;
  }, [score.tempo]);
  useEffect(() => {
    currentTrackRef.current = score.tracks[editingTrack];
  }, [score.tracks, editingTrack]);
  useEffect(() => {
    currentBeatRef.current = editingBeat;
  }, [editingBeat]);

  // Handle input via keyboard (non-recording immediate entry)
  useHotkeys("1,2,3,4,5,6,7", (event) => {
    event.preventDefault();
    if ((event as KeyboardEvent).repeat) return;
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

  // Recording mode: allow keyboard realtime input with snapping (like MIDI)
  useEffect(() => {
    if (!isRecording) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      if (target.isContentEditable) return true;
      return false;
    };

    const VALID = new Set(["0", "1", "2", "3", "4", "5", "6", "7"]);

    const finalizePressing = (now: number) => {
      const pressing = pressingRef.current;
      if (!pressing) return;
      const track = currentTrackRef.current;
      if (!track || track.type !== "melody") {
        pressingRef.current = null;
        return;
      }
      const beatDuration = (60 / (tempoRef.current || 120)) * 1000;
      const rawBeats = (now - pressing.startTime) / beatDuration;
      const snappedBeats = snapToGrid(rawBeats, recordingSnapTypeRef.current);
      const beatPosition = pressing.startBeat;

      // Build slot content
      if (pressing.key === "0") {
        const updatedSlot = {
          beat: beatPosition,
          duration: snappedBeats,
          note: "",
          lyrics: "",
        } as MelodySlot;
        dispatch(setSlot({ trackId: track.id, slot: updatedSlot }));
        dispatch(setEditingBeat(beatPosition + snappedBeats));
      } else {
        // Map degree to closest note
        const keyLabel = pressing.key;
        const degreeIndex = keyMap[keyLabel as keyof typeof keyMap];
        if (degreeIndex === undefined) {
          pressingRef.current = null;
          return;
        }
        const rotatedScale = getNoteInKey(score.key.split(/\d/)[0]);
        const targetNoteLetter = rotatedScale[degreeIndex];
        const finalNote = targetNoteLetter
          ? findCloestNote(lastInputNoteRef.current, targetNoteLetter)
          : "";
        if (!finalNote) {
          pressingRef.current = null;
          return;
        }

        const updatedSlot = {
          beat: beatPosition,
          duration: snappedBeats,
          note: finalNote,
          lyrics: "",
          dirty: true,
        } as const;
        dispatch(setSlot({ trackId: track.id, slot: updatedSlot }));
        dispatch(setLastInputNote(finalNote));
        dispatch(setEditingBeat(beatPosition + snappedBeats));
      }
      pressingRef.current = null;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (!VALID.has(e.key)) return;
      e.preventDefault();
      if (e.repeat) return; // ignore auto-repeated keydown while holding

      const track = currentTrackRef.current;
      if (!track || track.type !== "melody") return;

      // Prepare key label with modifiers for accidentals (Ctrl+Alt)
      let keyLabel = e.key;
      if (keyLabel !== "0" && e.ctrlKey && e.altKey) {
        keyLabel = "ctrl+alt+" + keyLabel;
      }

      // If same key is already being held, ignore; otherwise finalize previous and start new
      if (pressingRef.current) {
        if (pressingRef.current.key === keyLabel) return;
        finalizePressing(performance.now());
      }

      pressingRef.current = {
        key: keyLabel,
        startTime: performance.now(),
        startBeat: currentBeatRef.current,
      };
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (!VALID.has(e.key)) return;
      e.preventDefault();
      const pressing = pressingRef.current;
      if (!pressing) return;

      // Only finalize if it matches the same logical key (consider Ctrl+Alt mapping)
      let keyLabel = e.key;
      if (keyLabel !== "0" && e.ctrlKey && e.altKey) keyLabel = "ctrl+alt+" + keyLabel;
      if (keyLabel !== pressing.key) return;

      finalizePressing(performance.now());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      pressingRef.current = null;
    };
  }, [isRecording, dispatch, score.key]);

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

  // Add keyboard shortcut for rest input (0)
  useHotkeys("0", (event) => {
    event.preventDefault();
    if ((event as KeyboardEvent).repeat) return;
    if (isRecording) return;
    const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat);
    if (!existingSlot) return;
    // Calculate duration in beats
    const baseDuration = durationValues[selectedDuration as NoteDuration];
    const duration = isDotted ? baseDuration * 1.5 : baseDuration;

    if (currentTrack.type === "melody") {
      const updatedSlot = {
        ...existingSlot,
        beat: currentBeat,
        duration,
        note: "",
      } as MelodySlot;
      dispatch(
        setSlot({
          trackId: currentTrack.id,
          slot: updatedSlot,
        })
      );
      dispatch(setEditingBeat(currentBeat + duration));
    }
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
    if (!existingSlot || currentTrack.type !== "melody" || !("note" in existingSlot)) return;

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
    } else if (currentTrack.type === "accompaniment") {
      Object.assign(updatedSlot, { notes: [] });
    }

    dispatch(
      setSlot({
        trackId: currentTrack.id,
        slot: updatedSlot,
      })
    );
  });
}
