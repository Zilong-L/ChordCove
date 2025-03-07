import { Note } from "tonal";

const RomanDegrees = ["I", "bII", "II", "bIII", "III", "IV", "bV", "V", "bVI", "VI", "bVII", "VII"];
const numberDegrees = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];
function calculateDegree(key:string | null, note:string | null,mode:string) {
    if(key===null || note === null) return ;
    const keyMidi = Note.get(key).midi;
    const noteMidi = Note.get(note).midi;
    
    if(keyMidi === null || noteMidi === null) {
        return ;
    }   
    const distance = ((noteMidi! - keyMidi!) % 12 + 12) % 12;
    if(mode === "number") return numberDegrees[distance];
    return RomanDegrees[distance];
}

export {calculateDegree};