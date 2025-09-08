import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { setTempo } from "@stores/scoreSlice";

interface TempoControlProps {
  className?: string;
}

export default function TempoControl({ className = "" }: TempoControlProps) {
  const dispatch = useDispatch();
  const tempo = useSelector((state: RootState) => state.score.tempo);
  const [local, setLocal] = useState<string>(String(tempo));
  const [editing, setEditing] = useState(false);

  // Keep local value in sync with store when not editing
  useEffect(() => {
    if (!editing) setLocal(String(tempo));
  }, [tempo, editing]);

  const commit = () => {
    const n = Number(local);
    if (!Number.isFinite(n)) {
      setLocal(String(tempo));
      setEditing(false);
      return;
    }
    const clamped = Math.max(20, Math.min(300, Math.round(n)));
    if (clamped !== tempo) dispatch(setTempo(clamped));
    setLocal(String(clamped));
    setEditing(false);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      commit();
    } else if (e.key === "Escape") {
      setLocal(String(tempo));
      setEditing(false);
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span>Tempo</span>
      <input
        type="number"
        min={20}
        max={300}
        value={local}
        onChange={(e) => {
          setEditing(true);
          setLocal(e.target.value);
        }}
        onBlur={commit}
        onFocus={() => setEditing(true)}
        onKeyDown={handleKeyDown}
        className="w-20 rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        aria-label="Tempo (BPM)"
      />
      <span className="text-[var(--text-tertiary)]">BPM</span>
    </div>
  );
}
