/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Dedicated Single-Voice Real Meme Audio Engine
// Rules enforced:
// 1. REMOVE ALL AI INBUILD audio - 100% real recorded MyInstants audio clips only.
// 2. Play maximum 1 second of the sound (strict 1000ms cutoff with smooth micro-fade).
// 3. Always enabled & auto-unlocked.
// 4. Absolute ZERO OVERLAP of sounds (exclusive single-voice playback).

type PlaybackListener = (activeSoundId: string | null) => void;

class RealMemeAudioService {
  private audioCtx: AudioContext | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private pendingFetches: Map<string, Promise<AudioBuffer | null>> = new Map();

  // Active audio handles for exclusive single-voice playback
  private activeSourceNode: AudioBufferSourceNode | null = null;
  private activeGainNode: GainNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private stopTimer: any = null;
  private activeSoundId: string | null = null;

  private isUnlocked: boolean = false;
  private masterVolume: number = 0.9;
  private listeners: Set<PlaybackListener> = new Set();

  constructor() {
    this.setupAutoUnlock();
  }

  private initAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  private setupAutoUnlock(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.unlock();
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  public unlock(): void {
    this.isUnlocked = true;
    const ctx = this.initAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Also unlock HTMLAudioElement for mobile Safari
    try {
      const dummy = new Audio();
      dummy.volume = 0.01;
      dummy.play().catch(() => {});
    } catch {}
  }

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.activeSoundId);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setActiveSound(id: string | null): void {
    this.activeSoundId = id;
    this.listeners.forEach((fn) => fn(id));
  }

  public getActiveSoundId(): string | null {
    return this.activeSoundId;
  }

