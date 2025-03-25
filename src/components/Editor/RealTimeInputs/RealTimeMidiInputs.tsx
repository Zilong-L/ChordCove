// RealTimeInput.tsx
import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../stores/store";
import { setRecording } from "@stores/editingSlice";
import { useMetronome } from "./useMetronome";
import { pushSlot, clearDirtyBit, setSlot } from "@stores/scoreSlice";
import { useEffect, useRef } from "react";
import { Note } from "tonal";

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

interface MIDIAccess {
  inputs: Map<string, MIDIInput>;
  onstatechange: ((this: MIDIAccess, ev: MIDIStateEvent) => void) | null;
}

interface ActiveNote {
  startTime: number;
  noteMidi: number;
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
  const isRecording = editing.isRecording;
  const currentTrack = score.tracks[editing.editingTrack];
  const [startingTime, setStartingTime] = useState<number | null>(null);
  const [inputOffset, setInputOffset] = useState(0); // in milliseconds
  const [snapType, setSnapType] = useState<SnapType>("eighth");
  const currentTrackRef = useRef(score.tracks[editing.editingTrack]);

  // Update refs when values change
  useEffect(() => {
    currentTrackRef.current = score.tracks[editing.editingTrack];
  }, [score.tracks, editing.editingTrack]);

  const calculateBeatPosition = useCallback(
    (timestamp: number) => {
      if (!startingTime) return 0;
      console.log("calculateBeatPosition", timestamp, startingTime, inputOffset);
      // Apply input offset to the elapsed time calculation
      const elapsedTime = timestamp - startingTime - inputOffset;
      const beatDuration = (60 / score.tempo) * 1000; // Convert to milliseconds
      const beatPosition = elapsedTime / beatDuration;
      return snapToGrid(editingBeat + beatPosition, snapType);
    },
    [startingTime, score.tempo, inputOffset, snapType, editingBeat]
  );

