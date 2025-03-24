// RealTimeInput.tsx
import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../stores/store";
import { setRecording, setLastInputNote } from "@stores/editingSlice";
import { useMetronome } from "./useMetronome";
import { findCloestNote, getNoteInKey, keyMap } from "@utils/theory/Note";
import { setSlot } from "@stores/scoreSlice";

type SnapType = "none" | "eighth" | "sixteenth";

// Snap to grid based on snap type
const snapToGrid = (beat: number, snapType: SnapType): number => {
  if (snapType === "none") return beat;

  const fraction = beat % 1; // Get the fractional part
  const wholeBeat = Math.floor(beat);

  // Snap to nearest fraction based on snap type
  let snappedFraction;
  if (snapType === "eighth") {
    // Snap to 8th notes (0, 0.5)
    if (fraction < 0.25) snappedFraction = 0;
    else if (fraction < 0.75) snappedFraction = 0.5;
    else snappedFraction = 1;
  } else {
    // Snap to 16th notes (0, 0.25, 0.5, 0.75)
    if (fraction < 0.125) snappedFraction = 0;
    else if (fraction < 0.375) snappedFraction = 0.25;
    else if (fraction < 0.625) snappedFraction = 0.5;
    else if (fraction < 0.875) snappedFraction = 0.75;
    else snappedFraction = 1;
  }

  return wholeBeat + snappedFraction;
};

export default function RealTimeInput() {
  const dispatch = useDispatch();
  const score = useSelector((state: RootState) => state.score);
  const editing = useSelector((state: RootState) => state.editing);
  const isRecording = editing.isRecording;
  const lastInputNote = editing.lastInputNote;
  const currentTrack = score.tracks[editing.editingTrack];
  const [startingTime, setStartingTime] = useState<number | null>(null);
  const [inputOffset, setInputOffset] = useState(0); // in milliseconds
  const [snapType, setSnapType] = useState<SnapType>("sixteenth");

  // Calculate beat position from timestamp
  const calculateBeatPosition = useCallback(
    (timestamp: number) => {
      if (!startingTime) return 0;
      // Apply input offset to the elapsed time calculation
      const elapsedTime = timestamp - startingTime - inputOffset;
      const beatDuration = (60 / score.tempo) * 1000; // Convert to milliseconds
      const beatPosition = elapsedTime / beatDuration;
      return snapToGrid(beatPosition, snapType);
    },
    [startingTime, score.tempo, inputOffset, snapType]
  );

  const calculateNoteDuration = useCallback(
    (durationMs: number): string => {
      const beatDuration = (60 / score.tempo) * 1000; // Duration of one beat in ms
      const durationInBeats = durationMs / beatDuration;

      // Define common note durations in beats
      const noteDurations = [
        { beats: 4, name: "whole note" },
        { beats: 2, name: "half note" },
        { beats: 1, name: "quarter note" },
        { beats: 0.5, name: "eighth note" },
        { beats: 0.25, name: "sixteenth note" },
      ];

      // Find the closest note duration
      const closest = noteDurations.reduce((prev, curr) => {
        return Math.abs(curr.beats - durationInBeats) < Math.abs(prev.beats - durationInBeats)
          ? curr
          : prev;
      });

      return closest.name;
    },
    [score.tempo]
  );

  // Convert duration in ms to beats
  const msToBeats = useCallback(
    (durationMs: number): number => {
      const beatDuration = (60 / score.tempo) * 1000; // Duration of one beat in ms
      return snapToGrid(durationMs / beatDuration, snapType);
    },
    [score.tempo, snapType]
  );

  // Update the score with the new note
  const updateScore = useCallback(
    (beatPosition: number, durationInBeats: number, pressedKey: string) => {
      if (!currentTrack || currentTrack.type !== "melody") return;

      const degreeIndex = keyMap[pressedKey];
      if (degreeIndex === undefined) return;

      // Get the note in the current key
      const rotatedScale = getNoteInKey(score.key.split(/\d/)[0]);
      const targetNoteLetter = rotatedScale[degreeIndex];
      if (!targetNoteLetter) return;
      console.log("letter", targetNoteLetter);
      // Find the closest note to the last input
      const finalNote = findCloestNote(lastInputNote, targetNoteLetter);
      if (!finalNote) return;

      // Update the slot
      const updatedSlot = {
        beat: beatPosition,
        duration: durationInBeats,
        note: finalNote,
        comment: "",
      };
      console.log(updatedSlot);
      // Dispatch updates
      dispatch(setLastInputNote(finalNote));
      dispatch(
        setSlot({
          trackId: currentTrack.id,
          slot: updatedSlot,
        })
      );
      // dispatch(setEditingBeat(Math.floor(beatPosition + durationInBeats)));
    },
    [currentTrack, dispatch, lastInputNote, score.key]
  );

  function handleStartAndStop() {
    if (isRecording) {
      dispatch(setRecording(false));
      setStartingTime(null);
    } else {
      dispatch(setRecording(true));
      setStartingTime(performance.now());
    }
  }

  // Start the metronome
  useMetronome({
    isPlaying: isRecording,
    tempo: score.tempo,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={handleStartAndStop}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          {isRecording ? "Stop" : "Start"} Recording
        </button>
        <span>Tempo: {score.tempo} BPM</span>
        <div className="flex items-center gap-2">
          <label htmlFor="inputOffset">Input Offset (ms):</label>
          <input
            id="inputOffset"
            type="number"
            value={inputOffset}
            onChange={(e) => setInputOffset(Number(e.target.value))}
            className="w-20 rounded border px-2 py-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2">
            Snap to:
            <select
              value={snapType}
              onChange={(e) => setSnapType(e.target.value as SnapType)}
              className="rounded border px-2 py-1"
            >
              <option value="none">Off</option>
              <option value="eighth">8th Notes</option>
              <option value="sixteenth">16th Notes</option>
            </select>
          </label>
        </div>
      </div>

      {keyPresses.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-xl font-semibold">Last 5 Key Presses:</h2>
          <div className="space-y-1">
            {keyPresses.slice(-5).map((press, i) => (
              <div key={i}>
                Key: {press.key}, Beat: {press.beatPosition.toFixed(3)}
                {snapType !== "none" && ` (raw: ${press.rawBeatPosition.toFixed(3)})`}, Duration:{" "}
                {press.duration.toFixed(2)}ms ({press.noteDuration})
              </div>
            ))}
          </div>
        </div>
      )}

      {activeKeyPresses.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-xl font-semibold">Currently Pressed Keys:</h2>
          <div className="space-y-1">
            {activeKeyPresses.map((press, i) => (
              <div key={i}>
                Key: {press.key}, Started at beat:{" "}
                {calculateBeatPosition(press.startTime).toFixed(3)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
