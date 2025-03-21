import React from "react";

interface NoteDisplayProps {
  content: React.ReactNode;
  underlineCount: number;
  hasDot: boolean;
  isLastInGroup: boolean;
}

export const NoteDisplay = React.memo(
  ({ content, underlineCount, hasDot, isLastInGroup }: NoteDisplayProps) => {
    return (
      <div className="relative w-full text-center">
        {/* Note content and dot */}
        <div className="relative inline-block">
          <div className="flex flex-col items-center">
            <span className="font-bold">{content}</span>
          </div>
          {hasDot && <span className="absolute -right-2 top-1/2 -translate-y-1/2">.</span>}
        </div>

        {/* Underlines container - absolutely positioned */}
        {underlineCount > 0 && (
          <div
            className="absolute left-0 right-0"
            style={{
              top: "100%",
              width: isLastInGroup ? "100%" : "calc(100% + 4px)",
              height: `${underlineCount * 3}px`,
              pointerEvents: "none",
            }}
          >
            {Array.from({ length: underlineCount }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full bg-white"
                style={{
                  height: "1px",
                  top: `${i * 3}px`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);
