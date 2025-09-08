// RealTimeInput.tsx
import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../stores/store";
import { setRecording, setEditingBeat, setRecordingSnapType } from "@stores/editingSlice";
import { useMetronome } from "./useMetronome";
import { clearDirtyBit, setSlot } from "@stores/scoreSlice";
import { useEffect, useRef } from "react";
import { Note } from "tonal";
import { scorePlaybackService } from "@utils/sounds/ScorePlaybackService";
import { getSamplerInstance } from "@utils/sounds/Toneloader";
// WebMidi types
interface MIDIMessageEvent {
  data: Uint8Array;
}

interface MIDIInput extends EventTarget {
  name: string;
  onmidimessage: ((this: MIDIInput, ev: MIDIMessageEvent) => void) | null;
}

interface MIDIPort {
  name: string;
  state: string;
  type: string;
}

interface MIDIStateEvent {
  port: MIDIPort & MIDIInput;
}

interface _MIDIAccess {
  inputs: Map<string, MIDIInput>;
  onstatechange: ((this: MIDIAccess, ev: MIDIStateEvent) => void) | null;
}

interface ActiveNote {
  startTime: number;
  noteMidi: number;
  startBeat?: number; // capture editing beat at note-on
}
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
  const editingBeat = editing.editingBeat;
  const editingTrack = editing.editingTrack;
  const isRecording = editing.isRecording;
  const currentTrack = score.tracks[editing.editingTrack];
  const [_, setStartingTime] = useState<number | null>(null);
  const [snapType, setSnapType] = useState<SnapType>(
    useSelector((s: RootState) => s.editing.recordingSnapType)
  );
  const currentTrackRef = useRef(score.tracks[editing.editingTrack]);

  const { sampler } = getSamplerInstance()!;
  // Update refs when values change
  useEffect(() => {
    currentTrackRef.current = score.tracks[editing.editingTrack];
  }, [score.tracks, editing.editingTrack]);

  // Control playback based on recording state changes
  useEffect(() => {
    if (isRecording) {
      const accompanimentTracks = score.tracks.filter((_, index) => index !== editingTrack);
      scorePlaybackService.setup(accompanimentTracks, score.tempo).then(() => {
        scorePlaybackService.play(editingBeat);
      });

      return () => {
        if (!isRecording) {
          scorePlaybackService.dispose();
        }
      };
    } else {
      scorePlaybackService.stop();
    }
  }, [isRecording, editingTrack, editingBeat, score.tempo]);

  // Convert duration in ms to beats (kept here for now; actual recording logic runs in useMidiInputs)
  const msToBeats = useCallback(
    (durationMs: number): number => {
      const beatDuration = (60 / score.tempo) * 1000; // Duration of one beat in ms
      const snapedDuration = snapToGrid(durationMs / beatDuration, snapType);
      return snapedDuration == 0 ? 0.25 : snapedDuration;
    },
    [score.tempo, snapType]
  );

  const updateMelodyTrack = useCallback(
    (beatPosition: number, durationInBeats: number, noteString: string) => {
      if (!currentTrack || currentTrack.type !== "melody" || !isRecording) return;

      // Update the slot
      const updatedSlot = {
        beat: beatPosition,
        duration: durationInBeats,
        note: noteString,
        comment: "",
        dirty: true,
      };
      dispatch(
        setSlot({
          trackId: currentTrack.id,
          slot: updatedSlot,
        })
      );
    },
    [currentTrack, dispatch, isRecording]
  );
  // Update the score with the new note
  const updateNotesTrack = useCallback(
    (beatPosition: number, durationInBeats: number, notes: string[]) => {
      if (
        !currentTrack ||
        (currentTrack.type !== "accompaniment" && currentTrack.type !== "notes") ||
        !isRecording
      )
        return;

      const updatedSlot = {
        beat: beatPosition,
        duration: durationInBeats,
        notes,
        comment: "",
      } as const;

      dispatch(
        setSlot({
          trackId: currentTrack.id,
          slot: updatedSlot,
        })
      );
    },
    [currentTrack, dispatch, isRecording]
  );

  function handleStartAndStop() {
    if (isRecording) {
      dispatch(setRecording(false));
      setStartingTime(null);
      dispatch(clearDirtyBit());
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
  // Refs for stable handlers
  const msToBeatsRef = useRef(msToBeats);
  const updateNotesTrackRef = useRef(updateNotesTrack);
  const updateMelodyTrackRef = useRef(updateMelodyTrack);
  const currentEditingBeatRef = useRef(editingBeat);
  useEffect(() => {
    currentEditingBeatRef.current = editingBeat;
  }, [editingBeat]);

  const _handleMidiMessageForMelody = (() => {
    let pressingNote: ActiveNote | null = null;

    return (message: MIDIMessageEvent) => {
      const [status, note, velocity] = message.data;

      // Note On
      if (status === 144 && velocity > 0) {
        // finalize previous if still hanging
        if (pressingNote) {
          const durationInBeats = msToBeatsRef.current(performance.now() - pressingNote.startTime);
          const noteLetter = Note.fromMidi(pressingNote.noteMidi);
          const beatPosition = pressingNote.startBeat ?? currentEditingBeatRef.current;
          updateMelodyTrackRef.current(beatPosition, durationInBeats, noteLetter);
          dispatch(setEditingBeat(beatPosition + durationInBeats));
        }
        pressingNote = {
          startTime: performance.now(),
          noteMidi: note,
          startBeat: currentEditingBeatRef.current,
        };
      }
      // Note Off
      else if (status === 128 || (status === 144 && velocity === 0)) {
        if (pressingNote && note == pressingNote.noteMidi) {
          const durationInBeats = msToBeatsRef.current(performance.now() - pressingNote.startTime);
          const noteLetter = Note.fromMidi(pressingNote.noteMidi);
          const beatPosition = pressingNote.startBeat ?? currentEditingBeatRef.current;
          updateMelodyTrackRef.current(beatPosition, durationInBeats, noteLetter);
          dispatch(setEditingBeat(beatPosition + durationInBeats));
          pressingNote = null;
        }
      }
    };
  })();

  const _handleMidiMessageForAccompaniment = (() => {
    const pressingNotes = new Set<number>();
    const sustainedNotes = new Set<number>();
    const addingNotes = new Set<number>();
    let sustainActive = false;
    let chordStartBeat: number | null = null;
    let chordStartTime: number | null = null;

    const tryFinalizeChord = () => {
      if (chordStartTime == null || chordStartBeat == null) return;
      if (pressingNotes.size === 0 && sustainedNotes.size === 0) {
        const durationInBeats = msToBeatsRef.current(performance.now() - chordStartTime);
        const notes = Array.from(addingNotes)
          .sort((a, b) => a - b)
          .map((n) => Note.fromMidi(n));
        updateNotesTrackRef.current(chordStartBeat, durationInBeats, notes);
        dispatch(setEditingBeat(chordStartBeat + durationInBeats));
        addingNotes.clear();
        chordStartBeat = null;
        chordStartTime = null;
      }
    };

    return (message: MIDIMessageEvent) => {
      const [status, note, velocity] = message.data;

      // Sustain pedal
      if (status === 176 && note === 64) {
        sustainActive = velocity > 0;
        if (!sustainActive) {
          // On release, drop sustained notes that are not pressed
          for (const n of Array.from(sustainedNotes)) {
            if (!pressingNotes.has(n)) sustainedNotes.delete(n);
          }
          tryFinalizeChord();
        }
      }
      // Note on
      else if (status === 144 && velocity > 0) {
        if (chordStartBeat == null) {
          chordStartBeat = currentEditingBeatRef.current;
          chordStartTime = performance.now();
        }
        pressingNotes.add(note);
        sustainedNotes.add(note);
        addingNotes.add(note);
      }
      // Note off
      else if (status === 128 || (status === 144 && velocity === 0)) {
        pressingNotes.delete(note);
        if (!sustainActive) {
          sustainedNotes.delete(note);
        }
        tryFinalizeChord();
      }
    };
  })();
  const _handleSound = (message: MIDIMessageEvent) => {
    const [status, note, velocity] = message.data;
    if (status === 144 && velocity > 0) {
      sampler.triggerAttack(Note.fromMidi(note));
    }
    // 处理音符释放
    else if (status === 128 || (status === 144 && velocity === 0)) {
      sampler.triggerRelease(Note.fromMidi(note));
    }
  };
  // MIDI listening is centralized in useMidiInputs. This component handles UI + metronome + playback.

  useEffect(() => {
    msToBeatsRef.current = msToBeats;
    updateNotesTrackRef.current = updateNotesTrack;
    updateMelodyTrackRef.current = updateMelodyTrack;
  }, [msToBeats, updateNotesTrack, updateMelodyTrack]);

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
              <option value="none">Off</option>
              <option value="eighth">8th Notes</option>
              <option value="sixteenth">16th Notes</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
