import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import BarView from "./BarView";
import ScorePlayer from "./ScorePlayer";
import { setEditingTrack, setShowLyricsForTrack } from "@stores/editingSlice";
import KeySelector from "./KeySelector";
import TempoControl from "./TempoControl";

export default function ScoreViewer({ autoShowLyrics = true }: { autoShowLyrics?: boolean }) {
  const dispatch = useDispatch();
  const score = useSelector((state: RootState) => state.score);
  const { showLyricsByTrack } = useSelector((state: RootState) => state.editing);

  useEffect(() => {
    // Ensure the playback components target the first track by default
    if (score.tracks.length > 0) {
      dispatch(setEditingTrack(0));
    }
  }, [dispatch, score.tracks.length]);

  useEffect(() => {
    if (!autoShowLyrics) return;

    score.tracks.forEach((track) => {
      if (showLyricsByTrack[track.id] === undefined) {
        dispatch(setShowLyricsForTrack({ trackId: track.id, value: true }));
      }
    });
  }, [autoShowLyrics, dispatch, score.tracks, showLyricsByTrack]);

  const allLyricsVisible = score.tracks.every((track) => showLyricsByTrack[track.id]);

  const handleToggleAllLyrics = () => {
    const nextValue = !allLyricsVisible;
    score.tracks.forEach((track) => {
      dispatch(setShowLyricsForTrack({ trackId: track.id, value: nextValue }));
    });
  };

  const handleToggleTrackLyrics = (trackId: string) => {
    const current = showLyricsByTrack[trackId] ?? false;
    dispatch(setShowLyricsForTrack({ trackId, value: !current }));
  };

  return (
    <div className="relative flex h-[calc(100vh-8rem)] w-full flex-col gap-6 overflow-y-scroll rounded-md bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] p-6 text-[var(--text-primary)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <KeySelector />
          <TempoControl />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded border border-[var(--border-primary)] px-3 py-2 text-sm transition hover:bg-[var(--bg-hover)]"
              onClick={handleToggleAllLyrics}
            >
              {allLyricsVisible ? "隐藏全部歌词" : "显示全部歌词"}
            </button>
            {score.tracks.map((track, index) => {
              const isVisible = showLyricsByTrack[track.id];
              const label = `轨道 ${index + 1}（${track.type === "melody" ? "主旋律" : "伴奏"}）`;
              return (
                <button
                  key={track.id}
                  onClick={() => handleToggleTrackLyrics(track.id)}
                  className={`rounded border px-3 py-2 text-sm transition ${
                    isVisible
                      ? "border-[var(--border-primary)] bg-[var(--bg-selected)] text-[var(--text-selected)]"
                      : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <ScorePlayer />
        </div>
      </div>
      <div className="flex-1 overflow-x-visible">
        <BarView allowEditing={false} />
      </div>
    </div>
  );
}
