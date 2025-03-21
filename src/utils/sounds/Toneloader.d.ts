import * as Tone from "tone";

export interface SamplerManager {
  sampler: Tone.Sampler;
  filter: Tone.Filter;
  gainNode: Tone.Gain;
  panner: Tone.Panner;
  setVolume: (value: number) => void;
  setFilterFrequency: (freq: number) => void;
  setPortamento: (value: number) => void;
  setPan: (value: number) => void;
  changeSampler: (instrumentName: string, quality?: string) => Promise<void>;
}

export function getSamplerInstance(): SamplerManager | null;
