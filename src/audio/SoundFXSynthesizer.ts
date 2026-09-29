/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Web Audio API Sound FX Synthesizer
// Produces 100% legal, zero-latency, high-fidelity meme and chess sound effects.

class SoundFXSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isUnlocked: boolean = false;

  private initContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    } else if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
    }
    return this.ctx;
  }

  public unlock(): void {
    this.initContext();
  }

  public getUnlocked(): boolean {
    return this.isUnlocked;
  }

  // --- 1. Vine Boom (Sub-bass drop with distortion) ---
  public playVineBoom(volume = 0.9): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Wave shaper for bass crunch
    const waveShaper = ctx.createWaveShaper();
    waveShaper.curve = this.makeDistortionCurve(18) as unknown as Float32Array<ArrayBuffer>;

    osc.type = 'sine';
    // Frequency drops from 110Hz to 32Hz
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.7);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume * 1.2, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(waveShaper);
    waveShaper.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  // --- 2. Metal Pipe Drop (Metallic inharmonic resonance) ---
  public playMetalPipe(volume = 0.8): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [340, 580, 890, 1340, 2100, 3450];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(freq + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.9);

      const amp = (volume * 0.4) / (idx + 1);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8 + idx * 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(now);
      osc.stop(now + 1.1);
    });

    // Add noise clatter burst
    this.playNoiseBurst(now, 0.25, volume * 0.5);
  }

  // --- 3. Airhorn (Triple MLG brass burst) ---
  public playAirhorn(volume = 0.75): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const blasts = [0, 0.12, 0.24];
    blasts.forEach((delay) => {
      const t = now + delay;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(466.16, t); // Bb4
      osc2.frequency.setValueAtTime(466.16 * 1.5, t); // F5 fifth

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume * 0.7, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.11);
      osc2.stop(t + 0.11);
    });
  }

  // --- 4. Sad Trombone (Wah-wah-wah-waaah) ---
  public playSadTrombone(volume = 0.8): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [
      { f: 233.08, d: 0.35, pause: 0.4 }, // Bb3
      { f: 220.0, d: 0.35, pause: 0.4 },  // A3
      { f: 207.65, d: 0.35, pause: 0.4 }, // Ab3
      { f: 196.0, d: 0.8, pause: 0.85, slide: 155.56 }, // G3 sliding down to Eb3
    ];

    let current = now;
    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, current);
      if (n.slide) {
        osc.frequency.linearRampToValueAtTime(n.slide, current + n.d);
      }

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, current);
      filter.Q.value = 4.0;

      gain.gain.setValueAtTime(0, current);
      gain.gain.linearRampToValueAtTime(volume * 0.6, current + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, current + n.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(current);
      osc.stop(current + n.d + 0.05);
      current += n.pause;
    });
  }

  // --- 5. Cartoon Bonk / Woodblock ---
  public playCartoonBonk(volume = 0.8): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

    gain.gain.setValueAtTime(volume * 0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // --- 6. Siren Alarm (Warning Klaxon) ---
  public playSirenAlarm(volume = 0.75): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Frequency sweeps up and down
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.25);
    osc.frequency.linearRampToValueAtTime(600, now + 0.5);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.75);
    osc.frequency.linearRampToValueAtTime(500, now + 1.0);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.65, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.05);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc.start(now);
    osc.stop(now + 1.1);
  }

  // --- 7. Fahh / Whoosh (Crisp breathy airy vocal whoosh, spliced cleanly) ---
  public playFahhWhoosh(volume = 0.7): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.32);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.32);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.65, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);

    // Filtered breath aspiration noise
    this.playNoiseBurst(now + 0.01, 0.28, volume * 0.35);
  }

  // --- 8. Hitmarker Click ---
  public playHitmarker(volume = 0.7): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

    gain.gain.setValueAtTime(volume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- 9. Brilliant Move Shimmer Chime ---
  public playBrilliantChime(volume = 0.8): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C Major arpeggio
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.07);

      gain.gain.setValueAtTime(0, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(volume * 0.4, now + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.75);
    });
  }

  // --- 10. Orchestral Hit (Dramatic tutti blast) ---
  public playOrchestralHit(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chord = [130.81, 196.0, 261.63, 311.13, 392.0, 523.25]; // C minor tutti
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(volume * 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.72);
    });
    this.playNoiseBurst(now, 0.15, volume * 0.4);
  }

  // --- 11. En Passant Warp / Laser ---
  public playEnPassantWarp(volume = 0.8): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.4);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.6, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // --- Spliced Sound 3: GET OUT (Aggressive shouted formant burst & distortion) ---
  public playGetOut(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Dual vocal formant filters simulating shouted vowel resonance "GET OUT!"
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter1 = ctx.createBiquadFilter();
    const filter2 = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.linearRampToValueAtTime(140, now + 0.35);
    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.linearRampToValueAtTime(170, now + 0.35);

    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(650, now);
    filter1.frequency.linearRampToValueAtTime(450, now + 0.35);
    filter1.Q.value = 4.0;

    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(1800, now);
    filter2.frequency.linearRampToValueAtTime(1100, now + 0.35);
    filter2.Q.value = 3.5;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.9, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    osc1.connect(filter1);
    osc2.connect(filter2);
    filter1.connect(gain);
    filter2.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);

    // Punchy noise impact on "GET"
    this.playNoiseBurst(now, 0.12, volume * 0.4);
  }

  // --- Spliced Sound 4: YOOO (Rising ecstatic hype crowd chorus) ---
  public playYooo(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const pitches = [260, 320, 390, 520];
    pitches.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f, now);
      // Pitch bends up enthusiastically
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 0.55);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + idx * 200, now);
      filter.frequency.linearRampToValueAtTime(2200, now + 0.55);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime((volume * 0.4) / (idx + 1), now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.68);
    });
  }

  // --- 2025/2026 Meme Sound: FAT CAT HUH 🐱 (The viral questioning bewildered echoed "HUH?!" cat meme) ---
  public playFatCatHuh(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Dual vocal formant filters simulating the iconic bewildered vocal inflection "HUH?!"
    // Spliced into initial vocal burst + ascending questioning pitch contour + room echo
    const playVocalBurst = (startTime: number, gainMultiplier: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const formant1 = ctx.createBiquadFilter();
      const formant2 = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      // Authentic upward inflection curve: starts at ~220Hz, rises to 440Hz, flicks to 480Hz
      osc1.frequency.setValueAtTime(220, startTime);
      osc1.frequency.linearRampToValueAtTime(310, startTime + 0.08);
      osc1.frequency.exponentialRampToValueAtTime(460, startTime + 0.22);
      osc1.frequency.linearRampToValueAtTime(485, startTime + 0.26);

      osc2.frequency.setValueAtTime(222, startTime);
      osc2.frequency.linearRampToValueAtTime(312, startTime + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(465, startTime + 0.22);
      osc2.frequency.linearRampToValueAtTime(490, startTime + 0.26);

      // Formant 1: Vowel mouth cavity (~720Hz -> 850Hz)
      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(720, startTime);
      formant1.frequency.linearRampToValueAtTime(880, startTime + 0.2);
      formant1.Q.value = 4.2;

      // Formant 2: Nasal throat cavity (~1600Hz -> 1850Hz)
      formant2.type = 'bandpass';
      formant2.frequency.setValueAtTime(1620, startTime);
      formant2.frequency.linearRampToValueAtTime(1860, startTime + 0.2);
      formant2.Q.value = 4.0;

      // Clean spliced envelope (no click, fast attack, crisp release)
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(volume * 0.85 * gainMultiplier, startTime + 0.035);
      gain.gain.setValueAtTime(volume * 0.8 * gainMultiplier, startTime + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.32);

      osc1.connect(formant1);
      osc2.connect(formant2);
      formant1.connect(gain);
      formant2.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + 0.34);
      osc2.stop(startTime + 0.34);
    };

    // 1. Primary "HUH?!" burst
    playVocalBurst(now, 1.0);

    // 2. Room reverberation / viral slapback echo (creates the iconic domestic room acoustics of the video)
    playVocalBurst(now + 0.075, 0.38);

    // Breath / aspiration onset noise
    this.playNoiseBurst(now, 0.08, volume * 0.22);
  }

  // Alias for backward compatibility
  public playHuhCat(volume = 0.85): void {
    this.playFatCatHuh(volume);
  }

  // --- 2025/2026 Meme Sound: Just a Chill Guy (Mellow acoustic pentatonic strum) ---
  public playChillGuy(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Laid back acoustic guitar / whistle chords (G - B - D - E)
    const notes = [
      { f: 196.0, delay: 0.0 },   // G3
      { f: 246.94, delay: 0.06 }, // B3
      { f: 293.66, delay: 0.12 }, // D4
      { f: 329.63, delay: 0.18 }, // E4
      { f: 392.0, delay: 0.28 },  // G4
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.delay);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now + n.delay);
      filter.frequency.exponentialRampToValueAtTime(400, now + n.delay + 0.6);

      gain.gain.setValueAtTime(0, now + n.delay);
      gain.gain.linearRampToValueAtTime(volume * 0.4, now + n.delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.delay + 0.75);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now + n.delay);
      osc.stop(now + n.delay + 0.8);
    });
  }

  // --- 2025/2026 Meme Sound: Brother Eww / Brother Eughh ---
  public playBrotherEww(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    // Vocal formant sliding down with disgust inflection (420Hz -> 210Hz)
    osc1.frequency.setValueAtTime(390, now);
    osc1.frequency.linearRampToValueAtTime(420, now + 0.08);
    osc1.frequency.exponentialRampToValueAtTime(180, now + 0.55);

    osc2.frequency.setValueAtTime(395, now);
    osc2.frequency.linearRampToValueAtTime(425, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(185, now + 0.55);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.linearRampToValueAtTime(500, now + 0.5);
    filter.Q.value = 4.5;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.85, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  }

  // --- 2025/2026 Meme Sound: Taco Bell Bong (Deep metallic resonant bell) ---
  public playTacoBellBong(volume = 0.9): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const partials = [
      { f: 174.61, amp: 1.0, decay: 1.4 },  // F3
      { f: 349.23, amp: 0.6, decay: 1.2 },  // F4
      { f: 523.25, amp: 0.45, decay: 0.9 }, // C5
      { f: 784.0, amp: 0.35, decay: 0.7 },  // G5
      { f: 1174.66, amp: 0.2, decay: 0.5 }, // D6
      { f: 1568.0, amp: 0.15, decay: 0.35 },// G6
    ];

    partials.forEach((p) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.f, now);

      gain.gain.setValueAtTime(volume * 0.4 * p.amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + p.decay);
    });

    // Metallic chime strike noise
    this.playNoiseBurst(now, 0.08, volume * 0.35);
  }

  // --- 2025/2026 Meme Sound: Gigachad Phonk (Distorted 808 + cowbell stab) ---
  public playGigachadPhonk(volume = 0.9): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Phonk Cowbell (800Hz / 540Hz square blend)
    const bellOsc1 = ctx.createOscillator();
    const bellOsc2 = ctx.createOscillator();
    const bellGain = ctx.createGain();
    const bellFilter = ctx.createBiquadFilter();

    bellOsc1.type = 'square';
    bellOsc2.type = 'triangle';
    bellOsc1.frequency.setValueAtTime(587.33, now); // D5
    bellOsc2.frequency.setValueAtTime(880.0, now);  // A5

    bellFilter.type = 'bandpass';
    bellFilter.frequency.setValueAtTime(750, now);
    bellFilter.Q.value = 3.0;

    bellGain.gain.setValueAtTime(volume * 0.7, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    bellOsc1.connect(bellFilter);
    bellOsc2.connect(bellFilter);
    bellFilter.connect(bellGain);
    bellGain.connect(this.masterGain || ctx.destination);

    bellOsc1.start(now);
    bellOsc2.start(now);
    bellOsc1.stop(now + 0.48);
    bellOsc2.stop(now + 0.48);

    // 2. Heavy 808 Sub Kick
    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(140, now);
    kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

    kickGain.gain.setValueAtTime(volume * 0.95, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    kickOsc.connect(kickGain);
    kickGain.connect(this.masterGain || ctx.destination);

    kickOsc.start(now);
    kickOsc.stop(now + 0.72);
  }

  // --- 2025/2026 Meme Sound: SIUUU (Ronaldo power celebration roar) ---
  public playSiuuu(volume = 0.9): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    // Frequency sweeps from 290Hz down to 130Hz
    osc.frequency.setValueAtTime(290, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.85);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.8);
    filter.Q.value = 2.5;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.9, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc.start(now);
    osc.stop(now + 1.0);

    // Crowd stadium breath swell
    this.playNoiseBurst(now + 0.1, 0.6, volume * 0.45);
  }

  // --- 2025/2026 Meme Sound: Emotional Damage (Dramatic Gong) ---
  public playEmotionalDamage(volume = 0.9): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const gongPitches = [110, 164.8, 220, 293.66, 440];
    gongPitches.forEach((pitch, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch + (i % 2 === 0 ? 3 : -3), now);

      gain.gain.setValueAtTime((volume * 0.4) / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    });

    this.playNoiseBurst(now, 0.25, volume * 0.5);
  }

  // --- 2025/2026 Meme Sound: Among Us Stinger ---
  public playAmongUsStinger(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const stingerNotes = [
      { f: 554.37, t: 0.0 },  // C#5
      { f: 587.33, t: 0.08 }, // D5
      { f: 622.25, t: 0.16 }, // Eb5
      { f: 587.33, t: 0.24 }, // D5
    ];

    stingerNotes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0, now + n.t);
      gain.gain.linearRampToValueAtTime(volume * 0.6, now + n.t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now + n.t);
      osc.stop(now + n.t + 0.2);
    });
  }

  // --- 2025/2026 Meme Sound: Bruh (Low baritone drop) ---
  public playBruh(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Frequency sweeps from 160Hz down to 88Hz
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(88, now + 0.45);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.linearRampToValueAtTime(200, now + 0.45);
    filter.Q.value = 5.0;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.9, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.52);
  }

  // --- 2025/2026 Meme Sound: Roblox OOF (Pitch pop) ---
  public playRobloxOof(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Sharp dropping vocal pop
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);

    gain.gain.setValueAtTime(volume * 0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // --- 11b. Viral Meme: HE NEEDS SOME MILK! 🥛 ---
  public playHeNeedsSomeMilk(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Shouted vocal formant inflection ("Oh he need some milk!")
    // Contoured syllables: "He" (540Hz) -> "Need" (660Hz) -> "Some" (500Hz) -> "Milk!" (360Hz)
    const syllables = [
      { f: 540, tStart: 0.0, dur: 0.12 },
      { f: 660, tStart: 0.13, dur: 0.14 },
      { f: 500, tStart: 0.28, dur: 0.11 },
      { f: 360, tStart: 0.40, dur: 0.28 },
    ];

    syllables.forEach((s) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const formant = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(s.f, now + s.tStart);
      osc.frequency.exponentialRampToValueAtTime(s.f * 0.85, now + s.tStart + s.dur);

      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(1100, now + s.tStart);
      formant.Q.value = 3.2;

      gain.gain.setValueAtTime(0, now + s.tStart);
      gain.gain.linearRampToValueAtTime(volume * 0.75, now + s.tStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + s.tStart + s.dur);

      osc.connect(formant);
      formant.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now + s.tStart);
      osc.stop(now + s.tStart + s.dur + 0.02);
    });

    // 2. Glass milk bottle clink
    const clink = ctx.createOscillator();
    const clinkGain = ctx.createGain();
    clink.type = 'sine';
    clink.frequency.setValueAtTime(2150, now + 0.42);
    clink.frequency.exponentialRampToValueAtTime(1900, now + 0.65);
    clinkGain.gain.setValueAtTime(volume * 0.5, now + 0.42);
    clinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    clink.connect(clinkGain);
    clinkGain.connect(this.masterGain || ctx.destination);
    clink.start(now + 0.42);
    clink.stop(now + 0.66);

    // 3. Sub impact thud
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(130, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.35);
    subGain.gain.setValueAtTime(volume * 0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    sub.connect(subGain);
    subGain.connect(this.masterGain || ctx.destination);
    sub.start(now);
    sub.stop(now + 0.4);
  }

  // --- 11c. Spider-Man 2099 Miguel O'Hara Theme ("Canon Event" Synth Siren) 🕷️⚡ ---
  public playSpiderman2099(volume = 0.9): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Twin aggressive detuned saw oscillators sliding down (The ominous Spider-Verse 2099 alarm)
    const freqs = [
      { f: 235, detune: -12 },
      { f: 235, detune: 14 },
      { f: 117.5, detune: 0 }, // Sub octave
    ];

    freqs.forEach((spec) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const shaper = ctx.createWaveShaper();

      osc.type = 'sawtooth';
      osc.detune.setValueAtTime(spec.detune, now);
      osc.frequency.setValueAtTime(spec.f, now);
      // Signature elephant-horn glide
      osc.frequency.exponentialRampToValueAtTime(spec.f * 0.42, now + 0.45);
      osc.frequency.linearRampToValueAtTime(spec.f * 0.35, now + 1.1);

      shaper.curve = this.makeDistortionCurve(65) as unknown as Float32Array<ArrayBuffer>;
      shaper.oversample = '4x';

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(420, now + 0.7);
      filter.Q.value = 4.2;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.65, now + 0.05);
      gain.gain.setValueAtTime(volume * 0.6, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

      osc.connect(shaper);
      shaper.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + 1.3);
    });

    // Staccato siren klaxon sync pulse
    const sirenOsc = ctx.createOscillator();
    const sirenGain = ctx.createGain();
    sirenOsc.type = 'square';
    sirenOsc.frequency.setValueAtTime(880, now);
    sirenOsc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
    sirenGain.gain.setValueAtTime(volume * 0.25, now);
    sirenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    sirenOsc.connect(sirenGain);
    sirenGain.connect(this.masterGain || ctx.destination);
    sirenOsc.start(now);
    sirenOsc.stop(now + 0.42);

    // Deep sub-bass canon impact
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.9);
    subGain.gain.setValueAtTime(volume * 0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    sub.connect(subGain);
    subGain.connect(this.masterGain || ctx.destination);
    sub.start(now);
    sub.stop(now + 1.05);
  }

  // --- 11d. Spider-Man Pizza Theme (Spider-Man 2 Delivery / Funiculì Funiculà Meme) 🍕🕷️ ---
  public playSpidermanPizzaTheme(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Fast, comedic Italian mandolin / accordion riff:
    // A4 -> A4 -> B4 -> C#5 -> D5 -> C#5 -> B4 -> A4
    const notes = [
      { f: 440.00, d: 0.11, pause: 0.12 }, // A4
      { f: 440.00, d: 0.11, pause: 0.12 }, // A4
      { f: 493.88, d: 0.11, pause: 0.12 }, // B4
      { f: 554.37, d: 0.11, pause: 0.12 }, // C#5
      { f: 587.33, d: 0.18, pause: 0.19 }, // D5
      { f: 554.37, d: 0.11, pause: 0.12 }, // C#5
      { f: 493.88, d: 0.11, pause: 0.12 }, // B4
      { f: 440.00, d: 0.28, pause: 0.30 }, // A4
    ];

    let t = now;
    notes.forEach((n) => {
      // Primary accordion / plucked reed wave
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.value = 2.5;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume * 0.55, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(t);
      osc.stop(t + n.d + 0.03);

      // Harmony octave pulse for Italian tavern feel
      const harm = ctx.createOscillator();
      const harmGain = ctx.createGain();
      harm.type = 'square';
      harm.frequency.setValueAtTime(n.f * 2, t);
      harmGain.gain.setValueAtTime(0, t);
      harmGain.gain.linearRampToValueAtTime(volume * 0.12, t + 0.01);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, t + n.d * 0.7);
      harm.connect(harmGain);
      harmGain.connect(this.masterGain || ctx.destination);
      harm.start(t);
      harm.stop(t + n.d + 0.02);

      t += n.pause;
    });
  }

  // --- 11e. Spider-Man 1960s Pointing Meme Theme 🕸️👉 ---
  public playSpiderman60sTheme(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Classic groovy 60s brass swing: D4 -> F4 -> G4 -> Ab4 -> G4 -> F4
    const brassNotes = [
      { f: 293.66, d: 0.14, pause: 0.15 }, // D4
      { f: 349.23, d: 0.14, pause: 0.15 }, // F4
      { f: 392.00, d: 0.16, pause: 0.17 }, // G4
      { f: 415.30, d: 0.22, pause: 0.23 }, // Ab4 (flat 5 blues note!)
      { f: 392.00, d: 0.14, pause: 0.15 }, // G4
      { f: 349.23, d: 0.32, pause: 0.35 }, // F4
    ];

    let t = now;
    brassNotes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.linearRampToValueAtTime(1800, t + 0.04);
      filter.frequency.exponentialRampToValueAtTime(600, t + n.d);
      filter.Q.value = 3.5;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume * 0.5, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(t);
      osc.stop(t + n.d + 0.04);
      t += n.pause;
    });
  }

  // --- 12. Victory Royale Fanfare ---
  public playVictoryFanfare(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const melody = [
      { f: 523.25, d: 0.12, pause: 0.14 }, // C5
      { f: 659.25, d: 0.12, pause: 0.14 }, // E5
      { f: 783.99, d: 0.12, pause: 0.14 }, // G5
      { f: 1046.5, d: 0.45, pause: 0.5 },  // C6
    ];

    let t = now;
    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume * 0.5, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.d);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(t);
      osc.stop(t + note.d + 0.05);
      t += note.pause;
    });
  }

  // --- 13. Standard Chess Move Click (Natural wood clack) ---
  public playChessMove(volume = 0.6): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    gain.gain.setValueAtTime(volume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- 14. Standard Chess Capture (Snappy tactile crunch) ---
  public playChessCapture(volume = 0.65): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

    gain.gain.setValueAtTime(volume * 0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);

    this.playNoiseBurst(now, 0.05, volume * 0.3);
  }

  // ==========================================
  // MYINSTANTS TOP MEME SOUNDS REPERTOIRE
  // (https://www.myinstants.com/en/search/?name=meme)
  // ==========================================

  // --- 15. Sad Violin (Iconic crying / drama meme) ---
  public playSadViolin(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Sorrowful minor sequence: C5 -> Bb4 -> Ab4 -> G4 with expressive vibrato
    const notes = [
      { f: 523.25, d: 0.35, pause: 0.38 }, // C5
      { f: 466.16, d: 0.35, pause: 0.38 }, // Bb4
      { f: 415.30, d: 0.40, pause: 0.44 }, // Ab4
      { f: 392.00, d: 0.90, pause: 0.95 }, // G4
    ];

    let t = now;
    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, t);

      // Warm violin vibrato (5.5Hz)
      vibrato.frequency.setValueAtTime(5.5, t);
      vibratoGain.gain.setValueAtTime(4.5, t);
      vibrato.connect(osc.frequency);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, t);
      filter.Q.value = 3.0;

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(volume * 0.55, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + n.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      vibrato.start(t);
      osc.start(t);
      vibrato.stop(t + n.d + 0.02);
      osc.stop(t + n.d + 0.02);

      t += n.pause;
    });
  }

  // --- 16. FBI OPEN UP! (Tactical breach + siren shout) ---
  public playFbiOpenUp(volume = 0.9): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Heavy door kick impact
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(180, now);
    kick.frequency.exponentialRampToValueAtTime(30, now + 0.25);
    kickGain.gain.setValueAtTime(volume * 1.0, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    kick.connect(kickGain);
    kickGain.connect(this.masterGain || ctx.destination);
    kick.start(now);
    kick.stop(now + 0.32);
    this.playNoiseBurst(now, 0.2, volume * 0.5);

    // 2. Shouted "FBI OPEN UP!" vocal bursts
    const bursts = [
      { f: 380, t: 0.18, d: 0.12 }, // "F"
      { f: 440, t: 0.32, d: 0.12 }, // "B"
      { f: 520, t: 0.46, d: 0.16 }, // "I"
      { f: 620, t: 0.65, d: 0.15 }, // "OPEN"
      { f: 480, t: 0.82, d: 0.35 }, // "UP!"
    ];

    bursts.forEach((b) => {
      const vOsc = ctx.createOscillator();
      const vFilter = ctx.createBiquadFilter();
      const vGain = ctx.createGain();

      vOsc.type = 'sawtooth';
      vOsc.frequency.setValueAtTime(b.f, now + b.t);

      vFilter.type = 'bandpass';
      vFilter.frequency.setValueAtTime(1200, now + b.t);
      vFilter.Q.value = 3.5;

      vGain.gain.setValueAtTime(0, now + b.t);
      vGain.gain.linearRampToValueAtTime(volume * 0.75, now + b.t + 0.02);
      vGain.gain.exponentialRampToValueAtTime(0.001, now + b.t + b.d);

      vOsc.connect(vFilter);
      vFilter.connect(vGain);
      vGain.connect(this.masterGain || ctx.destination);

      vOsc.start(now + b.t);
      vOsc.stop(now + b.t + b.d + 0.02);
    });

    // 3. Police siren wail at end
    const siren = ctx.createOscillator();
    const sirenGain = ctx.createGain();
    siren.type = 'triangle';
    siren.frequency.setValueAtTime(650, now + 0.9);
    siren.frequency.linearRampToValueAtTime(950, now + 1.25);
    sirenGain.gain.setValueAtTime(0, now + 0.9);
    sirenGain.gain.linearRampToValueAtTime(volume * 0.35, now + 0.95);
    sirenGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
    siren.connect(sirenGain);
    sirenGain.connect(this.masterGain || ctx.destination);
    siren.start(now + 0.9);
    siren.stop(now + 1.4);
  }

  // --- 17. Goofy Ahh Laugh & Boing ---
  public playGoofyAhh(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Spring cartoon boing
    const boing = ctx.createOscillator();
    const boingGain = ctx.createGain();
    boing.type = 'sine';
    boing.frequency.setValueAtTime(140, now);
    boing.frequency.exponentialRampToValueAtTime(750, now + 0.22);
    boingGain.gain.setValueAtTime(volume * 0.7, now);
    boingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    boing.connect(boingGain);
    boingGain.connect(this.masterGain || ctx.destination);
    boing.start(now);
    boing.stop(now + 0.26);

    // 2. Goofy ahh staccato wheeze laughs
    const chuckles = [0.22, 0.32, 0.42, 0.52, 0.62];
    chuckles.forEach((tOffset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320 + i * 45, now + tOffset);
      osc.frequency.exponentialRampToValueAtTime(220, now + tOffset + 0.08);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now + tOffset);
      filter.Q.value = 4.0;

      gain.gain.setValueAtTime(0, now + tOffset);
      gain.gain.linearRampToValueAtTime(volume * 0.65, now + tOffset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + tOffset + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now + tOffset);
      osc.stop(now + tOffset + 0.09);
    });
  }

  // --- 18. RUN (AWOLNATION EDM drop) ---
  public playRunMeme(volume = 0.9): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Fast 16th-note arpeggiator build
    const arpNotes = [440, 554, 659, 880, 440, 554, 659, 880];
    arpNotes.forEach((f, i) => {
      const t = now + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(volume * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(t);
      osc.stop(t + 0.055);
    });

    // Dramatic "RUN" silence pause, then massive heavy distorted bass drop
    const dropTime = now + 0.55;
    const dropOsc = ctx.createOscillator();
    const dropGain = ctx.createGain();
    const dropFilter = ctx.createBiquadFilter();
    const shaper = ctx.createWaveShaper();

    dropOsc.type = 'sawtooth';
    dropOsc.frequency.setValueAtTime(140, dropTime);
    dropOsc.frequency.exponentialRampToValueAtTime(36, dropTime + 0.7);

    shaper.curve = this.makeDistortionCurve(50) as unknown as Float32Array<ArrayBuffer>;

    dropFilter.type = 'lowpass';
    dropFilter.frequency.setValueAtTime(1800, dropTime);
    dropFilter.frequency.exponentialRampToValueAtTime(100, dropTime + 0.75);

    dropGain.gain.setValueAtTime(0.0001, dropTime);
    dropGain.gain.linearRampToValueAtTime(volume * 1.1, dropTime + 0.04);
    dropGain.gain.exponentialRampToValueAtTime(0.0001, dropTime + 0.85);

    dropOsc.connect(shaper);
    shaper.connect(dropFilter);
    dropFilter.connect(dropGain);
    dropGain.connect(this.masterGain || ctx.destination);

    dropOsc.start(dropTime);
    dropOsc.stop(dropTime + 0.9);
  }

  // --- 19. Directed by Robert B. Weide (Curb Your Enthusiasm Theme) ---
  public playCurbYourEnthusiasm(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Signature comedic bouncy tuba & clarinet stinger:
    // G4 -> F#4 -> G4 -> A4 -> G4 -> D4
    const curbMelody = [
      { f: 392.00, d: 0.12, p: 0.14 }, // G4
      { f: 369.99, d: 0.10, p: 0.12 }, // F#4
      { f: 392.00, d: 0.12, p: 0.14 }, // G4
      { f: 440.00, d: 0.14, p: 0.16 }, // A4
      { f: 392.00, d: 0.16, p: 0.18 }, // G4
      { f: 293.66, d: 0.40, p: 0.44 }, // D4
    ];

    let t = now;
    curbMelody.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, t);
      filter.Q.value = 2.8;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume * 0.65, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(t);
      osc.stop(t + n.d + 0.02);

      // Oompah tuba bass
      const tuba = ctx.createOscillator();
      const tubaGain = ctx.createGain();
      tuba.type = 'sawtooth';
      tuba.frequency.setValueAtTime(n.f / 2, t);
      tubaGain.gain.setValueAtTime(volume * 0.25, t);
      tubaGain.gain.exponentialRampToValueAtTime(0.0001, t + n.d * 0.8);
      tuba.connect(tubaGain);
      tubaGain.connect(this.masterGain || ctx.destination);
      tuba.start(t);
      tuba.stop(t + n.d);

      t += n.p;
    });
  }

  // --- 20. Coffin Dance (Astronomia EDM lead) ---
  public playCoffinDance(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // F# minor synth hook
    const astroNotes = [
      { f: 370.0, d: 0.10, p: 0.11 }, // F#4
      { f: 370.0, d: 0.10, p: 0.11 }, // F#4
      { f: 370.0, d: 0.10, p: 0.11 }, // F#4
      { f: 440.0, d: 0.10, p: 0.11 }, // A4
      { f: 415.3, d: 0.10, p: 0.11 }, // G#4
      { f: 370.0, d: 0.10, p: 0.11 }, // F#4
      { f: 277.2, d: 0.28, p: 0.32 }, // C#4
    ];

    let t = now;
    astroNotes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume * 0.6, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(t);
      osc.stop(t + n.d + 0.02);
      t += n.p;
    });
  }

  // --- 21. Bonk (Cheems Doge hollow wooden bonk) ---
  public playBonk(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(volume * 0.95, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // --- 22. Omae Wa Mou Shindeiru / Nani?! (Anime eye flash + high screech) ---
  public playNani(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Laser eye flash sweep (1kHz -> 5.5kHz)
    const laser = ctx.createOscillator();
    const laserGain = ctx.createGain();
    laser.type = 'sine';
    laser.frequency.setValueAtTime(1100, now);
    laser.frequency.exponentialRampToValueAtTime(5400, now + 0.35);

    laserGain.gain.setValueAtTime(0, now);
    laserGain.gain.linearRampToValueAtTime(volume * 0.7, now + 0.05);
    laserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    laser.connect(laserGain);
    laserGain.connect(this.masterGain || ctx.destination);
    laser.start(now);
    laser.stop(now + 0.44);

    // "NANI?!" high screech stinger
    const naniOsc = ctx.createOscillator();
    const naniGain = ctx.createGain();
    naniOsc.type = 'sawtooth';
    naniOsc.frequency.setValueAtTime(740, now + 0.45);
    naniOsc.frequency.exponentialRampToValueAtTime(1480, now + 0.75);

    naniGain.gain.setValueAtTime(0, now + 0.45);
    naniGain.gain.linearRampToValueAtTime(volume * 0.8, now + 0.48);
    naniGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    naniOsc.connect(naniGain);
    naniGain.connect(this.masterGain || ctx.destination);
    naniOsc.start(now + 0.45);
    naniOsc.stop(now + 0.88);
  }

  // --- 23. Windows XP Critical Error Ding ---
  public playWindowsXpError(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Iconic Windows Stop chord: C#4, F4, G#4, C#5
    const chord = [277.18, 349.23, 415.30, 554.37];
    chord.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  // --- 24. Discord Notification Ping ---
  public playDiscordPing(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Discord message chime (D6 -> G5)
    const tones = [
      { f: 1174.66, t: 0.0, d: 0.12 },
      { f: 783.99, t: 0.11, d: 0.25 },
    ];

    tones.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0, now + n.t);
      gain.gain.linearRampToValueAtTime(volume * 0.6, now + n.t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });
  }

  // --- 25. Sheesh (Ascending falsetto whistle / sheeesh) ---
  public playSheesh(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Glides way up into dog-whistle territory
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.45);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.8, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.58);
  }

  // --- 26. What The Dog Doin? ---
  public playWhatTheDogDoin(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Cartoon question inflection melody: C5 -> D5 -> E5 -> G5 -> E5
    const qNotes = [
      { f: 523.25, d: 0.09, p: 0.10 },
      { f: 587.33, d: 0.09, p: 0.10 },
      { f: 659.25, d: 0.09, p: 0.10 },
      { f: 783.99, d: 0.18, p: 0.20 },
      { f: 659.25, d: 0.28, p: 0.30 },
    ];

    let t = now;
    qNotes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume * 0.55, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(t);
      osc.stop(t + n.d + 0.02);
      t += n.p;
    });
  }

  // --- 27. Why Are You Running? ---
  public playWhyAreYouRunning(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Fast urgent rhythmic vocal meter ("Why are you running?!")
    const words = [
      { f: 380, t: 0.0, d: 0.10 },
      { f: 420, t: 0.11, d: 0.09 },
      { f: 480, t: 0.21, d: 0.09 },
      { f: 550, t: 0.31, d: 0.24 },
    ];

    words.forEach((w) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(w.f, now + w.t);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1050, now + w.t);
      filter.Q.value = 3.5;

      gain.gain.setValueAtTime(0, now + w.t);
      gain.gain.linearRampToValueAtTime(volume * 0.75, now + w.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + w.t + w.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now + w.t);
      osc.stop(now + w.t + w.d + 0.02);
    });

    // Running footsteps patter
    this.playNoiseBurst(now + 0.05, 0.08, volume * 0.35);
    this.playNoiseBurst(now + 0.25, 0.08, volume * 0.35);
  }

  // --- 28. NO GOD PLEASE NO! (Michael Scott / The Office panic) ---
  public playNoGodPleaseNo(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // "NO!" (320Hz) -> "GOD!" (480Hz) -> "PLEASE NO!" (720Hz scream)
    const screams = [
      { f: 320, t: 0.0, d: 0.18 },
      { f: 480, t: 0.22, d: 0.22 },
      { f: 720, t: 0.48, d: 0.45 },
    ];

    screams.forEach((s) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(s.f, now + s.t);
      osc.frequency.exponentialRampToValueAtTime(s.f * 1.15, now + s.t + s.d);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now + s.t);
      filter.Q.value = 3.0;

      gain.gain.setValueAtTime(0, now + s.t);
      gain.gain.linearRampToValueAtTime(volume * 0.85, now + s.t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + s.t + s.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now + s.t);
      osc.stop(now + s.t + s.d + 0.03);
    });
  }

  // --- 29. Minecraft Hurt / Bone Snap ---
  public playMinecraftHurt(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(volume * 0.95, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    // Wood snap crackle
    this.playNoiseBurst(now, 0.06, volume * 0.5);
  }

  // --- 30. Look At This Dude (Wheeze Laugh) ---
  public playLookAtThisDude(volume = 0.85): void {
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.value = 4.5;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume * 0.75, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.58);
    this.playNoiseBurst(now + 0.1, 0.35, volume * 0.35);
  }

  // --- Helper: Noise generator for impact crunch ---
  private playNoiseBurst(time: number, duration: number, volume: number): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    whiteNoise.start(time);
    whiteNoise.stop(time + duration);
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
}

export const soundSynthesizer = new SoundFXSynthesizer();
