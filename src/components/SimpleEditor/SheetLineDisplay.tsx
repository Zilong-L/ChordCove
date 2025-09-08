export type ChordData = { chord: string; position: number };

function parseLine(line: string) {
  const regex = /\[([^\]]+)\]/g;
  let lyricsOnly = "";
  const chords: ChordData[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    lyricsOnly += line.substring(lastIndex, match.index);
    // Adjust position for multi-character chords by using the match index directly
    chords.push({ chord: match[1], position: lyricsOnly.length });
    lastIndex = match.index + match[0].length;
  }

  lyricsOnly += line.substring(lastIndex);
  return { lyrics: lyricsOnly, chords };
}

export default function SheetLineDisplay({ text }: { text: string }) {
  const { lyrics: plainLyrics, chords } = parseLine(text);

  return (
    <div
      className={`relative flex min-h-[4rem] items-center rounded-md p-2 pt-[2rem] ${plainLyrics.length > 10 ? "col-span-2" : ""}`}
    >
      <div className="flex-grow">
        <div className="flex">
          {(() => {
            const elements = [];
            const originalLyricsLength = plainLyrics.length;
            const maxPosition = originalLyricsLength > 0 ? originalLyricsLength : 0;

            for (let pos = 0; pos <= maxPosition; pos++) {
              if (originalLyricsLength === 0 && pos > 0) continue;

              const char = pos < originalLyricsLength ? plainLyrics[pos] : null;
              const chordsAtPosition = chords.filter((ch) => ch.position === pos);

              if (char !== null || chordsAtPosition.length > 0) {
                elements.push(
                  <span key={`pos-${pos}`} className="relative text-[var(--text-primary)]">
                    {chordsAtPosition.length > 0 && (
                      <div className="absolute top-[-1.5em] left-0 flex gap-1 font-bold text-[var(--text-secondary)]">
                        {chordsAtPosition.map((cd, idx) => (
                          <span key={idx}>{cd.chord}</span>
                        ))}
                      </div>
                    )}
                    {char !== null ? (
                      char === " " ? (
                        <>&nbsp;</>
                      ) : (
                        char
                      )
                    ) : chordsAtPosition.length > 0 ? (
                      <span className="invisible">\u200B</span> // Invisible placeholder for chords after text
                    ) : null}
                  </span>
                );
              }
            }

            if (elements.length === 0 && text.trim() === "") {
              elements.push(
                <span key="empty-placeholder" className="text-[var(--text-primary)]">
                  &nbsp;
                </span>
              );
            }

            return elements;
          })()}
        </div>
      </div>
    </div>
  );
}
