import { useState, useEffect, useCallback } from "react";
import * as Tone from "tone";

// Create singleton metronome synth
const metronomeSound = new Tone.Synth({
  oscillator: { type: "square" },
  envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
}).toDestination();

interface MetronomeSettings {
  bpm: number;
  subdivision: 4 | 8; // 4 for quarter notes, 8 for eighth notes
}

interface KeyPress {
  time: number;
  beatPosition: number;
  duration: number;
  noteDuration: string;
  key: string;
}

interface ActiveKeyPress {
  startTime: number;
  key: string;
}

export default function MetronomeTester() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<MetronomeSettings>({
    bpm: 120,
    subdivision: 4,
  });
  const [startTime, setStartTime] = useState<number | null>(null);
  const [keyPresses, setKeyPresses] = useState<KeyPress[]>([]);
  const [activeKeyPresses, setActiveKeyPresses] = useState<ActiveKeyPress[]>([]);

  const calculateNoteDuration = (durationMs: number): string => {
    const beatDuration = (60 / settings.bpm) * 1000; // Duration of one beat in ms
    const durationInBeats = durationMs / beatDuration;

    // Define common note durations in beats
    const noteDurations = [
      { beats: 4, name: "whole note" },
      { beats: 2, name: "half note" },
      { beats: 1, name: "quarter note" },
      { beats: 0.5, name: "eighth note" },
      { beats: 0.25, name: "sixteenth note" },
      { beats: 0.125, name: "thirty-second note" },
    ];

    // Find the closest note duration
    const closest = noteDurations.reduce((prev, curr) => {
      return Math.abs(curr.beats - durationInBeats) < Math.abs(prev.beats - durationInBeats)
        ? curr
        : prev;
    });

    return closest.name;
  };

  // Calculate beat position from timestamp
  const calculateBeatPosition = useCallback(
    (timestamp: number) => {
      if (!startTime) return 0;

      const elapsedTime = timestamp - startTime;
      const beatDuration = (60 / settings.bpm) * 1000; // Convert to milliseconds

      // 不再根据subdivision调整单位，而是保持以四分音符为一拍
      const beatPosition = elapsedTime / beatDuration;
      return beatPosition;
    },
    [startTime, settings.bpm]
  );

  // Handle key press down
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!startTime || !isPlaying) return;

      // Check if this key is already being pressed
      if (activeKeyPresses.some((press) => press.key === e.key)) return;

      const keydownTime = performance.now();

      setActiveKeyPresses((prev) => [...prev, { startTime: keydownTime, key: e.key }]);
    },
    [startTime, isPlaying, activeKeyPresses]
  );

  // Handle key press up
  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!startTime || !isPlaying) return;

      const activePress = activeKeyPresses.find((press) => press.key === e.key);
      if (!activePress) return;

      const keyupTime = performance.now();
      const duration = keyupTime - activePress.startTime;
      const beatPosition = calculateBeatPosition(activePress.startTime);
      const noteDuration = calculateNoteDuration(duration);

      setKeyPresses((prev) => [
        ...prev,
        {
          time: activePress.startTime,
          beatPosition,
          duration,
          noteDuration,
          key: e.key,
        },
      ]);

      setActiveKeyPresses((prev) => prev.filter((press) => press.key !== e.key));
    },
    [startTime, isPlaying, activeKeyPresses, calculateBeatPosition, calculateNoteDuration]
  );

  // Setup metronome
  useEffect(() => {
    if (isPlaying) {
      Tone.start();
      setStartTime(performance.now());

      // Schedule metronome clicks
      const quarterNoteTime = Tone.Time("4n").toSeconds();
      // 调整播放间隔，但不改变beat的计算
      const interval = quarterNoteTime * (4 / settings.subdivision);
      const loop = new Tone.Loop((time) => {
        metronomeSound.triggerAttackRelease("C5", "32n", time);
      }, interval);

      Tone.Transport.bpm.value = settings.bpm;
      loop.start(0);
      Tone.Transport.start();

      return () => {
        loop.stop();
        Tone.Transport.stop();
        setStartTime(null);
        setActiveKeyPresses([]);
      };
    }
  }, [isPlaying, settings.bpm, settings.subdivision]);

  // Setup key listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Metronome Tester</h1>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            BPM:
            <input
              type="number"
              value={settings.bpm}
              onChange={(e) => setSettings((prev) => ({ ...prev, bpm: Number(e.target.value) }))}
              className="w-20 rounded border px-2 py-1"
              min="30"
              max="240"
            />
          </label>

          <label className="flex items-center gap-2">
            Subdivision:
            <select
              value={settings.subdivision}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, subdivision: Number(e.target.value) as 4 | 8 }))
              }
              className="rounded border px-2 py-1"
            >
              <option value={4}>Quarter Notes</option>
              <option value={8}>Eighth Notes</option>
            </select>
          </label>
        </div>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          {isPlaying ? "Stop" : "Start"} Metronome
        </button>

        <div className="mt-4">
          <h2 className="mb-2 text-xl font-semibold">Instructions:</h2>
          <p>1. Press Start to begin the metronome</p>
          <p>2. Press and hold any key to record timing</p>
          <p>3. Release the key to see the note duration</p>
          <p>4. Check the console for detailed timing information</p>
        </div>

        {keyPresses.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2 text-xl font-semibold">Last 5 Key Presses:</h2>
            <div className="space-y-1">
              {keyPresses.slice(-5).map((press, i) => (
                <div key={i}>
                  Key: {press.key}, Time: {(press.time - (startTime || 0)).toFixed(2)}ms, Duration:{" "}
                  {press.duration.toFixed(2)}ms ({press.noteDuration}), Beat:{" "}
                  {press.beatPosition.toFixed(3)}
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
                  Key: {press.key}, Started at: {(press.startTime - (startTime || 0)).toFixed(2)}ms,
                  Beat: {calculateBeatPosition(press.startTime).toFixed(3)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
