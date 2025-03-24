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
import { setEditingBeat, setPlaybackStartBeat, setPlayingBeat } from "@stores/editingSlice";
import type { MelodySlot, AccompanimentSlot } from "@stores/scoreSlice";

interface ScorePlayerProps {
  className?: string;
}

export default function ScorePlayer({ className = "" }: ScorePlayerProps) {
  const dispatch = useDispatch();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  // Use ref to store the loop so we can clean it up
  const loopRef = useRef<Tone.Loop | null>(null);

  const score = useSelector((state: RootState) => state.score);
  const { editingTrack, editingBeat, playbackStartBeat, playbackEndBeat } = useSelector(
    (state: RootState) => state.editing
  );
  const currentTrack = score.tracks[editingTrack];

  // Convert beat position to time in seconds
  const beatToTime = (beat: number, bpm: number) => {
    return (beat * 60) / bpm;
  };

  // Update playback start position when editing beat changes and not playing
  useEffect(() => {
    if (!isPlaying && !isPaused) {
      const index = currentTrack.slots.findIndex((slot) => slot.beat >= editingBeat);
      setCurrentNoteIndex(index === -1 ? currentTrack.slots.length - 1 : index);
    }
  }, [editingBeat, currentTrack.slots, isPlaying, isPaused]);

  // Cleanup loop on unmount
  useEffect(() => {
    return () => {
      if (loopRef.current) {
        loopRef.current.dispose();
      }
      dispatch(setPlayingBeat(null));
    };
  }, [dispatch]);

  const handleStop = useCallback(() => {
    try {
      // Stop getTransport()
      Tone.getTransport().stop();

      dispatch(setPlayingBeat(null));
      const index = currentTrack.slots.findIndex((slot) => slot.beat >= editingBeat);
      setCurrentNoteIndex(index === -1 ? currentTrack.slots.length - 1 : index);

      setIsPlaying(false);
      setIsPaused(false);
    } catch (error) {
      console.error("Error during stop:", error);
    }
  }, [editingBeat, currentTrack.slots, dispatch]);

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
    console.log("All tracks:", score.tracks);
    let scheduledNotes = 0;

    // 收集所有轨道的音符
    const allValidSlots = score.tracks
      .filter((t) => t.type === "melody" || t.type === "accompaniment")
      .flatMap((track) => {
        return track.slots
          .filter(
            (slot) =>
              slot.beat >= playbackStartBeat &&
              (playbackEndBeat === null || slot.beat <= playbackEndBeat)
          )
          .map((slot) => {
            if (track.type === "melody") {
              return { ...(slot as MelodySlot), trackType: track.type };
            } else {
              return { ...(slot as AccompanimentSlot), trackType: track.type };
            }
          });
      });

    // 按照 beat 排序，确保按时间顺序播放
    const sortedSlots = allValidSlots.sort((a, b) => a.beat - b.beat);

    sortedSlots.forEach((slot) => {
      const isMelodySlot = slot.trackType === "melody";
      const isAccompanimentSlot = slot.trackType === "accompaniment";

      if (
        (isMelodySlot && (slot as MelodySlot).note && !(slot as MelodySlot).sustain) ||
        (isAccompanimentSlot && (slot as AccompanimentSlot).notes.length > 0)
      ) {
        // Schedule the note at the exact beat time
        console.log("Scheduling note:", {
          note: isMelodySlot ? (slot as MelodySlot).note : (slot as AccompanimentSlot).notes,
          beat: slot.beat,
          duration: slot.duration,
          tempo: score.tempo,
        });
        scheduledNotes++;

        // 更新当前播放的 beat
        Tone.getTransport().schedule(
          (time) => {
            dispatch(setPlayingBeat(slot.beat));

            if (isMelodySlot) {
              sampler.sampler.triggerAttackRelease(
                (slot as MelodySlot).note,
                beatToTime(slot.duration, score.tempo),
                time
              );
            } else {
              // For accompaniment, play all notes simultaneously
              (slot as AccompanimentSlot).notes.forEach((note) => {
                sampler.sampler.triggerAttackRelease(
                  note,
                  beatToTime(slot.duration, score.tempo),
                  time
                );
              });
            }
          },
          beatToTime(slot.beat, score.tempo)
        );
      }
    });

    // 如果设置了 playbackEndBeat，安排在结束时停止播放
    if (playbackEndBeat !== null) {
      // 在最后一个音符结束后停止
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      if (lastSlot) {
        const stopTime = beatToTime(lastSlot.beat + (lastSlot.duration || 1), score.tempo);
        console.log("Scheduling stop at:", stopTime);
        Tone.getTransport().schedule(() => {
          handleStop();
        }, stopTime);
      }
    }

    console.log("Total notes scheduled:", scheduledNotes);

    // Set transport tempo and start position
    Tone.getTransport().bpm.value = score.tempo;
    Tone.getTransport().seconds = beatToTime(playbackStartBeat, score.tempo);
  }, [score.tracks, score.tempo, playbackEndBeat, playbackStartBeat, dispatch, handleStop]);

  const handlePlay = useCallback(async () => {
    if (playbackStartBeat > playbackEndBeat!) {
      console.log(playbackStartBeat, playbackEndBeat);
      return;
    }
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

      // Start transport
      Tone.getTransport().start();

      setIsPlaying(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error during playback:", error);
      handleStop();
    }
  }, [isPaused, setupLoop, handleStop]);

  const handlePause = useCallback(() => {
    try {
      // Pause getTransport()
      Tone.getTransport().pause();

      // Store current position
      dispatch(setPlaybackStartBeat(editingBeat));

      setIsPaused(true);
      setIsPlaying(false);
    } catch (error) {
      console.error("Error during pause:", error);
    }
  }, [editingBeat, dispatch]);

  const handleStepBackward = useCallback(() => {
    if (!isPlaying && currentNoteIndex > 0) {
      const newIndex = currentNoteIndex - 1;
      setCurrentNoteIndex(newIndex);
      const newBeat = currentTrack.slots[newIndex].beat;
      dispatch(setEditingBeat(newBeat));
      dispatch(setPlaybackStartBeat(newBeat));
    }
  }, [currentNoteIndex, currentTrack.slots, dispatch, isPlaying]);

  const handleStepForward = useCallback(() => {
    if (!isPlaying && currentNoteIndex < currentTrack.slots.length - 1) {
      const newIndex = currentNoteIndex + 1;
      setCurrentNoteIndex(newIndex);
      const newBeat = currentTrack.slots[newIndex].beat;
      dispatch(setEditingBeat(newBeat));
      dispatch(setPlaybackStartBeat(newBeat));
    }
  }, [currentNoteIndex, currentTrack.slots, dispatch, isPlaying]);

  useEffect(() => {
    handleStop();
  }, [editingTrack, handleStop]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleStepBackward}
        className="rounded p-2 hover:bg-[var(--bg-hover)]"
        title="Previous Note"
        disabled={isPlaying}
      >
        <BackwardIcon className="h-4 w-4 text-[var(--text-primary)]" />
      </button>

      {isPlaying ? (
        <button
          onClick={handlePause}
          className="rounded p-2 hover:bg-[var(--bg-hover)]"
          title="Pause"
        >
          <PauseIcon className="h-4 w-4 text-[var(--text-primary)]" />
        </button>
      ) : isPaused ? (
        <button
          onClick={handlePlay}
          className="rounded p-2 hover:bg-[var(--bg-hover)]"
          title="Resume"
        >
          <PlayIcon className="h-4 w-4 text-[var(--text-primary)]" />
        </button>
      ) : (
        <button
          onClick={handlePlay}
          className="rounded p-2 hover:bg-[var(--bg-hover)]"
          title="Play"
        >
          <PlayIcon className="h-4 w-4 text-[var(--text-primary)]" />
        </button>
      )}

      <button onClick={handleStop} className="rounded p-2 hover:bg-[var(--bg-hover)]" title="Stop">
        <StopIcon className="h-4 w-4 text-[var(--text-primary)]" />
      </button>

      <button
        onClick={handleStepForward}
        className="rounded p-2 hover:bg-[var(--bg-hover)]"
        title="Next Note"
        disabled={isPlaying}
      >
        <ForwardIcon className="h-4 w-4 text-[var(--text-primary)]" />
      </button>
    </div>
  );
}
