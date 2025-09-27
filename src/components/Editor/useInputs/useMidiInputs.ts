import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import { MelodySlot, Score, setSlot } from "@stores/scoreSlice";
import { useEffect, useRef } from "react";
import { EditingSlotState, setEditingBeat, setLastInputNote } from "@stores/editingSlice";
import { durationValues, type NoteDuration } from "#types/sheet";
import { Note } from "tonal";
import { getSamplerInstance } from "@utils/sounds/Toneloader";
import { snapToGrid } from "@utils/snap";
import { getContext } from "tone";
// WebMidi types
// Use lightweight WebMIDI aliases to avoid DOM type conflicts
type WMIDIMessageEvent = { data: Uint8Array };
type WMIDIInput = {
  id?: string;
  name: string;
  type?: string;
  state?: string;
  onmidimessage: ((ev: WMIDIMessageEvent) => void) | null;
};
type WMIDIInputMap = {
  forEach(cb: (value: WMIDIInput, key: string) => void): void;
};
type WMIDIAccess = {
  inputs: WMIDIInputMap;
  onstatechange: ((ev: { port: WMIDIInput | null }) => void) | null;
};

export default function useMidiInputs() {
  const dispatch = useDispatch();
  const score = useSelector((state: RootState) => state.score as Score);
  const edit = useSelector((state: RootState) => state.editing as EditingSlotState);
  const { selectedDuration, isDotted, selectedMidiInputId } = edit;

  // Use refs to store current state values that we need in the MIDI handler
  const currentTrackRef = useRef(score.tracks[edit.editingTrack]);
  const currentBeatRef = useRef(edit.editingBeat);
  const selectedDurationRef = useRef(selectedDuration);
  const isDottedRef = useRef(isDotted);
  const isRecordingRef = useRef(edit.isRecording);
  const recordingSnapTypeRef = useRef<"whole" | "eighth" | "sixteenth">(edit.recordingSnapType);

  const { sampler } = getSamplerInstance()!;
  // Update refs when values change

  useEffect(() => {
    currentTrackRef.current = score.tracks[edit.editingTrack];
    currentBeatRef.current = edit.editingBeat;
    selectedDurationRef.current = selectedDuration;
    isDottedRef.current = isDotted;
    isRecordingRef.current = edit.isRecording;
    recordingSnapTypeRef.current = edit.recordingSnapType;
  }, [
    score.tracks,
    edit.editingTrack,
    edit.editingBeat,
    selectedDuration,
    isDotted,
    edit.isRecording,
    edit.recordingSnapType,
  ]);

  const handleMidiMessageForMelody = (message: WMIDIMessageEvent) => {
    const data = message.data as Uint8Array;
    const [status, note, velocity] = data;
    const noteName = Note.fromMidi(note);
    // Only handle note on events with velocity > 0
    if (status >= 144 && status <= 159 && velocity > 0) {
      const currentTrack = currentTrackRef.current;
      const currentBeat = currentBeatRef.current;

      const existingSlot = currentTrack.slots.find(
        (slot) => slot.beat === currentBeat
      ) as MelodySlot;
      if (!existingSlot) return;

      const baseDuration = durationValues[selectedDurationRef.current as NoteDuration];
      const duration = isDottedRef.current ? baseDuration * 1.5 : baseDuration;

      // Update the slot with new content
      const updatedSlot = {
        ...existingSlot,
        beat: currentBeat,
        duration,
        note: noteName,
        lyrics: existingSlot.lyrics, // Preserve existing lyrics if any
      };
      // Update last input note for melody
      dispatch(setLastInputNote(noteName));
      dispatch(
        setSlot({
          trackId: currentTrack.id,
          slot: updatedSlot,
        })
      );
      // Advance editing position immediately for subsequent hits to not replace the last note
      const nextBeat = currentBeat + duration;
      currentBeatRef.current = nextBeat;
      dispatch(setEditingBeat(nextBeat));
    }
  };

  const handleMidiMessageForAccompaniment = (() => {
    const pressingNotes = new Set<number>();
    const sustainedNotesSet = new Set<number>();
    const addingNotes = new Set<number>();
    let sustainActive = false;

    return (message: WMIDIMessageEvent) => {
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
  const handleSound = (message: WMIDIMessageEvent) => {
    const data = message.data as Uint8Array;
    const [status, note, velocity] = data;
    if (status >= 144 && status <= 159 && velocity > 0) {
      sampler.triggerAttack(Note.fromMidi(note), getContext().currentTime);
    }
    // 处理音符释放
    else if (
      (status >= 128 && status <= 143) ||
      (status >= 144 && status <= 159 && velocity === 0)
    ) {
      sampler.triggerRelease(Note.fromMidi(note));
    }
  };
  // Recording-time handlers (press/release timing based)
  const handleRecordingMelody = (() => {
    let pressingNote: { startTime: number; noteMidi: number; startBeat?: number } | null = null;
    return (message: WMIDIMessageEvent) => {
      const [status, note, velocity] = message.data;
      const now = performance.now();
      // Note On (any channel)
      if (status >= 144 && status <= 159 && velocity > 0) {
        // finalize previous if still hanging
        if (pressingNote) {
          const durationMs = now - pressingNote.startTime;
          const beatDuration = (60 / (score.tempo || 120)) * 1000;
          const rawBeats = durationMs / beatDuration;
          const snapType = recordingSnapTypeRef.current;
          const durationInBeats = snapToGrid(rawBeats, snapType);
          const noteLetter = Note.fromMidi(pressingNote.noteMidi);
          const beatPosition = pressingNote.startBeat ?? currentBeatRef.current;
          const currentTrack = currentTrackRef.current;
          if (currentTrack.type === "melody") {
            dispatch(
              setSlot({
                trackId: currentTrack.id,
                slot: {
                  beat: beatPosition,
                  duration: durationInBeats,
                  note: noteLetter,
                  lyrics: "",
                  dirty: true,
                },
              })
            );
            const nextBeat = beatPosition + durationInBeats;
            // advance ref first so the next note-on captures the updated start
            currentBeatRef.current = nextBeat;
            dispatch(setEditingBeat(nextBeat));
          }
        }
        pressingNote = {
          startTime: now,
          noteMidi: note,
          startBeat: currentBeatRef.current,
        };
      }
      // Note Off (any channel) or Note On with velocity 0
      else if (
        (status >= 128 && status <= 143) ||
        (status >= 144 && status <= 159 && velocity === 0)
      ) {
        if (pressingNote && note === pressingNote.noteMidi) {
          const durationMs = now - pressingNote.startTime;
          const beatDuration = (60 / (score.tempo || 120)) * 1000;
          const rawBeats = durationMs / beatDuration;
          const snapType = recordingSnapTypeRef.current;
          const durationInBeats = snapToGrid(rawBeats, snapType);
          const noteLetter = Note.fromMidi(pressingNote.noteMidi);
          const beatPosition = pressingNote.startBeat ?? currentBeatRef.current;
          const currentTrack = currentTrackRef.current;
          if (currentTrack.type === "melody") {
            dispatch(
              setSlot({
                trackId: currentTrack.id,
                slot: {
                  beat: beatPosition,
                  duration: durationInBeats,
                  note: noteLetter,
                  lyrics: "",
                  dirty: true,
                },
              })
            );
            dispatch(setEditingBeat(beatPosition + durationInBeats));
          }
          pressingNote = null;
        }
      }
    };
  })();

  const handleRecordingAccompaniment = (() => {
    const pressingNotes = new Set<number>();
    const sustainedNotes = new Set<number>();
    const addingNotes = new Set<number>();
    let sustainActive = false;
    let chordStartBeat: number | null = null;
    let chordStartTime: number | null = null;

    const finishChord = () => {
      if (chordStartTime == null || chordStartBeat == null) return;
      if (pressingNotes.size === 0 && sustainedNotes.size === 0) {
        const durationMs = performance.now() - chordStartTime;
        const beatDuration = (60 / (score.tempo || 120)) * 1000;
        const rawBeats = durationMs / beatDuration;
        const snapType = recordingSnapTypeRef.current;
        const durationInBeats = snapToGrid(rawBeats, snapType);
        const notes = Array.from(addingNotes)
          .sort((a, b) => a - b)
          .map((n) => Note.fromMidi(n));
        const currentTrack = currentTrackRef.current;
        if (currentTrack.type === "accompaniment" || currentTrack.type === "notes") {
          dispatch(
            setSlot({
              trackId: currentTrack.id,
              slot: {
                beat: chordStartBeat,
                duration: durationInBeats,
                notes,
                lyrics: "",
              },
            })
          );
          dispatch(setEditingBeat(chordStartBeat + durationInBeats));
        }
        addingNotes.clear();
        chordStartBeat = null;
        chordStartTime = null;
      }
    };

    return (message: WMIDIMessageEvent) => {
      const [status, note, velocity] = message.data;
      // Sustain pedal
      if (status === 176 && note === 64) {
        sustainActive = velocity > 0;
        if (!sustainActive) {
          for (const n of Array.from(sustainedNotes)) {
            if (!pressingNotes.has(n)) sustainedNotes.delete(n);
          }
          finishChord();
        }
      }
      // Note on (any channel)
      else if (status >= 144 && status <= 159 && velocity > 0) {
        if (chordStartBeat == null) {
          chordStartBeat = currentBeatRef.current;
          chordStartTime = performance.now();
        }
        pressingNotes.add(note);
        sustainedNotes.add(note);
        addingNotes.add(note);
      }
      // Note off (any channel) or note-on with velocity 0
      else if (
        (status >= 128 && status <= 143) ||
        (status >= 144 && status <= 159 && velocity === 0)
      ) {
        pressingNotes.delete(note);
        if (!sustainActive) {
          sustainedNotes.delete(note);
        }
        finishChord();
      }
    };
  })();

  const handleMidiMessage = (message: WMIDIMessageEvent) => {
    handleSound(message);
    if (isRecordingRef.current) {
      switch (currentTrackRef.current.type) {
        case "melody":
          handleRecordingMelody(message);
          break;
        case "notes":
        case "accompaniment":
          handleRecordingAccompaniment(message);
          break;
      }
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

    let midiAccess: WMIDIAccess | null = null;

    navigator
      .requestMIDIAccess()
      .then((access) => {
        midiAccess = access as unknown as WMIDIAccess;
        console.log("MIDI Access granted!");

        // Connect only selected input (or all)
        access.inputs.forEach((input: WMIDIInput, id: string) => {
          const shouldConnect =
            !selectedMidiInputId || selectedMidiInputId === "all" || selectedMidiInputId === id;
          input.onmidimessage = shouldConnect ? (ev) => handleMidiMessage(ev) : null;
          if (shouldConnect) console.log("Connecting to MIDI input:", input.name);
        });

        // Listen for new MIDI devices
        access.onstatechange = (e: { port: WMIDIInput | null }) => {
          const port = e.port;
          if (port && port.type === "input") {
            if (port.state === "connected") {
              const input = port as WMIDIInput;
              const shouldConnect =
                !selectedMidiInputId ||
                selectedMidiInputId === "all" ||
                selectedMidiInputId === input.id;
              console.log("MIDI input connected:", input.name);
              input.onmidimessage = shouldConnect ? (ev) => handleMidiMessage(ev) : null;
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
  }, [selectedMidiInputId]);
}
