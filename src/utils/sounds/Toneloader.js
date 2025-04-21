import { SampleLibrary } from './SampleLibrary';
import * as Tone from 'tone';


let globalChorous = new Tone.Chorus({
  frequency: 0.1,
  delayTime: 10,
  depth: 0.71,
  feedback: 0.47,
  spread: 181,
  wet: 1.0
}).connect(Tone.getDestination());



Tone.getContext().lookAhead = 0;
let globalSampler = null;

// **获取全局 Sampler**
function getSamplerInstance() {
  if (!globalSampler) {
    globalSampler = new SamplerManager();
  }
  return globalSampler;
}

// **创建新的 Sampler**
class SamplerManager {
  constructor(instrument = "piano", quality = "medium", filterFreq = 1200, panVal = 0) {
    this.sampler = SampleLibrary.load({
      instruments: instrument,
      baseUrl: "/samples/",
      quality: quality
    });

    // 添加效果
    this.filter = new Tone.Filter({ frequency: filterFreq, type: "lowpass", rolloff: -12 });
    this.gainNode = new Tone.Gain(0.5); // -6 dB
    this.panner = new Tone.Panner(panVal);

    // 连接音频链
    this.sampler.chain(this.filter, this.panner, this.gainNode, globalChorous);
  }

  setVolume(value) {
    this.gainNode.gain.rampTo(Math.min(1, value * 0.7));
  }

  setFilterFrequency(freq) {
    this.filter.frequency.rampTo(freq, 0.1);
  }
  setPortamento(value) {
    this.sampler.portamento = value;
  }

  setPan(value) {
    this.panner.pan.rampTo(value, 0.1);
  }

  async changeSampler(instrumentName, quality = "low") {
    const newSampler = SampleLibrary.load({
      instruments: instrumentName,
      baseUrl: "/samples/",
      quality: quality
    });

    await Tone.loaded();

    this.sampler.disconnect();
    newSampler.chain(this.filter, this.panner, this.gainNode, globalChorous);
    this.sampler.dispose();
    this.sampler = newSampler;
  }
}

export { getSamplerInstance };