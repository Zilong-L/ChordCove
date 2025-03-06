
// 保持与 editor 中一致的类型与解析函数
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

// 只读版 renderer：根据传入的 lyrics 按行渲染，并对每一行进行和弦解析后展示
export default function SheetDisplay({ lyrics }: { lyrics: string }) {
  const lines = lyrics.split("\n");

  return (
    <div className="grid grid-cols-4 bg-white rounded-md px-4 py-2 min-h-[400px] content-start gap-2">
      {lines.map((line, idx) => {
        const { lyrics: plainLyrics, chords } = parseLine(line);
        return (
          <div
            key={idx}
            className="relative flex items-center bg-[#fafafa] pt-[2rem] min-h-[4rem] p-2 rounded-md hover:bg-stone-100 hover:shadow-md"
          >
            <div className="flex-grow">
              <div className="flex">
                {plainLyrics.split("").map((char, charIndex) => {
                  const chordData = chords.find((ch) => ch.position === charIndex);
                  return (
                    <span key={charIndex} className="relative text-zinc-900">
                      {chordData && (
                        <div className="absolute top-[-1.5em] text-teal-600 font-bold">
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
  );
}
