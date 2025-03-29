import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@stores/store";
import { setSheetMetadata } from "@stores/sheetMetadataSlice";
import { setSimpleScore } from "@stores/simpleScoreSlice";
import { fetchApi } from "@utils/api";
import { SheetMetaData } from "#types/sheet";

import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
export type ChordData = { chord: string; position: number };

import { API_BASE_URL, R2_BASE_URL } from "@utils/api";
function parseLine(line: string) {
  const regex = /\[([^\]]+)\]/g;
  let lyricsOnly = "";
  const chords: ChordData[] = [];
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

export default function SheetDisplay() {
  const sheetId = useLocation().pathname.split("/").pop();
  const simpleScore = useSelector((state: RootState) => state.simpleScore);
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  console.log(simpleScore);
  const dispatch = useDispatch();
  const [sheetMissing, setSheetMissing] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const sheetMetadata = await fetchApi<SheetMetaData>(
          `${API_BASE_URL}/api/get-sheet-metadata/${sheetId}`
        );
        dispatch(setSheetMetadata(sheetMetadata));
        const sheetData = await fetch(`${R2_BASE_URL}/sheets/${sheetMetadata.id}.json`).then(
          (res) => res.json()
        );
        dispatch(setSimpleScore(sheetData));
      } catch (error) {
        console.error("Error fetching sheet:", error);
        setSheetMissing(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lines = simpleScore.content?.split("\n");

  if (sheetMissing) {
    return (
      <div className="min-h-[80%] rounded-md bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] px-8 py-12 xl:px-24">
        {sheetMissing && (
          <h1 className="text-center text-3xl text-[var(--text-primary)]">Sheet Not Found</h1>
        )}
      </div>
    );
  }
  return (
    <div className="min-h-[80%] overflow-scroll rounded-md bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] px-8 py-12 xl:px-24">
      <h2 className="mb-2 min-h-16 text-center text-3xl font-bold text-[var(--text-primary)]">
        {sheetMetadata.title}
      </h2>
      <div className="mb-6 flex items-center justify-between text-[var(--text-primary)]">
        <div className="text-lg">
          <div className="grid grid-flow-row grid-cols-[80px_50px]">
            <p>Key:</p>
            <p className="px-2">{simpleScore.key}</p>
          </div>
          <div className="grid grid-flow-row grid-cols-[80px_50px]">
            <p>Tempo:</p>
            <p className="px-2">{simpleScore.tempo}</p>{" "}
          </div>
        </div>
        <div className="grid grid-cols-[100px_100px] text-left">
          <p>Singer:</p>
          <p>
            {" "}
            {sheetMetadata.singers?.map((singer) => singer.name).join(", ") || "Unknown Singer"}
          </p>
          <p>Upload:</p>
          <p> {sheetMetadata.uploader}</p>
          <p>Composer:</p>
          <p>
            {" "}
            {sheetMetadata.composers?.map((composer) => composer.name).join(", ") ||
              "Unknown Composer"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 content-start gap-2 md:grid-cols-4">
        {lines.map((line, idx) => {
          const { lyrics: plainLyrics, chords } = parseLine(line);
          return (
            <div
              key={idx}
              className={`relative flex min-h-[4rem] items-center rounded-md p-2 pt-[2rem] ${plainLyrics.length > 10 ? "col-span-2" : ""}`}
            >
              <div className="flex-grow">
                <div className="flex">
                  {plainLyrics.split("").map((char, charIndex) => {
                    const chordData = chords.find((ch) => ch.position === charIndex);
                    return (
                      <span key={charIndex} className="relative text-[var(--text-primary)]">
                        {chordData && (
                          <div className="absolute top-[-1.5em] font-bold text-[var(--text-secondary)]">
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
