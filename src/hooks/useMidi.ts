import { useState, useEffect } from "react";
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

declare global {
  interface Navigator {
    requestMIDIAccess(): Promise<MIDIAccess>;
  }
}

interface NoteInfo {
  midiNumber: number;
  noteName: string;
  velocity: number;
}

export function useMidi() {
  const [recentlyPressedNote, setRecentlyPressedNote] = useState<NoteInfo | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<NoteInfo>>(new Set());
  const [midiInputs, setMidiInputs] = useState<string[]>([]);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      console.log("WebMIDI is not supported in this browser.");
      return;
    }

    const handleMidiMessage = (message: MIDIMessageEvent) => {
      const [status, note, velocity] = message.data;
      const noteName = Note.fromMidi(note);
      if (!noteName) return;

      const noteInfo: NoteInfo = {
        midiNumber: note,
        noteName,
        velocity,
      };

      // Note on event (status: 144-159)
      if (status >= 144 && status <= 159 && velocity > 0) {
        setRecentlyPressedNote(noteInfo);
        setActiveNotes((prev) => {
          const newSet = new Set(prev);
          newSet.add(noteInfo);
          return newSet;
        });
      }
      // Note off event (status: 128-143 or velocity = 0)
      else if (
        (status >= 128 && status <= 143) ||
        (status >= 144 && status <= 159 && velocity === 0)
      ) {
        setActiveNotes((prev) => {
          const newSet = new Set(prev);
          for (const note of newSet) {
            if (note.midiNumber === noteInfo.midiNumber) {
              newSet.delete(note);
              break;
            }
          }
          return newSet;
        });
      }
    };

    let midiAccess: MIDIAccess | null = null;

    navigator
      .requestMIDIAccess()
      .then((access) => {
        midiAccess = access;
        console.log("MIDI Access granted!");

        // Update connected inputs list
        const inputNames = Array.from(access.inputs.values()).map((input) => input.name);
        setMidiInputs(inputNames);

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
              setMidiInputs((prev) => [...prev, port.name]);
            } else if (port.state === "disconnected") {
              console.log("MIDI input disconnected:", port.name);
              setMidiInputs((prev) => prev.filter((name) => name !== port.name));
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
  }, []);

  return {
    recentlyPressedNote,
    activeNotes,
    midiInputs,
    hasWebMidi: !!navigator.requestMIDIAccess,
  };
}
