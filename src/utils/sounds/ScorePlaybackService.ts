import * as Tone from "tone";
import { getSamplerInstance } from "./Toneloader";
import type { Track, MelodySlot, AccompanimentSlot } from "@stores/scoreSlice";

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentBeat: number | null;
}

export class ScorePlaybackService {
  private tempo: number = 120;
  private tracks: Track[] = [];
  private onStateChange?: (state: PlaybackState) => void;
  private onBeatChange?: (beat: number) => void;
  private isSetup: boolean = false;

  constructor() {
    // Cleanup when the service is destroyed
    this.stop = this.stop.bind(this);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
  }

  private beatToTime(beat: number): number {
    return (beat * 60) / this.tempo;
  }

  onPlaybackStateChange(callback: (state: PlaybackState) => void) {
    this.onStateChange = callback;
  }

  onPlayingBeatChange(callback: (beat: number) => void) {
    this.onBeatChange = callback;
  }

  private updateState(state: Partial<PlaybackState>) {
    if (this.onStateChange) {
      this.onStateChange({
        isPlaying: false,
        isPaused: false,
        currentBeat: null,
        ...state,
      });
    }
  }

  async setup(tracks: Track[], tempo: number) {
    this.tracks = tracks;
    this.tempo = tempo;
    Tone.getTransport().bpm.value = tempo;

    const sampler = getSamplerInstance();
    if (!sampler) return;

    // Clear any existing events
    Tone.getTransport().cancel();

    const allValidSlots = this.tracks.flatMap((track) => {
      return track.slots.map((slot) => {
        if (track.type === "melody") {
          return { ...(slot as MelodySlot), trackType: track.type };
        } else {
          return { ...(slot as AccompanimentSlot), trackType: track.type };
        }
      });
    });

    const sortedSlots = allValidSlots.sort((a, b) => a.beat - b.beat);

    sortedSlots.forEach((slot) => {
      const isMelodySlot = slot.trackType === "melody";
      const isAccompanimentSlot = slot.trackType === "accompaniment";

      if (
        (isMelodySlot && (slot as MelodySlot).note) ||
        (isAccompanimentSlot && (slot as AccompanimentSlot).notes.length > 0)
      ) {
        Tone.getTransport().schedule((time) => {
          if (this.onBeatChange) {
            this.onBeatChange(slot.beat);
          }

          if (isMelodySlot) {
            sampler.sampler.triggerAttackRelease(
              (slot as MelodySlot).note,
              this.beatToTime(slot.duration),
              time
            );
          } else {
            (slot as AccompanimentSlot).notes.forEach((note) => {
              sampler.sampler.triggerAttackRelease(note, this.beatToTime(slot.duration), time);
            });
          }
        }, this.beatToTime(slot.beat));
      }
    });

    this.isSetup = true;
  }

  async play(startBeat: number) {
    if (!this.isSetup) {
      console.error("Playback service not set up");
      return;
    }

    try {
      await Tone.start();
      const sampler = getSamplerInstance();
      if (!sampler) {
        console.error("Failed to initialize sampler");
        return;
      }

      await Tone.loaded();
      Tone.getTransport().seconds = this.beatToTime(startBeat);
      Tone.getTransport().start();

      this.updateState({ isPlaying: true, isPaused: false });
    } catch (error) {
      console.error("Error during playback:", error);
      this.stop();
    }
  }

  pause() {
    Tone.getTransport().pause();
    this.updateState({ isPlaying: false, isPaused: true });
  }

  stop() {
    Tone.getTransport().stop();
    this.updateState({ isPlaying: false, isPaused: false, currentBeat: null });
  }

  dispose() {
    this.stop();
    Tone.getTransport().cancel();
    this.isSetup = false;
  }
}

// Export a singleton instance
export const scorePlaybackService = new ScorePlaybackService();
