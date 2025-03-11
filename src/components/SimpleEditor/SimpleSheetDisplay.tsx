export type ChordData = { chord: string; position: number };

function parseLine(line: string) {
  const regex = /\[([^\]]+)\]/g;
  let lyricsOnly = "";
  let chords: ChordData[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    lyricsOnly += line.substring(lastIndex, match.index);
    chords.push({ chord: match[1], position: lyricsOnly.length });
    lastIndex = match.index + match[0].length;
  }

  lyricsOnly += line.substring(lastIndex);
  return { lyrics: lyricsOnly, chords };
}

export default function SheetDisplay({ lyrics }: { lyrics: string }) {
  const lines = lyrics.split("\n");

  return (
    <div className="bg-gradient-to-b from-[#212121] to-[#121212] rounded-md py-12 px-8 xl:px-24  min-h-[700px]">
  
      <div className="grid grid-cols-2 md:grid-cols-4  content-start gap-2">
        {lines.map((line, idx) => {
          const { lyrics: plainLyrics, chords } = parseLine(line);
          return (
            <div
              key={idx}
              className="relative flex items-center min-h-[4rem] pt-[2rem] p-2 rounded-md"
            >
              <div className="flex-grow">
                <div className="flex">
                  {plainLyrics.split("").map((char, charIndex) => {
                    const chordData = chords.find((ch) => ch.position === charIndex);
                    return (
                      <span key={charIndex} className="relative text-gray-100">
                        {chordData && (
                          <div className="absolute top-[-1.5em] text-gray-300 font-bold">
                            {chordData.chord}
                          </div>
                        )}
                        {char === " " ? "\u00A0" : char}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}