import { Chord } from "tonal";

const rareChordType = ["m#5"];

export class ToanlWrapper {
  static init() { }

  static detect(source: string[]) {
    const orginalDetections = Chord.detect(source);
    return orginalDetections.filter((detection) => {
      return !rareChordType.some((d) => detection.includes(d));
    });
  }

  static simplifyChord(chordString: string) {
    const chord = Chord.get(chordString);
    const type = chord.type;
    if (type.includes("minor")) {
      return chord.tonic + "m";
    } else if (type.includes("major")) {
      return chord.tonic + "M";
    } else if (type.includes("diminished")) {
      return chord.tonic + "dim";
    } else if (type.includes("sus")) {
      return chord.tonic + "M ";
    }

    return chordString;

    console.log(type);
  }
}
