import KeySelector from "./KeySelector";
import { getNoteInKey, findCloestNote, keyMap } from "@utils/theory/Note";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { setSlot } from "@stores/newScore/newScoreSlice";
import type { Score, Slot } from "@stores/newScore/newScoreSlice";
import {
  setSelectedDuration,
  toggleDotted,
  setLastInputNote,
  setEditingBeat,
} from "@stores/newScore/newEditingSlice";
import type { EditingSlotState } from "@stores/newScore/newEditingSlice";
import EditorControlPanel, { durationValues, type NoteDuration } from "./EditorControlPanel";
import BarView from "./BarView";
import ScorePlayer from "./ScorePlayer";
import { useState, useCallback } from "react";

export default function SimpleEditor() {
  const dispatch = useDispatch();
  const [lyricsInput, setLyricsInput] = useState("");

  // Get states from Redux
  const { editingBeat, selectedDuration, isDotted, lastInputNote, editingMode } = useSelector(
    (state: RootState) => state.newEditing as EditingSlotState
  );

  const score = useSelector((state: RootState) => state.newScore as Score);
  const currentTrack = score.track;

  // Calculate current beat position
  const currentBeat = editingBeat;

  // Handle note input via keyboard with accidentals
  useHotkeys(Object.entries(keyMap).join(","), (event, handler) => {
    if (editingMode !== "notes") return;

    event.preventDefault();
    let pressedKey = handler.keys![0];
    if (handler.ctrl && handler.alt) {
      pressedKey = "ctrl+alt+" + pressedKey;
    }
    const degreeIndex = keyMap[pressedKey];
    if (degreeIndex === undefined) return;
    const rotatedScale = getNoteInKey(score.key);
    const targetNoteLetter = rotatedScale[degreeIndex];

    if (!targetNoteLetter) return;

    const finalNote = findCloestNote(lastInputNote, targetNoteLetter);
    if (!finalNote) return;

    // Calculate actual duration in beats
    const baseDuration = durationValues[selectedDuration as NoteDuration];
    const duration = isDotted ? baseDuration * 1.5 : baseDuration;

    // Get existing slot to preserve other properties
    const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat) || {
      beat: currentBeat,
      duration,
      notes: [],
      chord: "",
      lyrics: "",
      comment: "",
    };

    // Add new note using Redux actions
    dispatch(
      setSlot({
        ...existingSlot,
        beat: currentBeat,
        duration,
        notes: [finalNote],
      })
    );

    dispatch(setLastInputNote(finalNote));
    dispatch(setEditingBeat(currentBeat + duration));
  });

  // Handle lyrics input
  const handleLyricsInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLyricsInput(e.target.value);
  }, []);

  const handleLyricsInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && lyricsInput.trim()) {
        e.preventDefault();

        // Get existing slot to preserve other properties
        const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat) || {
          beat: currentBeat,
          duration: durationValues[4], // Default to quarter note duration
          notes: [],
          chord: "",
          lyrics: "",
          comment: "",
        };

        // Update the slot with new lyrics
        dispatch(
          setSlot({
            ...existingSlot,
            lyrics: lyricsInput.trim(),
          })
        );

        // Clear input and move to next beat
        setLyricsInput("");
        dispatch(setEditingBeat(currentBeat + existingSlot.duration));
      }
    },
    [currentBeat, currentTrack.slots, dispatch, lyricsInput]
  );

  // Add keyboard shortcuts for durations
  useHotkeys("q,w,e,r,t,y", (event, handler) => {
    if (editingMode !== "notes") return;

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
    if (editingMode !== "notes") return;
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

  // Remove up/down navigation since we only have one track now
  useHotkeys("up", (event) => {
    event.preventDefault();
  });

  useHotkeys("down", (event) => {
    event.preventDefault();
  });

  // Add keyboard shortcut for deleting content
  useHotkeys("backspace,delete", (event) => {
    event.preventDefault();

    // Get existing slot to preserve other properties
    const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat) || {
      beat: currentBeat,
      duration: durationValues[4], // Default to quarter note duration
      notes: [],
      chord: "",
      lyrics: "",
      comment: "",
    };

    // Clear the appropriate content based on editing mode
    dispatch(
      setSlot({
        ...existingSlot,
        ...(editingMode === "notes" && { notes: [] }),
        ...(editingMode === "lyrics" && { lyrics: "" }),
        ...(editingMode === "chords" && { chord: "" }),
        ...(editingMode === "comments" && { comment: "" }),
      })
    );
  });

  return (
    <div className="relative flex h-[calc(100vh-4rem)] gap-6 text-gray-200">
      {/* Main Content */}
      <div className="flex-1">
        {/* Score Display */}
        <div className="w-full rounded-md bg-gradient-to-b from-[#212121] to-[#121212] p-8">
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
            <h3 className="mb-2 text-lg font-semibold">Bar View</h3>
            <BarView />
          </div>

          {/* Lyrics Input */}
          {editingMode === "lyrics" && (
            <div className="mb-6">
              <h3 className="mb-2 text-lg font-semibold">Lyrics Input</h3>
              <input
                type="text"
                value={lyricsInput}
                onChange={handleLyricsInputChange}
                onKeyDown={handleLyricsInputKeyDown}
                placeholder="Type lyrics and press Enter..."
                className="w-full rounded border border-gray-700 bg-[#2a2a2a] px-4 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Key Color Legend */}
        </div>
      </div>

      {/* Right Sidebar - Control Panel */}
      <div className="w-64 shrink-0 rounded-md bg-[#1a1a1a] p-4">
        <div className="sticky top-4">
          <h3 className="mb-4 text-lg font-semibold">Controls</h3>
          <div className="space-y-4">
            <div className="rounded bg-[#212121] p-3">
              <div className="mb-2 text-sm text-gray-400">Current Duration</div>
              <div className="font-medium">
                {durationValues[selectedDuration as NoteDuration]} {isDotted ? "(dotted)" : ""}{" "}
                beats
              </div>
            </div>
            <EditorControlPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