  // Convert duration in ms to beats
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
    (beatPosition: number, durationInBeats: number, noteString: string) => {
      if (!currentTrack || currentTrack.type !== "notes" || !isRecording) return;

      // Update the slot
      const updatedSlot = {
        beat: beatPosition,
        duration: durationInBeats,
        note: noteString,
        comment: "",
        dirty: true,
      };
      console.log(updatedSlot);
      // Dispatch updates
      dispatch(
        pushSlot({
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
  const calculateBeatPositionRef = useRef(calculateBeatPosition);
  const msToBeatsRef = useRef(msToBeats);
  const updateNotesTrackRef = useRef(updateNotesTrack);
  const updateMelodyTrackRef = useRef(updateMelodyTrack);

  const handleMidiMessageForMelody = (() => {
    let pressingNote: ActiveNote | null = null;

    return (message: MIDIMessageEvent) => {
      const [status, note, velocity] = message.data;

      // 处理音符按下
      if (status === 144 && velocity > 0) {
        if (pressingNote) {
          const beatPosition = calculateBeatPositionRef.current(pressingNote.startTime);
          const durationInBeats = msToBeatsRef.current(performance.now() - pressingNote.startTime);
          const noteLetter = Note.fromMidi(pressingNote.noteMidi);
          updateMelodyTrackRef.current(beatPosition, durationInBeats, noteLetter);
        }
        pressingNote = { startTime: performance.now(), noteMidi: note };
        console.log("pressingNote", pressingNote);
      }
      // 处理音符释放
      else if (status === 128 || (status === 144 && velocity === 0)) {
        if (pressingNote && note == pressingNote.noteMidi) {
          const beatPosition = calculateBeatPositionRef.current(pressingNote.startTime);
          const durationInBeats = msToBeatsRef.current(performance.now() - pressingNote.startTime);
          const noteLetter = Note.fromMidi(pressingNote.noteMidi);
          console.log("pressing", performance.now() - pressingNote.startTime);
          console.log("updateMelodyTrack", beatPosition, durationInBeats, noteLetter);
          updateMelodyTrackRef.current(beatPosition, durationInBeats, noteLetter);
          pressingNote = null;
        }
      }
    };
  })();
  const handleMidiMessageForAccompaniment = (() => {
    let pressingNote: ActiveNote | null = null;

    return (message: MIDIMessageEvent) => {
      const [status, note, velocity] = message.data;

      // 处理音符按下
      if (status === 144 && velocity > 0) {
        if (pressingNote) {
          const beatPosition = calculateBeatPositionRef.current(pressingNote.startTime);
          const durationInBeats = msToBeatsRef.current(performance.now() - pressingNote.startTime);
          const noteLetter = Note.fromMidi(pressingNote.noteMidi);
          updateMelodyTrackRef.current(beatPosition, durationInBeats, noteLetter);
        }
        pressingNote = { startTime: performance.now(), noteMidi: note };
        console.log("pressingNote", pressingNote);
      }
      // 处理音符释放
      else if (status === 128 || (status === 144 && velocity === 0)) {
        if (pressingNote && note == pressingNote.noteMidi) {
          const beatPosition = calculateBeatPositionRef.current(pressingNote.startTime);
          const durationInBeats = msToBeatsRef.current(performance.now() - pressingNote.startTime);
          const noteLetter = Note.fromMidi(pressingNote.noteMidi);
          console.log("pressing", performance.now() - pressingNote.startTime);
          console.log("updateMelodyTrack", beatPosition, durationInBeats, noteLetter);
          updateMelodyTrackRef.current(beatPosition, durationInBeats, noteLetter);
          pressingNote = null;
        }
      }
    };
  })();
  const handleMidiMessageForNotes = (() => {
    let pressingNotes: ActiveNote[] = [];
    let sustainedNotes: ActiveNote[] = [];

    let sustainActive = false;

    return (message: MIDIMessageEvent) => {
      const [status, note, velocity] = message.data;
      // 处理踏板
      if (status === 176 && note === 64) {
        sustainActive = velocity > 0;
        if (!sustainActive) {
          const pressingMidis = pressingNotes.map((n) => n.noteMidi);
          const toProcessNotes = sustainedNotes.filter((n) => !pressingMidis.includes(n.noteMidi));
          sustainedNotes = sustainedNotes.filter((n) => pressingMidis.includes(n.noteMidi));
          for (const note of toProcessNotes) {
            const beatPosition = calculateBeatPositionRef.current(note.startTime);
            const durationInBeats = msToBeatsRef.current(performance.now() - note.startTime);
            const noteLetter = Note.fromMidi(note.noteMidi);
            updateNotesTrackRef.current(beatPosition, durationInBeats, noteLetter);
          }
        }
      }
      // 处理音符按下
      else if (status === 144 && velocity > 0) {
        const currentNote = { startTime: performance.now(), noteMidi: note };
        pressingNotes.push(currentNote);
        sustainedNotes.push(currentNote);
      }
      // 处理音符释放
      else if (status === 128 || (status === 144 && velocity === 0)) {
        pressingNotes = pressingNotes.filter((n) => n.noteMidi !== note);
        if (!sustainActive) {
          const toProcessNotes = sustainedNotes.filter((n) => n.noteMidi == note);
          sustainedNotes = sustainedNotes.filter((n) => n.noteMidi !== note);
          for (const note of toProcessNotes) {
            const beatPosition = calculateBeatPositionRef.current(note.startTime);
            const durationInBeats = msToBeatsRef.current(performance.now() - note.startTime);
            const noteLetter = Note.fromMidi(note.noteMidi);
            updateNotesTrackRef.current(beatPosition, durationInBeats, noteLetter);
          }
        }
      }
      console.log(pressingNotes, sustainedNotes);
    };
  })();
  const handleMidiMessage = (message: MIDIMessageEvent) => {
    switch (currentTrackRef.current.type) {
      case "notes":
        handleMidiMessageForNotes(message);
        break;
      case "melody":
        handleMidiMessageForMelody(message);
        break;
    }
  };

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      console.log("WebMIDI is not supported in this browser.");
      return;
    }

    let midiAccess: MIDIAccess | null = null;

    navigator
      .requestMIDIAccess()
      .then((access) => {
        midiAccess = access;
        console.log("MIDI Access granted!");

        // Connect to all available MIDI inputs
        access.inputs.forEach((input) => {
          console.log("Connecting to MIDI input:", input.name);
          input.onmidimessage = handleMidiMessage;
        });

        // Listen for new MIDI devices
        access.onstatechange = (e: MIDIStateEvent) => {
          const port = e.port;
          if (port.type === "input") {
            if (port.state === "connected") {
              console.log("MIDI input connected:", port.name);
              port.onmidimessage = handleMidiMessage;
            }
          }
        };
      })
      .catch((error) => console.error("Error requesting MIDI access:", error));

    // Cleanup function
    return () => {
      if (midiAccess) {
        midiAccess.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
      }
    };
  }, []); // Empty dependency array since we're using refs

  useEffect(() => {
    calculateBeatPositionRef.current = calculateBeatPosition;
    msToBeatsRef.current = msToBeats;
    updateNotesTrackRef.current = updateNotesTrack;
    updateMelodyTrackRef.current = updateMelodyTrack;
  }, [calculateBeatPosition, msToBeats, updateNotesTrack, updateMelodyTrack]);

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
    </div>
  );
}
