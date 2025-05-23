/**
* @fileoverview A sample library and quick-loader for tone.js
*
* @author N.P. Brosowsky (nbrosowsky@gmail.com)
* https://github.com/nbrosowsky/tonejs-instruments
*/
import * as Tone from 'tone';

var SampleLibrary = {
    minify: false,
    ext: '.mp3', // use setExt to change the extensions on all files // do not change this variable //
    baseUrl: '/samples/', // 默认采样器路径
    list: ['bass-electric', 'bassoon', 'cello', 'clarinet', 'contrabass', 'flute', 'french-horn', 'guitar-acoustic', 'guitar-electric', 'guitar-nylon', 'harmonium', 'harp', 'organ', 'piano', 'saxophone', 'trombone', 'trumpet', 'tuba', 'violin', 'xylophone'],
    synthList: ['triangle', 'square', 'sawtooth', 'pad'], // 预制合成器
    onload: null,

    setExt: function (newExt) {
        var i
        for (i = 0; i <= this.list.length - 1; i++) {
            for (var property in this[this.list[i]]) {

                this[this.list[i]][property] = this[this.list[i]][property].replace(this.ext, newExt)
            }


        }
        this.ext = newExt;
        return console.log("sample extensions set to " + this.ext)
    },
    loadSynth: function (type) {
        let synth;
        switch (type) {
            case 'triangle':
                synth = new Tone.PolySynth({
                    oscillator: { type: 'triangle' },
                    envelope: { attack: 0.05, decay: 0.1, sustain: 1, release: 0.5 }
                });
                break;
            case 'square':
                synth = new Tone.PolySynth({
                    oscillator: { type: 'square' },
                    envelope: { attack: 0.02, decay: 0.15, sustain: 0.8, release: 0.5 }
                });
                break;
            case 'sawtooth':
                synth = new Tone.PolySynth({
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 }
                });
                break;
            case 'pad':
                synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.5, decay: 0.5, sustain: 0.9, release: 2 }
                });
                break;
            default:
                console.warn(`Unknown synth type: ${type}`);
                return null;
        }

        return synth;
    },
    load: function (arg) {
        var t, rt, i;
        t = arg || {};
        t.instruments = t.instruments || this.list;
        t.baseUrl = t.baseUrl || this.baseUrl;
        t.onload = t.onload || this.onload;

        // 如果传了 synth，切换到合成器路径
        if (this.synthList.includes(t.instruments)) {
            return this.loadSynth(t.instruments);
        }
        // Update extensions if arg given
        if (t.ext) {
            if (t.ext !== this.ext) {
                this.setExt(t.ext);
            }
            t.ext = this.ext;
        }

        rt = {};

        // Function to determine minification factor based on quality
        const getMinBy = (quality) => {
            switch (quality) {
                case 'low':
                    return 6; // Use fewer samples
                case 'medium':
                    return 4; // Moderate number of samples
                case 'high':
                    return 2; // High-quality, more samples
                case 'full':
                default:
                    return 1; // Load all samples
            }
        };

        const minifySamples = (samples, quality) => {
            const minBy = getMinBy(quality);
            // Create a new object with the filtered keys
            const filteredSamples = Object.keys(samples)
                .filter((_, index) => index % minBy === 0) // Keep only the required samples
                .reduce((filtered, key) => {
                    filtered[key] = samples[key]; // Add filtered keys to the new object
                    return filtered;
                }, {});

            return filteredSamples; // Return the filtered object
        };


        if (Array.isArray(t.instruments)) {
            for (i = 0; i <= t.instruments.length - 1; i++) {
                var newT = this[t.instruments[i]];
                // Generate a filtered list of samples based on quality
                const filteredSamples = t.quality ? minifySamples(newT, t.quality) : newT;

                rt[t.instruments[i]] = new Tone.Sampler(
                    filteredSamples,
                    {
                        baseUrl: t.baseUrl + t.instruments[i] + "/",
                        onload: t.onload
                    }
                );
            }

            return rt;

            // If a single instrument name is passed...
        } else {
            var newT = this[t.instruments];
            // Generate a filtered list of samples based on quality
            const filteredSamples = t.quality ? minifySamples(newT, t.quality) : newT;

            return new Tone.Sampler(
                filteredSamples,
                {
                    baseUrl: t.baseUrl + t.instruments + "/",
                    onload: t.onload
                }
            );
        }
    },


    'bass-electric': {
        'A#1': 'As1.mp3',
        'A#2': 'As2.mp3',
        'A#3': 'As3.mp3',
        'A#4': 'As4.mp3',
        'C#1': 'Cs1.mp3',
        'C#2': 'Cs2.mp3',
        'C#3': 'Cs3.mp3',
        'C#4': 'Cs4.mp3',
        'E1': 'E1.mp3',
        'E2': 'E2.mp3',
        'E3': 'E3.mp3',
        'E4': 'E4.mp3',
        'G1': 'G1.mp3',
        'G2': 'G2.mp3',
        'G3': 'G3.mp3',
        'G4': 'G4.mp3'
    },

    'bassoon': {
        'A4': 'A4.mp3',
        'C3': 'C3.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'E4': 'E4.mp3',
        'G2': 'G2.mp3',
        'G3': 'G3.mp3',
        'G4': 'G4.mp3',
        'A2': 'A2.mp3',
        'A3': 'A3.mp3'

    },

    'cello': {
        'E3': 'E3.mp3',
        'E4': 'E4.mp3',
        'F2': 'F2.mp3',
        'F3': 'F3.mp3',
        'F4': 'F4.mp3',
        'F#3': 'Fs3.mp3',
        'F#4': 'Fs4.mp3',
        'G2': 'G2.mp3',
        'G3': 'G3.mp3',
        'G4': 'G4.mp3',
        'G#2': 'Gs2.mp3',
        'G#3': 'Gs3.mp3',
        'G#4': 'Gs4.mp3',
        'A2': 'A2.mp3',
        'A3': 'A3.mp3',
        'A4': 'A4.mp3',
        'A#2': 'As2.mp3',
        'A#3': 'As3.mp3',
        'B2': 'B2.mp3',
        'B3': 'B3.mp3',
        'B4': 'B4.mp3',
        'C2': 'C2.mp3',
        'C3': 'C3.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'C#3': 'Cs3.mp3',
        'C#4': 'Cs4.mp3',
        'D2': 'D2.mp3',
        'D3': 'D3.mp3',
        'D4': 'D4.mp3',
        'D#2': 'Ds2.mp3',
        'D#3': 'Ds3.mp3',
        'D#4': 'Ds4.mp3',
        'E2': 'E2.mp3'

    },

    'clarinet': {
        'D4': 'D4.mp3',
        'D5': 'D5.mp3',
        'D6': 'D6.mp3',
        'F3': 'F3.mp3',
        'F4': 'F4.mp3',
        'F5': 'F5.mp3',
        'F#6': 'Fs6.mp3',
        'A#3': 'As3.mp3',
        'A#4': 'As4.mp3',
        'A#5': 'As5.mp3',
        'D3': 'D3.mp3'

    },

    'contrabass': {
        'C2': 'C2.mp3',
        'C#3': 'Cs3.mp3',
        'D2': 'D2.mp3',
        'E2': 'E2.mp3',
        'E3': 'E3.mp3',
        'F#1': 'Fs1.mp3',
        'F#2': 'Fs2.mp3',
        'G1': 'G1.mp3',
        'G#2': 'Gs2.mp3',
        'G#3': 'Gs3.mp3',
        'A2': 'A2.mp3',
        'A#1': 'As1.mp3',
        'B3': 'B3.mp3'

    },

    'flute': {
        'A6': 'A6.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'C6': 'C6.mp3',
        'C7': 'C7.mp3',
        'E4': 'E4.mp3',
        'E5': 'E5.mp3',
        'E6': 'E6.mp3',
        'A4': 'A4.mp3',
        'A5': 'A5.mp3'

    },

    'french-horn': {
        'D3': 'D3.mp3',
        'D5': 'D5.mp3',
        'D#2': 'Ds2.mp3',
        'F3': 'F3.mp3',
        'F5': 'F5.mp3',
        'G2': 'G2.mp3',
        'A1': 'A1.mp3',
        'A3': 'A3.mp3',
        'C2': 'C2.mp3',
        'C4': 'C4.mp3',

    },

    'guitar-acoustic': {
        'F4': 'F4.mp3',
        'F#2': 'Fs2.mp3',
        'F#3': 'Fs3.mp3',
        'F#4': 'Fs4.mp3',
        'G2': 'G2.mp3',
        'G3': 'G3.mp3',
        'G4': 'G4.mp3',
        'G#2': 'Gs2.mp3',
        'G#3': 'Gs3.mp3',
        'G#4': 'Gs4.mp3',
        'A2': 'A2.mp3',
        'A3': 'A3.mp3',
        'A4': 'A4.mp3',
        'A#2': 'As2.mp3',
        'A#3': 'As3.mp3',
        'A#4': 'As4.mp3',
        'B2': 'B2.mp3',
        'B3': 'B3.mp3',
        'B4': 'B4.mp3',
        'C3': 'C3.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'C#3': 'Cs3.mp3',
        'C#4': 'Cs4.mp3',
        'C#5': 'Cs5.mp3',
        'D2': 'D2.mp3',
        'D3': 'D3.mp3',
        'D4': 'D4.mp3',
        'D5': 'D5.mp3',
        'D#2': 'Ds2.mp3',
        'D#3': 'Ds3.mp3',
        'D#4': 'Ds3.mp3',
        'E2': 'E2.mp3',
        'E3': 'E3.mp3',
        'E4': 'E4.mp3',
        'F2': 'F2.mp3',
        'F3': 'F3.mp3'

    },


    'guitar-electric': {
        'D#3': 'Ds3.mp3',
        'D#4': 'Ds4.mp3',
        'D#5': 'Ds5.mp3',
        'E2': 'E2.mp3',
        'F#2': 'Fs2.mp3',
        'F#3': 'Fs3.mp3',
        'F#4': 'Fs4.mp3',
        'F#5': 'Fs5.mp3',
        'A2': 'A2.mp3',
        'A3': 'A3.mp3',
        'A4': 'A4.mp3',
        'A5': 'A5.mp3',
        'C3': 'C3.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'C6': 'C6.mp3',
        'C#2': 'Cs2.mp3'
    },

    'guitar-nylon': {
        'F#2': 'Fs2.mp3',
        'F#3': 'Fs3.mp3',
        'F#4': 'Fs4.mp3',
        'F#5': 'Fs5.mp3',
        'G3': 'G3.mp3',
        'G5': 'G3.mp3',
        'G#2': 'Gs2.mp3',
        'G#4': 'Gs4.mp3',
        'G#5': 'Gs5.mp3',
        'A2': 'A2.mp3',
        'A3': 'A3.mp3',
        'A4': 'A4.mp3',
        'A5': 'A5.mp3',
        'A#5': 'As5.mp3',
        'B1': 'B1.mp3',
        'B2': 'B2.mp3',
        'B3': 'B3.mp3',
        'B4': 'B4.mp3',
        'C#3': 'Cs3.mp3',
        'C#4': 'Cs4.mp3',
        'C#5': 'Cs5.mp3',
        'D2': 'D2.mp3',
        'D3': 'D3.mp3',
        'D5': 'D5.mp3',
        'D#4': 'Ds4.mp3',
        'E2': 'E2.mp3',
        'E3': 'E3.mp3',
        'E4': 'E4.mp3',
        'E5': 'E5.mp3'
    },


    'harmonium': {
        'C2': 'C2.mp3',
        'C3': 'C3.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'C#2': 'Cs2.mp3',
        'C#3': 'Cs3.mp3',
        'C#4': 'Cs4.mp3',
        'C#5': 'Cs5.mp3',
        'D2': 'D2.mp3',
        'D3': 'D3.mp3',
        'D4': 'D4.mp3',
        'D5': 'D5.mp3',
        'D#2': 'Ds2.mp3',
        'D#3': 'Ds3.mp3',
        'D#4': 'Ds4.mp3',
        'E2': 'E2.mp3',
        'E3': 'E3.mp3',
        'E4': 'E4.mp3',
        'F2': 'F2.mp3',
        'F3': 'F3.mp3',
        'F4': 'F4.mp3',
        'F#2': 'Fs2.mp3',
        'F#3': 'Fs3.mp3',
        'G2': 'G2.mp3',
        'G3': 'G3.mp3',
        'G4': 'G4.mp3',
        'G#2': 'Gs2.mp3',
        'G#3': 'Gs3.mp3',
        'G#4': 'Gs4.mp3',
        'A2': 'A2.mp3',
        'A3': 'A3.mp3',
        'A4': 'A4.mp3',
        'A#2': 'As2.mp3',
        'A#3': 'As3.mp3',
        'A#4': 'As4.mp3'
    },

    'harp': {
        'C5': 'C5.mp3',
        'D2': 'D2.mp3',
        'D4': 'D4.mp3',
        'D6': 'D6.mp3',
        'D7': 'D7.mp3',
        'E1': 'E1.mp3',
        'E3': 'E3.mp3',
        'E5': 'E5.mp3',
        'F2': 'F2.mp3',
        'F4': 'F4.mp3',
        'F6': 'F6.mp3',
        'F7': 'F7.mp3',
        'G1': 'G1.mp3',
        'G3': 'G3.mp3',
        'G5': 'G5.mp3',
        'A2': 'A2.mp3',
        'A4': 'A4.mp3',
        'A6': 'A6.mp3',
        'B1': 'B1.mp3',
        'B3': 'B3.mp3',
        'B5': 'B5.mp3',
        'B6': 'B6.mp3',
        'C3': 'C3.mp3'

    },

    'organ': {
        'C3': 'C3.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'C6': 'C6.mp3',
        'D#1': 'Ds1.mp3',
        'D#2': 'Ds2.mp3',
        'D#3': 'Ds3.mp3',
        'D#4': 'Ds4.mp3',
        'D#5': 'Ds5.mp3',
        'F#1': 'Fs1.mp3',
        'F#2': 'Fs2.mp3',
        'F#3': 'Fs3.mp3',
        'F#4': 'Fs4.mp3',
        'F#5': 'Fs5.mp3',
        'A1': 'A1.mp3',
        'A2': 'A2.mp3',
        'A3': 'A3.mp3',
        'A4': 'A4.mp3',
        'A5': 'A5.mp3',
        'C1': 'C1.mp3',
        'C2': 'C2.mp3'
    },

    'piano': {
        'A7': 'A7.mp3',
        'A1': 'A1.mp3',
        'A2': 'A2.mp3',
        'A3': 'A3.mp3',
        'A4': 'A4.mp3',
        'A5': 'A5.mp3',
        'A6': 'A6.mp3',
        'A#7': 'As7.mp3',
        'A#1': 'As1.mp3',
        'A#2': 'As2.mp3',
        'A#3': 'As3.mp3',
        'A#4': 'As4.mp3',
        'A#5': 'As5.mp3',
        'A#6': 'As6.mp3',
        'B7': 'B7.mp3',
        'B1': 'B1.mp3',
        'B2': 'B2.mp3',
        'B3': 'B3.mp3',
        'B4': 'B4.mp3',
        'B5': 'B5.mp3',
        'B6': 'B6.mp3',
        'C7': 'C7.mp3',
        'C1': 'C1.mp3',
        'C2': 'C2.mp3',
        'C3': 'C3.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'C6': 'C6.mp3',
        'C7': 'C7.mp3',
        'C#7': 'Cs7.mp3',
        'C#1': 'Cs1.mp3',
        'C#2': 'Cs2.mp3',
        'C#3': 'Cs3.mp3',
        'C#4': 'Cs4.mp3',
        'C#5': 'Cs5.mp3',
        'C#6': 'Cs6.mp3',
        'D7': 'D7.mp3',
        'D1': 'D1.mp3',
        'D2': 'D2.mp3',
        'D3': 'D3.mp3',
        'D4': 'D4.mp3',
        'D5': 'D5.mp3',
        'D6': 'D6.mp3',
        'D#7': 'Ds7.mp3',
        'D#1': 'Ds1.mp3',
        'D#2': 'Ds2.mp3',
        'D#3': 'Ds3.mp3',
        'D#4': 'Ds4.mp3',
        'D#5': 'Ds5.mp3',
        'D#6': 'Ds6.mp3',
        'E7': 'E7.mp3',
        'E1': 'E1.mp3',
        'E2': 'E2.mp3',
        'E3': 'E3.mp3',
        'E4': 'E4.mp3',
        'E5': 'E5.mp3',
        'E6': 'E6.mp3',
        'F7': 'F7.mp3',
        'F1': 'F1.mp3',
        'F2': 'F2.mp3',
        'F3': 'F3.mp3',
        'F4': 'F4.mp3',
        'F5': 'F5.mp3',
        'F6': 'F6.mp3',
        'F#7': 'Fs7.mp3',
        'F#1': 'Fs1.mp3',
        'F#2': 'Fs2.mp3',
        'F#3': 'Fs3.mp3',
        'F#4': 'Fs4.mp3',
        'F#5': 'Fs5.mp3',
        'F#6': 'Fs6.mp3',
        'G7': 'G7.mp3',
        'G1': 'G1.mp3',
        'G2': 'G2.mp3',
        'G3': 'G3.mp3',
        'G4': 'G4.mp3',
        'G5': 'G5.mp3',
        'G6': 'G6.mp3',
        'G#7': 'Gs7.mp3',
        'G#1': 'Gs1.mp3',
        'G#2': 'Gs2.mp3',
        'G#3': 'Gs3.mp3',
        'G#4': 'Gs4.mp3',
        'G#5': 'Gs5.mp3',
        'G#6': 'Gs6.mp3'
    },

    'saxophone': {
        'D#5': 'Ds5.mp3',
        'E3': 'E3.mp3',
        'E4': 'E4.mp3',
        'E5': 'E5.mp3',
        'F3': 'F3.mp3',
        'F4': 'F4.mp3',
        'F5': 'F5.mp3',
        'F#3': 'Fs3.mp3',
        'F#4': 'Fs4.mp3',
        'F#5': 'Fs5.mp3',
        'G3': 'G3.mp3',
        'G4': 'G4.mp3',
        'G5': 'G5.mp3',
        'G#3': 'Gs3.mp3',
        'G#4': 'Gs4.mp3',
        'G#5': 'Gs5.mp3',
        'A4': 'A4.mp3',
        'A5': 'A5.mp3',
        'A#3': 'As3.mp3',
        'A#4': 'As4.mp3',
        'B3': 'B3.mp3',
        'B4': 'B4.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'C#3': 'Cs3.mp3',
        'C#4': 'Cs4.mp3',
        'C#5': 'Cs5.mp3',
        'D3': 'D3.mp3',
        'D4': 'D4.mp3',
        'D5': 'D5.mp3',
        'D#3': 'Ds3.mp3',
        'D#4': 'Ds4.mp3'

    },

    'trombone': {
        'A#3': 'As3.mp3',
        'C3': 'C3.mp3',
        'C4': 'C4.mp3',
        'C#2': 'Cs2.mp3',
        'C#4': 'Cs4.mp3',
        'D3': 'D3.mp3',
        'D4': 'D4.mp3',
        'D#2': 'Ds2.mp3',
        'D#3': 'Ds3.mp3',
        'D#4': 'Ds4.mp3',
        'F2': 'F2.mp3',
        'F3': 'F3.mp3',
        'F4': 'F4.mp3',
        'G#2': 'Gs2.mp3',
        'G#3': 'Gs3.mp3',
        'A#1': 'As1.mp3',
        'A#2': 'As2.mp3'

    },

    'trumpet': {
        'C6': 'C6.mp3',
        'D5': 'D5.mp3',
        'D#4': 'Ds4.mp3',
        'F3': 'F3.mp3',
        'F4': 'F4.mp3',
        'F5': 'F5.mp3',
        'G4': 'G4.mp3',
        'A3': 'A3.mp3',
        'A5': 'A5.mp3',
        'A#4': 'As4.mp3',
        'C4': 'C4.mp3'

    },

    'tuba': {
        'A#2': 'As2.mp3',
        'A#3': 'As3.mp3',
        'D3': 'D3.mp3',
        'D4': 'D4.mp3',
        'D#2': 'Ds2.mp3',
        'F1': 'F1.mp3',
        'F2': 'F2.mp3',
        'F3': 'F3.mp3',
        'A#1': 'As1.mp3'

    },

    'violin': {
        'A3': 'A3.mp3',
        'A4': 'A4.mp3',
        'A5': 'A5.mp3',
        'A6': 'A6.mp3',
        'C4': 'C4.mp3',
        'C5': 'C5.mp3',
        'C6': 'C6.mp3',
        'C7': 'C7.mp3',
        'E4': 'E4.mp3',
        'E5': 'E5.mp3',
        'E6': 'E6.mp3',
        'G4': 'G4.mp3',
        'G5': 'G5.mp3',
        'G6': 'G6.mp3'

    },

    'xylophone': {
        'C8': 'C8.mp3',
        'G4': 'G4.mp3',
        'G5': 'G5.mp3',
        'G6': 'G6.mp3',
        'G7': 'G7.mp3',
        'C5': 'C5.mp3',
        'C6': 'C6.mp3',
        'C7': 'C7.mp3'

    }


}
export { SampleLibrary };
