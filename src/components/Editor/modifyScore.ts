import { Score, Slot } from "@/types/sheet";

function insertScore(
  score: Score,
  barNumber: number,
  slotBeat: number,
  note: string,
  duration: number,
  allowedDurations: number[]
) {
  console.log("inserting", note, "at", barNumber, slotBeat);
  if (note === "") return { newBars: score.bars, nextBarNumber: barNumber, nextBeat: slotBeat };
  let [currentBarNumber, currentBeat] = [barNumber - 1, slotBeat];
  const bars = structuredClone(score.bars);
  let sustain = false;
  let remainingDuration = duration;
  // const startBar = currentBarNumber;
  let startSlot: Slot | null = null;
  while (remainingDuration > 0) {
    const currentBar = bars[currentBarNumber].slots;
    console.log("processing bar", currentBarNumber, "beat", currentBeat);
    const slot = currentBar.find((slot) => slot.beat === currentBeat);
    const result = splitSlot(slot!, note, remainingDuration, allowedDurations, sustain);
    const newSlots = result.newSlots;

    if (newSlots.length != 1) {
      bars[currentBarNumber].slots = currentBar
        .map((_slot) => (slot === _slot ? newSlots : _slot))
        .flat(1);
    } else {
      if (startSlot == null) {
        startSlot = newSlots[0];
        bars[currentBarNumber].slots = currentBar.map((_slot) =>
          slot === _slot ? startSlot! : _slot
        );
      } else {
        startSlot.duration += newSlots[0].duration;
        bars[currentBarNumber].slots = currentBar.filter((_slot) => slot !== _slot);
      }
      currentBeat = currentBeat + remainingDuration;
      remainingDuration = result.remainingDuration;
      currentBeat -= remainingDuration;
      if (currentBeat >= score.beatsPerBar) {
        currentBeat = currentBeat - score.beatsPerBar;
        currentBarNumber++;
        startSlot = null;
        sustain = true;
      }
      if (currentBarNumber >= bars.length) {
        // add a new bar
        bars.push({
          id: crypto.randomUUID(),
          barNumber: currentBarNumber + 1,
          slots: [
            {
              beat: 0,
              duration: score.beatsPerBar,
              note: "C4",
              chord: "\u00A0",
              lyric: "\u00A0",
              sustain: false,
            },
          ],
        });
      }
    }
  }
  bars[currentBarNumber].slots.find((slot) => slot.beat === currentBeat)!.sustain = false;

  return { newBars: bars, nextBarNumber: currentBarNumber + 1, nextBeat: currentBeat };
}

function splitSlot(
  slot: Slot,
  insertedNote: string,
  insertedDuration: number,
  allowedDurations: number[],
  sustain: boolean
): { newSlots: Slot[]; remainingDuration: number } {
  if (insertedDuration >= slot.duration) {
    return {
      newSlots: [
        {
          beat: slot.beat,
          duration: slot.duration,
          note: insertedNote,
          chord: "\u00A0",
          lyric: "\u00A0",
          sustain: sustain,
        },
      ],
      remainingDuration: insertedDuration - slot.duration,
    };
  }

  let gap = slot.duration - insertedDuration;
  const restDurations = [];

  while (gap > 0) {
    const d = allowedDurations.find((val) => val <= gap);
    if (d === undefined) break;
    restDurations.push(d);
    gap -= d;
  }

  restDurations.reverse();

  const newSlots: Slot[] = [
    {
      beat: slot.beat,
      duration: insertedDuration,
      note: insertedNote,
      chord: "",
      lyric: "",
      sustain: false,
    },
  ];

  let currentBeat = slot.beat + insertedDuration;
  for (const d of restDurations) {
    newSlots.push({
      beat: currentBeat,
      duration: d,
      note: slot.note,
      chord: slot.chord,
      lyric: slot.lyric,
      sustain: false,
    });
    currentBeat += d;
  }

  return { newSlots, remainingDuration: 0 };
}

export function editInfo(
  score: Score,
  barNumber: number,
  beat: number,
  property: "chord" | "lyric" | "extrainfo",
  value: string
) {
  // 找到目标小节
  const bar = score.bars[barNumber - 1];
  if (!bar) return score; // 如果没有这个小节，返回原始乐谱

  // 找到目标节拍
  const slot = bar.slots.find((slot) => slot.beat === beat);
  if (!slot) return score; // 如果没有这个拍子，返回原始乐谱

  // 修改相应的属性
  switch (property) {
    case "chord":
      slot.chord = value;
      break;
    case "lyric":
      slot.lyric = value;
      break;
    case "extrainfo":
      slot.extraInfo = value;
      break;
    default:
      return score; // 如果属性无效，返回原始乐谱
  }

  // 返回修改后的乐谱，保持其他部分不变
  return {
    ...score,
    bars: [...score.bars.slice(0, barNumber - 1), bar, ...score.bars.slice(barNumber)],
  };
}

export { insertScore, splitSlot };
