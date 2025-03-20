import KeySelector from "./KeySelector";
import { getNoteInKey, findCloestNote, keyMap } from "@utils/theory/Note";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { setNote } from "@stores/newScore/newScoreSlice";
import type { NewScore } from "@stores/newScore/newScoreSlice";
import {
  setSelectedDuration,
  toggleDotted,
  setLastInputNote,
  setEditingBeat,
  setEditingTrack,
} from "@stores/newScore/newEditingSlice";
import type { EditingSlotState } from "@stores/newScore/newEditingSlice";
import EditorControlPanel, { durationValues, type NoteDuration } from "./EditorControlPanel";
import BarView from "./BarView";
import ScorePlayer from "./ScorePlayer";

export default function SimpleEditor() {
  const dispatch = useDispatch();

  // Get states from Redux
  const { editingTrack, editingBeat, selectedDuration, isDotted, lastInputNote } = useSelector(
    (state: RootState) => state.newEditing as EditingSlotState
  );

  const score = useSelector((state: RootState) => state.newScore as NewScore);
  const currentTrack = score.tracks[editingTrack];

  // Calculate current beat position
  const currentBeat = editingBeat;

  // Handle note input via keyboard with accidentals
  useHotkeys(Object.entries(keyMap).join(","), (event, handler) => {
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

    // Add new note using Redux actions
    dispatch(
      setNote({
        trackIndex: editingTrack,
        note: {
          beat: currentBeat,
          duration,
          content: finalNote,
        },
      })
    );

    dispatch(setLastInputNote(finalNote));
    dispatch(setEditingBeat(currentBeat + duration));
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
    const currentIndex = currentTrack.notes.findIndex((note) => note.beat === editingBeat);
    if (currentIndex === 0) {
      dispatch(setEditingBeat(0));
    } else if (currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      dispatch(setEditingBeat(currentTrack.notes[previousIndex].beat));
    } else {
      dispatch(setEditingBeat(currentTrack.notes[currentTrack.notes.length - 1].beat));
    }
  });

  useHotkeys("right", (event) => {
    event.preventDefault();

    const currentIndex = currentTrack.notes.findIndex((note) => note.beat === editingBeat);
    if (currentIndex < currentTrack.notes.length - 1) {
      const nextIndex = currentIndex + 1;
      if (nextIndex < currentTrack.notes.length) {
        dispatch(setEditingBeat(currentTrack.notes[nextIndex].beat));
      }
    }
  });

  useHotkeys("up", (event) => {
    event.preventDefault();
    if (editingTrack > 0) {
      dispatch(setEditingTrack(editingTrack - 1));
    }
  });

  useHotkeys("down", (event) => {
    event.preventDefault();
    if (editingTrack < score.tracks.length - 1) {
      dispatch(setEditingTrack(editingTrack + 1));
    }
  });

  // Add keyboard shortcut for deleting notes
  useHotkeys("backspace,delete", (event) => {
    event.preventDefault();
    dispatch(
      setNote({
        trackIndex: editingTrack,
        note: {
          beat: editingBeat,
          duration: 0,
          content: "",
        },
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

          {/* Linear View */}

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
