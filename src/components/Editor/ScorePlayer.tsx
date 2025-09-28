import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { PlayIcon, StopIcon } from "@heroicons/react/24/solid";

import { setPlayingBeat } from "@stores/editingSlice";
import { RootState } from "@stores/store";
import { scorePlaybackService } from "@utils/sounds/ScorePlaybackService";

export default function ScorePlayer() {
  const dispatch = useDispatch();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const score = useSelector((state: RootState) => state.score);
  const { editingBeat, isRecording } = useSelector((state: RootState) => state.editing);

  useEffect(() => {
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
  }, []);

  const handlePlay = useCallback(() => {
    scorePlaybackService.play(editingBeat);
  }, [editingBeat]);

  const handleTogglePlayback = useCallback(() => {
    if (isPlaying || isPaused) {
      handleStop();
    } else {
      handlePlay();
    }
  }, [handlePlay, handleStop, isPaused, isPlaying]);

  return (
    <div className="flex items-center">
      <button
        onClick={handleTogglePlayback}
        className="rounded p-2 hover:bg-[var(--bg-hover)]"
        title={isPlaying || isPaused ? "停止播放" : "播放"}
      >
        {isPlaying || isPaused ? (
          <StopIcon className="h-5 w-5 text-[var(--text-primary)]" />
        ) : (
          <PlayIcon className="h-5 w-5 text-[var(--text-primary)]" />
        )}
      </button>
    </div>
  );
}
