import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import {
  PlayIcon,
  StopIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
} from "@heroicons/react/24/solid";
import { setEditingBeat, setPlayingBeat } from "@stores/editingSlice";
import { scorePlaybackService } from "@utils/sounds/ScorePlaybackService";

interface ScorePlayerProps {
  className?: string;
  showStepControls?: boolean;
  showStopButton?: boolean;
}

export default function ScorePlayer({
  className = "",
  showStepControls = true,
  showStopButton = true,
}: ScorePlayerProps) {
  const dispatch = useDispatch();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  const score = useSelector((state: RootState) => state.score);
  const { editingTrack, editingBeat, isRecording } = useSelector(
    (state: RootState) => state.editing
  );
  const currentTrack = score.tracks[editingTrack];

  // Update playback start position when editing beat changes and not playing
  useEffect(() => {
    if (!isPlaying && !isPaused) {
      const index = currentTrack.slots.findIndex((slot) => slot.beat >= editingBeat);
      setCurrentNoteIndex(index === -1 ? currentTrack.slots.length - 1 : index);
    }
  }, [editingBeat, currentTrack.slots, isPlaying, isPaused]);

  // Setup playback service
  useEffect(() => {
    // Don't setup if recording is active
    if (isRecording) return;

    scorePlaybackService.setup(score.tracks, score.tempo);

    scorePlaybackService.onPlaybackStateChange((state) => {
      setIsPlaying(state.isPlaying);
      setIsPaused(state.isPaused);
      if (state.currentBeat === null) {
        dispatch(setPlayingBeat(null));
      }
    });

    scorePlaybackService.onPlayingBeatChange((beat) => {
      dispatch(setPlayingBeat(beat));
    });

    return () => {
      if (!isRecording) {
        scorePlaybackService.dispose();
        dispatch(setPlayingBeat(null));
      }
    };
  }, [score.tracks, score.tempo, dispatch, isRecording]);

  const handleStop = useCallback(() => {
    scorePlaybackService.stop();
    const index = currentTrack.slots.findIndex((slot) => slot.beat >= editingBeat);
    setCurrentNoteIndex(index === -1 ? currentTrack.slots.length - 1 : index);
  }, [editingBeat, currentTrack.slots]);

  const handlePlay = useCallback(async () => {
    if (isPaused) {
      scorePlaybackService.play(editingBeat);
      return;
    }
    scorePlaybackService.play(editingBeat);
  }, [isPaused, editingBeat]);

  const handlePause = useCallback(() => {
    scorePlaybackService.pause();
  }, []);

  const handleStepBackward = useCallback(() => {
    if (!isPlaying && currentNoteIndex > 0) {
      const newIndex = currentNoteIndex - 1;
      setCurrentNoteIndex(newIndex);
      const newBeat = currentTrack.slots[newIndex].beat;
      dispatch(setEditingBeat(newBeat));
    }
  }, [currentNoteIndex, currentTrack.slots, dispatch, isPlaying]);

  const handleStepForward = useCallback(() => {
    if (!isPlaying && currentNoteIndex < currentTrack.slots.length - 1) {
      const newIndex = currentNoteIndex + 1;
      setCurrentNoteIndex(newIndex);
      const newBeat = currentTrack.slots[newIndex].beat;
      dispatch(setEditingBeat(newBeat));
    }
  }, [currentNoteIndex, currentTrack.slots, dispatch, isPlaying]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showStepControls && (
        <button
          onClick={handleStepBackward}
          className="rounded p-2 hover:bg-[var(--bg-hover)]"
          title="Previous Note"
          disabled={isPlaying}
        >
          <BackwardIcon className="h-4 w-4 text-[var(--text-primary)]" />
        </button>
      )}

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

      {showStopButton && (
        <button
          onClick={handleStop}
          className="rounded p-2 hover:bg-[var(--bg-hover)]"
          title="Stop"
        >
          <StopIcon className="h-4 w-4 text-[var(--text-primary)]" />
        </button>
      )}

      {showStepControls && (
        <button
          onClick={handleStepForward}
          className="rounded p-2 hover:bg-[var(--bg-hover)]"
          title="Next Note"
          disabled={isPlaying}
        >
          <ForwardIcon className="h-4 w-4 text-[var(--text-primary)]" />
        </button>
      )}
    </div>
  );
}
