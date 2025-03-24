// useMetronome.ts
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

interface UseMetronomeProps {
  isPlaying: boolean;
  tempo: number;
}

export function useMetronome({ isPlaying, tempo }: UseMetronomeProps) {
  const loopRef = useRef<Tone.Loop | null>(null);
  const beatRef = useRef(0);
  const contextRef = useRef<Tone.Context | null>(null);

  // Create context once
  useEffect(() => {
    contextRef.current = new Tone.Context();

    return () => {
      if (contextRef.current) {
        contextRef.current.dispose();
        contextRef.current = null;
      }
    };
  }, []);

  // Create and cleanup the Loop
  useEffect(() => {
    if (!contextRef.current) return;

    const metronomeSound = new Tone.Synth({
      context: contextRef.current,
    }).toDestination();

    loopRef.current = new Tone.Loop({
      context: contextRef.current,
      callback: (time) => {
        // Trigger the click sound
        metronomeSound.triggerAttackRelease("C5", "32n", time);

        // Schedule the UI update
        if (!contextRef.current) return;
        contextRef.current.transport.schedule(() => {
          beatRef.current += 1;
        }, time);
      },
      interval: "4n",
    });

    return () => {
      if (loopRef.current) {
        loopRef.current.dispose();
        loopRef.current = null;
      }
      metronomeSound.dispose();
    };
  }, []);

  // Handle start/stop and BPM changes
  useEffect(() => {
    if (!contextRef.current) return;

    const transport = contextRef.current.transport;
    transport.bpm.value = tempo;

    if (isPlaying) {
      // start the loop if playing
      loopRef.current?.start(0);
      transport.start();
    } else {
      // stop if not playing
      loopRef.current?.stop();
      transport.stop();
      // Reset both the state and ref when stopping
      beatRef.current = 0;
    }

    return () => {
      if (!isPlaying && contextRef.current) {
        loopRef.current?.stop();
        contextRef.current.transport.stop();
      }
    };
  }, [isPlaying, tempo]);
}
