// RealTimeInput.tsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../stores/store";
import { setRecording, setRecordingSnapType } from "@stores/editingSlice";
import { useMetronome } from "./useMetronome";
import { clearDirtyBit } from "@stores/scoreSlice";
import { useEffect, useRef } from "react";
// WebMidi types
interface MIDIMessageEvent {
  data: Uint8Array;
}

interface MIDIInput extends EventTarget {
  name: string;
  onmidimessage: ((this: MIDIInput, ev: MIDIMessageEvent) => void) | null;
}

import { type SnapType } from "@utils/snap";

// use shared snapToGrid from utils

export default function RealTimeInput() {
  const dispatch = useDispatch();
  const score = useSelector((state: RootState) => state.score);
  const editing = useSelector((state: RootState) => state.editing);
  const isRecording = editing.isRecording;
  const [snapType, setSnapType] = useState<SnapType>(
    useSelector((s: RootState) => s.editing.recordingSnapType)
  );
  const currentTrackRef = useRef(score.tracks[editing.editingTrack]);

  // Update refs when values change
  useEffect(() => {
    currentTrackRef.current = score.tracks[editing.editingTrack];
  }, [score.tracks, editing.editingTrack]);

  // No auto playback when recording starts; metronome handles timing only

  function handleStartAndStop() {
    if (isRecording) {
      dispatch(setRecording(false));
      dispatch(clearDirtyBit());
    } else {
      dispatch(setRecording(true));
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
          className={`rounded px-4 py-2 text-[var(--text-primary)] transition-colors ${
            isRecording
              ? "bg-[var(--bg-danger)] hover:bg-[var(--bg-danger-hover)]"
              : "bg-[var(--bg-button)] hover:bg-[var(--bg-button-hover)]"
          }`}
        >
          {isRecording ? "Stop" : "Start"} Recording
        </button>
        {/* Tempo is controlled globally via TempoControl */}
        <div className="flex items-center gap-2"></div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-[var(--text-primary)]">
            Snap to:
            <select
              value={snapType}
              onChange={(e) => {
                const v = e.target.value as SnapType;
                setSnapType(v);
                dispatch(setRecordingSnapType(v));
              }}
              className="rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
            >
              <option value="whole">whole</option>
              <option value="eighth">8th Notes</option>
              <option value="sixteenth">16th Notes</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
