import { BarData, Score, Slot } from "@/types/sheet";

function insertScore(score: Score, barNumber: number, slotBeat: number, note: string, duration: number, allowedDurations: number[]) {
  console.log('inserting', note, 'at', barNumber, slotBeat)
  if (note === "") return { newBars: score.bars, nextBarNumber: barNumber, nextBeat: slotBeat }
  let [currentBarNumber, currentBeat] = [barNumber - 1, slotBeat]
  let bars = structuredClone(score.bars)
  let sustain = false
  let remainingDuration = duration
  // const startBar = currentBarNumber;
  let startSlot :Slot|null= null;
  while (remainingDuration > 0) {
    let currentBar = bars[currentBarNumber].slots
    console.log('processing bar', currentBarNumber, 'beat', currentBeat)
    const slot = currentBar.find(slot => slot.beat === currentBeat)
    const result = splitSlot(slot!, note, remainingDuration, allowedDurations, sustain)
    const newSlots = result.newSlots

    if (newSlots.length != 1) {
      bars[currentBarNumber].slots = currentBar.map(_slot => slot === _slot ? newSlots : _slot).flat(1)
    }
    else {
      if (startSlot == null) {
        startSlot = newSlots[0] 
        bars[currentBarNumber].slots = currentBar.map(_slot => slot === _slot ? startSlot! : _slot)
      }else{
        startSlot.duration += newSlots[0].duration
        bars[currentBarNumber].slots = currentBar.filter(_slot => slot !== _slot)
      }
      currentBeat = currentBeat + remainingDuration
      remainingDuration = result.remainingDuration
      currentBeat -= remainingDuration
      if (currentBeat >= score.beatsPerBar) {
        currentBeat = currentBeat - score.beatsPerBar
        currentBarNumber++
        startSlot = null
        sustain= true;
      }
      if (currentBarNumber >= bars.length) {
        // add a new bar
        bars.push({
          id: crypto.randomUUID(),
          barNumber: currentBarNumber + 1,
          slots: [{
            beat: 0,
            duration: score.beatsPerBar,
            note: "",
            chord: "",
            lyric: "",
            sustain: false
          }
        ]
      })
    }
    console.log('setting sustain to false', currentBarNumber, currentBeat)
    console.log(currentBar)
  }
  
}
  bars[currentBarNumber].slots.find(slot => slot.beat === currentBeat)!.sustain = false

  return { newBars: bars, nextBarNumber: currentBarNumber + 1, nextBeat: currentBeat }
}




function splitSlot(slot: Slot, insertedNote: string, insertedDuration: number, allowedDurations: number[], sustain: boolean): { newSlots: Slot[], remainingDuration: number } {
  if (insertedDuration >= slot.duration) {
    return {
      newSlots: [{
        beat: slot.beat,
        duration: slot.duration,
        note: insertedNote,
        chord: "",
        lyric: "",
        sustain: sustain
      }],
      remainingDuration: insertedDuration - slot.duration
    };
  }

  let gap = slot.duration - insertedDuration;
  let restDurations = [];

  while (gap > 0) {
    const d = allowedDurations.find(val => val <= gap);
    if (d === undefined) break;
    restDurations.push(d);
    gap -= d;
  }

  restDurations.reverse();

  let newSlots: Slot[] = [{
    beat: slot.beat,
    duration: insertedDuration,
    note: insertedNote,
    chord: "",
    lyric: "",
    sustain: false
  }];

  let currentBeat = slot.beat + insertedDuration;
  for (let d of restDurations) {
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

export { insertScore, splitSlot }