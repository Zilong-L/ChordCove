import KeySelector from "./KeySelector";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { setSlot, slotHelpers } from "@stores/scoreSlice";
import type { Score, Slot } from "@stores/scoreSlice";
import {
  setSelectedDuration,
  toggleDotted,
  setEditingBeat,
  setLastInputNote,
} from "@stores/editingSlice";
import type { EditingSlotState } from "@stores/editingSlice";
import EditorControlPanel, { durationValues, type NoteDuration } from "./EditorControlPanel";
import BarView from "./BarView";
import ScorePlayer from "./ScorePlayer";
import { Note } from "tonal";

export default function SimpleEditor() {
  const dispatch = useDispatch();

  // Get states from Redux
  const { editingBeat, editingTrack, selectedDuration, isDotted, lastInputNote } = useSelector(
    (state: RootState) => state.editing as EditingSlotState
  );

  const score = useSelector((state: RootState) => state.score as Score);
  const currentTrack = score.tracks[editingTrack];

  // Calculate current beat position
  const currentBeat = editingBeat;

  // Handle input via keyboard
  useHotkeys("*", (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    // Get existing slot or create a new one
    const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat);
    if (!existingSlot) return;

    // Let the slot handle the input
    const result = slotHelpers.handleInput(existingSlot, event, score.key, lastInputNote);
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
    } else if (currentTrack.type === "chords") {
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
    const currentIndex = currentTrack.slots.findIndex((slot: Slot) => slot.beat === editingBeat);
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
    const currentIndex = currentTrack.slots.findIndex((slot: Slot) => slot.beat === editingBeat);
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
    if (!existingSlot || existingSlot.type !== "melody" || !existingSlot.note) return;

    const currentNote = Note.get(existingSlot.note);
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
    if (!existingSlot || existingSlot.type !== "melody" || !existingSlot.note) return;

    const currentNote = Note.get(existingSlot.note);
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
    } else if (currentTrack.type === "chords") {
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

  return (
    <div className="relative flex gap-6 text-[var(--text-primary)]">
      {/* Main Content */}
      <div className="h-[calc(100vh-4rem)] flex-1 overflow-auto">
        {/* Score Display */}
        <div className="top-0 z-10 w-full rounded-md bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] p-8">
          {/* Header Info */}
          <div className="mb-6 flex items-center gap-4">
            <KeySelector />
            <div className="flex items-center gap-2">
              <span>Tempo:</span>
              <span>{score.tempo}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Current Position:</span>
              <span>Beat {currentBeat}</span>
            </div>
            <ScorePlayer />
          </div>

          {/* Bar View */}
          <div className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Bar View</h3>
            <BarView />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="sticky top-0 h-screen w-64 shrink-0 overflow-auto py-4">
        <EditorControlPanel />
      </div>
    </div>
  );
}