  public setVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.activeGainNode && this.audioCtx) {
      try {
        this.activeGainNode.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);
      } catch {}
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = this.masterVolume;
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  /**
   * STOP: Immediately stops, pauses, and resets any playing sound.
   * Cancels existing 1-second timers.
   * Guarantees ZERO OVERLAP.
   */
  public stop(): void {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    // 1. Stop Web Audio buffer source immediately
    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.stop(0);
        this.activeSourceNode.disconnect();
      } catch {}
      this.activeSourceNode = null;
    }

    if (this.activeGainNode) {
      try {
        this.activeGainNode.disconnect();
      } catch {}
      this.activeGainNode = null;
    }

    // 2. Stop HTMLAudioElement immediately
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {}
      this.currentAudioElement = null;
    }

    this.setActiveSound(null);
  }

  /**
   * Preload an audio clip into memory for 0ms instantaneous latency.
   */
  public async preload(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }
    if (this.pendingFetches.has(url)) {
      return this.pendingFetches.get(url)!;
    }

    const fetchPromise = (async () => {
      try {
        const ctx = this.initAudioContext();
        if (!ctx) return null;

        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.bufferCache.set(url, audioBuffer);
        return audioBuffer;
      } catch {
        return null;
      } finally {
        this.pendingFetches.delete(url);
      }
    })();

    this.pendingFetches.set(url, fetchPromise);
    return fetchPromise;
  }

  /**
   * PLAY: Plays real recorded meme audio.
   * - Immediately halts any previous sound (ABSOLUTE ZERO OVERLAP).
   * - Plays for a maximum of 1.0 second (1000ms), then stops.
   * - Smooth micro-fade at 880ms - 1000ms to eliminate clicks.
   */
  public play(
    primaryUrl: string,
    fallbackUrl?: string,
    customVolume?: number,
    soundId?: string
  ): void {
    // RULE: Enforce ZERO OVERLAP by killing previous sound immediately!
    this.stop();

    const vol = customVolume !== undefined ? customVolume : this.masterVolume;
    const resolvedSoundId = soundId || primaryUrl.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'meme';
    this.setActiveSound(resolvedSoundId);

    // Try Web Audio API if buffer is already decoded or AudioContext is ready
    const ctx = this.initAudioContext();
    const cachedBuffer = this.bufferCache.get(primaryUrl);

    if (ctx && cachedBuffer) {
      this.playAudioBuffer(ctx, cachedBuffer, vol, resolvedSoundId);
      return;
    }

    // If buffer not yet loaded, start loading in background and try HTMLAudioElement
    this.preload(primaryUrl).then((buf) => {
      // Buffer loaded for next time
    }).catch(() => {});

    // Use HTMLAudioElement with strict 1-second cutoff
    this.playAudioElement(primaryUrl, fallbackUrl, vol, resolvedSoundId);
  }

  private playAudioBuffer(
    ctx: AudioContext,
    buffer: AudioBuffer,
    volume: number,
    soundId: string
  ): void {
    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const targetVol = Math.max(0, Math.min(1, volume));

      // Quick de-click attack (5ms)
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(targetVol, now + 0.005);

      // Play up to MAXIMUM 1.0 SECOND (1000ms):
      // Smooth micro-fade out from 880ms to 1000ms
      const fadeStart = now + 0.88;
      const stopTime = now + 1.0;
      gain.gain.setValueAtTime(targetVol, fadeStart);
      gain.gain.linearRampToValueAtTime(0.0001, stopTime);

      source.connect(gain);
      gain.connect(ctx.destination);

      source.start(now);
      source.stop(stopTime);

      this.activeSourceNode = source;
      this.activeGainNode = gain;

      source.onended = () => {
        if (this.activeSourceNode === source) {
          this.activeSourceNode = null;
          this.activeGainNode = null;
          if (this.activeSoundId === soundId) {
            this.setActiveSound(null);
          }
        }
      };

      // Strict timeout fallback in JS land to clean up UI state
      this.stopTimer = setTimeout(() => {
        if (this.activeSoundId === soundId) {
          this.stop();
        }
      }, 1000);
    } catch {
      // Fallback to element
      this.playAudioElement(buffer ? '' : '', undefined, volume, soundId);
    }
  }

  private playAudioElement(
    primaryUrl: string,
    fallbackUrl: string | undefined,
    volume: number,
    soundId: string
  ): void {
    if (!primaryUrl) return;

    const audio = new Audio(primaryUrl);
    audio.preload = 'auto';
    audio.volume = Math.max(0, Math.min(1, volume));
    this.currentAudioElement = audio;

    let timerStarted = false;
    const startOneSecondCutoff = () => {
      if (timerStarted) return;
      timerStarted = true;

      // Soft micro-fade at 880ms to avoid audio click on cutoff
      setTimeout(() => {
        if (this.currentAudioElement === audio) {
          try {
            audio.volume = Math.max(0, audio.volume * 0.15);
          } catch {}
        }
      }, 880);

      // STRICT 1 SECOND HARD STOP: "play maximum 1 second of the sound"
      this.stopTimer = setTimeout(() => {
        if (this.currentAudioElement === audio) {
          this.stop();
        }
      }, 1000);
    };

    audio.onplay = () => {
      startOneSecondCutoff();
    };

    audio.onended = () => {
      if (this.currentAudioElement === audio) {
        this.stop();
      }
    };

    audio.onerror = () => {
      // If primary link fails, try fallback
      if (fallbackUrl && fallbackUrl !== primaryUrl && this.currentAudioElement === audio) {
        this.stop();
        const fallbackAudio = new Audio(fallbackUrl);
        fallbackAudio.preload = 'auto';
        fallbackAudio.volume = Math.max(0, Math.min(1, volume));
        this.currentAudioElement = fallbackAudio;
        this.setActiveSound(soundId);

        fallbackAudio.onplay = () => startOneSecondCutoff();
        fallbackAudio.onended = () => this.stop();
        fallbackAudio.play().catch(() => {});

        this.stopTimer = setTimeout(() => {
          if (this.currentAudioElement === fallbackAudio) {
            this.stop();
          }
        }, 1000);
      } else {
        this.stop();
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          startOneSecondCutoff();
        })
        .catch(() => {
          if (fallbackUrl && fallbackUrl !== primaryUrl) {
            audio.onerror?.(new Event('error'));
          }
        });
    }
  }
}

export const realMemeAudio = new RealMemeAudioService();
