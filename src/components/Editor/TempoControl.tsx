import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@stores/store";
import { setTempo } from "@stores/scoreSlice";

interface TempoControlProps {
  className?: string;
}

export default function TempoControl({ className = "" }: TempoControlProps) {
  const dispatch = useDispatch();
  const tempo = useSelector((state: RootState) => state.score.tempo);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = Number(e.target.value);
    const clamped = Math.max(20, Math.min(300, value || 0));
    dispatch(setTempo(clamped));
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span>Tempo</span>
      <input
        type="number"
        min={20}
        max={300}
        value={tempo}
        onChange={handleChange}
        className="w-20 rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 py-1 text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        aria-label="Tempo (BPM)"
      />
      <span className="text-[var(--text-tertiary)]">BPM</span>
    </div>
  );
}
