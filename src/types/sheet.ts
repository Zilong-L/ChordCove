export interface SimpleScore {
  tempo: number;
  key: string;
  timeSignature: string;
  content: string;
}
export interface SheetMetaData {
  id: string;
  title: string;
  uploader: string;
  uploaderId: number;
  coverImage: string;
  bvid?: string;
  singers?: Array<{
    id: number;
    name: string;
    role: string;
  }>;
  composers?: Array<{
    id: number;
    name: string;
    role: string;
  }>;
}

// Types
export const durationValues = {
  1: 4, // whole note
  2: 2, // half note
  4: 1, // quarter note
  8: 0.5, // eighth note
  16: 0.25, // sixteenth note
  32: 0.125, // thirty-second note
} as const;

export type NoteDuration = keyof typeof durationValues;
