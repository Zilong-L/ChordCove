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

export interface NoteInfo {
  midiNumber: number;
  noteName: string;
  velocity: number;
}

// Custom Set class for NoteInfo that uses noteName for equality
export class NoteInfoSet extends Set<NoteInfo> {
  add(noteInfo: NoteInfo): this {
    // Remove any existing note with the same noteName
    for (const note of this) {
      if (note.noteName === noteInfo.noteName) {
        this.delete(note);
        break;
      }
    }
    super.add(noteInfo);
    return this;
  }
}

export function useMidi() {
  const [recentlyPressedNote, setRecentlyPressedNote] = useState<NoteInfo | null>(null);
  const [activeNotes, setActiveNotes] = useState<NoteInfoSet>(new NoteInfoSet());
  const [midiInputs, setMidiInputs] = useState<string[]>([]);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      console.log("WebMIDI is not supported in this browser.");
      return;
    }

    // Use closure to maintain state
    let sustainActive = false;
    const pressingNotes = new Set<number>();

    const handleMidiMessage = (message: MIDIMessageEvent) => {
      const [status, note, velocity] = message.data;
      const noteName = Note.fromMidi(note);
      if (!noteName) return;

      const noteInfo: NoteInfo = {
        midiNumber: note,
        noteName,
        velocity,
      };

      // Handle sustain pedal (control change 64)
      if (status === 176 && note === 64) {
        sustainActive = velocity > 0;

        if (!sustainActive) {
          // When releasing sustain, remove notes that are no longer being pressed
          setActiveNotes((prev) => {
            const newSet = new NoteInfoSet();
            for (const note of prev) {
              if (pressingNotes.has(note.midiNumber)) {
                newSet.add(note);
              }
            }
            return newSet;
          });
        }
      }
      // Note on event (status: 144-159)
      else if (status >= 144 && status <= 159 && velocity > 0) {
        setRecentlyPressedNote(noteInfo);
        pressingNotes.add(note);
        setActiveNotes((prev) => {
          const newSet = new NoteInfoSet();
          prev.forEach((n) => newSet.add(n));
          newSet.add(noteInfo);
          return newSet;
        });
      }
      // Note off event (status: 128-143 or velocity = 0)
      else if (
        (status >= 128 && status <= 143) ||
        (status >= 144 && status <= 159 && velocity === 0)
      ) {
        pressingNotes.delete(note);
        if (sustainActive) {
          return;
        }
        // Only remove from activeNotes if sustain is not active
        setActiveNotes((prev) => {
          const newSet = new NoteInfoSet();
          for (const n of prev) {
            if (n.noteName !== noteInfo.noteName) {
              newSet.add(n);
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
    allReleased: activeNotes.size === 0,
    setRecentlyPressedNote,
  };
}
