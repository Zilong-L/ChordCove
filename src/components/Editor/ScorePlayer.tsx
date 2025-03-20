import { useState, useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import { getSamplerInstance } from "@utils/sounds/Toneloader";
import * as Tone from "tone";
import {
  PlayIcon,
  StopIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
} from "@heroicons/react/24/solid";
import { setEditingBeat } from "@stores/newScore/newEditingSlice";

interface ScorePlayerProps {
  className?: string;
}

export default function ScorePlayer({ className = "" }: ScorePlayerProps) {
  const dispatch = useDispatch();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackStartBeat, setPlaybackStartBeat] = useState(0);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  // Use ref to store the loop so we can clean it up
  const loopRef = useRef<Tone.Loop | null>(null);

  const score = useSelector((state: RootState) => state.newScore);
  const { editingTrack, editingBeat } = useSelector((state: RootState) => state.newEditing);
  const currentTrack = score.tracks[editingTrack];

  // Convert beat position to time in seconds
  const beatToTime = (beat: number, bpm: number) => {
    return (beat * 60) / bpm;
  };

  // Update playback start position when editing beat changes and not playing
  useEffect(() => {
    if (!isPlaying && !isPaused) {
      setPlaybackStartBeat(editingBeat);
      const index = currentTrack.notes.findIndex((note) => note.beat >= editingBeat);
      setCurrentNoteIndex(index === -1 ? currentTrack.notes.length - 1 : index);
    }
  }, [editingBeat, currentTrack.notes, isPlaying, isPaused]);

  // Cleanup loop on unmount
  useEffect(() => {
    return () => {
      if (loopRef.current) {
        loopRef.current.dispose();
      }
    };
  }, []);
  const handleStop = useCallback(() => {
    try {
      // Stop getTransport()
      Tone.getTransport().stop();

      // Reset position to current editing beat
      setPlaybackStartBeat(editingBeat);
      const index = currentTrack.notes.findIndex((note) => note.beat >= editingBeat);
      setCurrentNoteIndex(index === -1 ? currentTrack.notes.length - 1 : index);

      setIsPlaying(false);
      setIsPaused(false);
    } catch (error) {
      console.error("Error during stop:", error);
    }
  }, [editingBeat, currentTrack.notes]);
  // Create or update loop when notes change
  const setupLoop = useCallback(() => {
    // Dispose of existing loop
    if (loopRef.current) {
      loopRef.current.dispose();
    }

    const sampler = getSamplerInstance();
    if (!sampler) return;

    // Clear any existing events
    Tone.getTransport().cancel();

    // Schedule each note individually
    currentTrack.notes.forEach((note) => {
      if (note.content && note.duration > 0) {
        // Schedule the note at the exact beat time
        Tone.getTransport().schedule(
          (time) => {
            sampler.sampler.triggerAttackRelease(
              note.content,
              beatToTime(note.duration, score.tempo),
              time
            );
            // dispatch(setEditingBeat(note.beat));
          },
          beatToTime(note.beat, score.tempo)
        );
      }
    });

    // Find the total duration of the track
    const lastNote = currentTrack.notes[currentTrack.notes.length - 1];
    if (lastNote) {
      // Schedule stop at the end of the last note
      const endTime = beatToTime(lastNote.beat + lastNote.duration, score.tempo);
      Tone.getTransport().schedule(() => {
        handleStop();
      }, endTime);
    }

    // Set getTransport() tempo
    Tone.getTransport().bpm.value = score.tempo;
  }, [currentTrack.notes, score.tempo, dispatch, handleStop]);

  const handlePlay = useCallback(async () => {
    if (isPaused) {
      setIsPaused(false);
      setIsPlaying(true);
      Tone.getTransport().start();
      return;
    }

    try {
      // Initialize audio context
      await Tone.start();
      const sampler = getSamplerInstance();
      if (!sampler) {
        console.error("Failed to initialize sampler");
        return;
      }

      // Wait for samples to load
      await Tone.loaded();
      console.log("start");
      // Setup the loop
      setupLoop();

      // Set getTransport() to start from the current beat
      Tone.getTransport().seconds = beatToTime(playbackStartBeat, score.tempo);

      // Start getTransport()
      Tone.getTransport().start();

      setIsPlaying(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error during playback:", error);
      handleStop();
    }
  }, [isPaused, playbackStartBeat, score.tempo, setupLoop, handleStop]);

  const handlePause = useCallback(() => {
    try {
      // Pause getTransport()
      Tone.getTransport().pause();

      // Store current position
      setPlaybackStartBeat(editingBeat);

      setIsPaused(true);
      setIsPlaying(false);
    } catch (error) {
      console.error("Error during pause:", error);
    }
  }, [editingBeat]);

  const handleStepBackward = useCallback(() => {
    if (!isPlaying && currentNoteIndex > 0) {
      const newIndex = currentNoteIndex - 1;
      setCurrentNoteIndex(newIndex);
      const newBeat = currentTrack.notes[newIndex].beat;
      dispatch(setEditingBeat(newBeat));
      setPlaybackStartBeat(newBeat);
    }
  }, [currentNoteIndex, currentTrack.notes, dispatch, isPlaying]);

  const handleStepForward = useCallback(() => {
    if (!isPlaying && currentNoteIndex < currentTrack.notes.length - 1) {
      const newIndex = currentNoteIndex + 1;
      setCurrentNoteIndex(newIndex);
      const newBeat = currentTrack.notes[newIndex].beat;
      dispatch(setEditingBeat(newBeat));
      setPlaybackStartBeat(newBeat);
    }
  }, [currentNoteIndex, currentTrack.notes, dispatch, isPlaying]);
  useEffect(() => {
    handleStop();
  }, [editingTrack, handleStop]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleStepBackward}
        className="rounded p-2 hover:bg-gray-700"
        title="Previous Note"
        disabled={isPlaying}
      >
        <BackwardIcon className="h-4 w-4" />
      </button>

      {isPlaying ? (
        <button
          onClick={handlePause}
          className="flex items-center gap-2 rounded bg-yellow-600 px-4 py-2 hover:bg-yellow-700"
          title="Pause"
        >
          <PauseIcon className="h-5 w-5" />
          <span>Pause</span>
        </button>
      ) : (
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 hover:bg-green-700"
          title={isPaused ? "Resume" : "Play"}
        >
          <PlayIcon className="h-5 w-5" />
          <span>{isPaused ? "Resume" : "Play"}</span>
        </button>
      )}

      <button
        onClick={handleStop}
        className={`flex items-center gap-2 rounded px-4 py-2 ${
          isPlaying || isPaused ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"
        }`}
        title="Stop"
      >
        <StopIcon className="h-5 w-5" />
        <span>Stop</span>
      </button>

      <button
        onClick={handleStepForward}
        className="rounded p-2 hover:bg-gray-700"
        title="Next Note"
        disabled={isPlaying}
      >
        <ForwardIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
