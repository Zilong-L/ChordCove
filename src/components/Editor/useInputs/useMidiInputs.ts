import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import { Score, setSlot } from "@stores/scoreSlice";
import { useEffect, useRef } from "react";
import { EditingSlotState, setEditingBeat, setLastInputNote } from "@stores/editingSlice";
import { durationValues, type NoteDuration } from "#types/sheet";
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

export default function useMidiInputs() {
  const dispatch = useDispatch();
  const score = useSelector((state: RootState) => state.score as Score);
  const edit = useSelector((state: RootState) => state.editing as EditingSlotState);
  const { selectedDuration, isDotted } = edit;

  // Use refs to store current state values that we need in the MIDI handler
  const currentTrackRef = useRef(score.tracks[edit.editingTrack]);
  const currentBeatRef = useRef(edit.editingBeat);
  const selectedDurationRef = useRef(selectedDuration);
  const isDottedRef = useRef(isDotted);
  const isRecordingRef = useRef(edit.isRecording);

  // Update refs when values change
  useEffect(() => {
    currentTrackRef.current = score.tracks[edit.editingTrack];
    currentBeatRef.current = edit.editingBeat;
    selectedDurationRef.current = selectedDuration;
    isDottedRef.current = isDotted;
    isRecordingRef.current = edit.isRecording;
  }, [
    score.tracks,
    edit.editingTrack,
    edit.editingBeat,
    selectedDuration,
    isDotted,
    edit.isRecording,
  ]);

  const handleMidiMessageForMelody = (message: MIDIMessageEvent) => {
    const [status, note, velocity] = message.data;
    const noteName = Note.fromMidi(note);
    // Only handle note on events with velocity > 0
    if (status >= 144 && status <= 159 && velocity > 0) {
      const currentTrack = currentTrackRef.current;
      const currentBeat = currentBeatRef.current;

      const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat);
      if (!existingSlot) return;

      const baseDuration = durationValues[selectedDurationRef.current as NoteDuration];
      const duration = isDottedRef.current ? baseDuration * 1.5 : baseDuration;

      // Update the slot with new content
      const updatedSlot = {
        ...existingSlot,
        beat: currentBeat,
        duration,
        note: noteName,
      };
      // Update last input note for melody
      dispatch(setLastInputNote(noteName));
      dispatch(
        setSlot({
          trackId: currentTrack.id,
          slot: updatedSlot,
        })
      );
      dispatch(setEditingBeat(currentBeat + duration));
    }
  };

  const handleMidiMessageForAccompaniment = (() => {
    const pressingNotes = new Set<number>();
    const sustainedNotesSet = new Set<number>();
    const addingNotes = new Set<number>();
    let sustainActive = false;

    return (message: MIDIMessageEvent) => {
      const [status, note, velocity] = message.data;
      const currentTrack = currentTrackRef.current;
      const currentBeat = currentBeatRef.current;
      // 更新槽位
      const existingSlot = currentTrack.slots.find((slot) => slot.beat === currentBeat);
      if (!existingSlot) return;

      const baseDuration = durationValues[selectedDurationRef.current as NoteDuration];
      const duration = isDottedRef.current ? baseDuration * 1.5 : baseDuration;
      // 处理持续踏板
      if (status === 176 && note === 64) {
        sustainActive = velocity > 0;
        if (sustainedNotesSet.size == 0) {
          return;
        }
        if (!sustainActive) {
          // 当踏板释放时，只保留当前正在按下的音符
          sustainedNotesSet.clear();
          pressingNotes.forEach((n) => sustainedNotesSet.add(n));
        }
      }
      // 处理音符按下
      else if (status === 144 && velocity > 0) {
        addingNotes.add(note);
        pressingNotes.add(note);
        sustainedNotesSet.add(note);
      }
      // 处理音符释放
      else if (status === 128 || (status === 144 && velocity === 0)) {
        pressingNotes.delete(note);
        if (!sustainActive) {
          sustainedNotesSet.delete(note);
        }
      }

      console.log(sustainedNotesSet.size);
      // 只有当有活跃音符时才更新槽位
      if (addingNotes.size > 0) {
        const updatedSlot = {
          ...existingSlot,
          beat: currentBeat,
          duration,
          notes: [...addingNotes.keys()].sort((a, b) => a - b).map((n) => Note.fromMidi(n)),
        };

        dispatch(
          setSlot({
            trackId: currentTrack.id,
            slot: updatedSlot,
          })
        );
      }

      // 只有当没有任何音符处于活跃状态时，才移动到下一个位置
      if (sustainedNotesSet.size === 0) {
        dispatch(setEditingBeat(currentBeat + duration));
        addingNotes.clear();
      }
    };
  })();

  const handleMidiMessage = (message: MIDIMessageEvent) => {
    if (isRecordingRef.current) {
      return;
    }
    switch (currentTrackRef.current.type) {
      case "melody":
        handleMidiMessageForMelody(message);
        break;
      case "accompaniment":
        handleMidiMessageForAccompaniment(message);
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
}
