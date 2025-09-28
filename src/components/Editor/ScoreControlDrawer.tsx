import ScoreControls from "./ScoreControls";

interface ScoreControlDrawerProps {
  open: boolean;
  onToggle: () => void;
}

export default function ScoreControlDrawer({ open, onToggle }: ScoreControlDrawerProps) {
  const transform = open ? "translateX(0)" : "translateX(calc(100% ))";

  return (
    <div className="absolute top-[30%] right-0 z-20 flex h-full items-start">
      <div className="relative transition-transform duration-300 ease-in-out" style={{ transform }}>
        <div className={open ? "pointer-events-auto" : "pointer-events-none"}>
          <ScoreControls className="h-full pr-2" />
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          title={open ? "收起控制面板" : "展开控制面板"}
          aria-label={open ? "收起控制面板" : "展开控制面板"}
          className="absolute bottom-[5.5rem] left-[-2.5rem] flex h-10 w-10 items-center justify-center border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-lg text-[var(--text-primary)] shadow-lg"
        >
          {open ? "»" : "«"}
        </button>
      </div>
    </div>
  );
}
