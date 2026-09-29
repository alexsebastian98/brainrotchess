/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AudioSettings,
  ChessEventContext,
  ChessEventTrigger,
  IntensityLevel,
  MemeDefinition,
} from '../types/audio';
import { ALL_MEMES, MEMES_2025_2026, SOUND_PACKS } from './MemeTaxonomy';
import { soundSynthesizer } from './SoundFXSynthesizer';
import { videoAudioSplicer } from './VideoAudioSplicer';
import { FAMOUS_2025_2026_CLIPS, TOP5_SPLICED_CLIPS } from './VideoSplicedEngine';
import { realMemeAudio } from './RealMemeAudioService';

export interface ActiveVisualReaction {
  id: string;
  toast: string;
  intensity: IntensityLevel;
  timestamp: number;
}

type ReactionListener = (reaction: ActiveVisualReaction) => void;

class AudioEngineService {
  private settings: AudioSettings = {
    masterVolume: 0.8,
    chessVolume: 0.8,
    memeVolume: 0.85,
    voiceVolume: 0.75,
    uiVolume: 0.7,
    muted: false,
    chaosSetting: 'brainrot',
    selectedPack: 'myinstants_top',
    voiceReactionsEnabled: false, // AI Speech completely removed
    visualToastsEnabled: false, // User request: remove the notifications of sounds used
    screenShakeEnabled: true,
    onlyPlayOnCaptures: true, // User request: ONLY play meme sound on captures (not every move)
    shuffleSounds: true, // User request: Variety of sounds on shuffle
  };

  private lastPlayedMemeId: string | null = null;
  private lastSoundTimestamp: number = 0;
  private minCooldownMs: number = 280; // Anti-spam delay between meme sound blasts
  private listeners: Set<ReactionListener> = new Set();
  private consecutiveBlunders: number = 0;
  private shuffleDeck: MemeDefinition[] = [];
  private currentDeckIndex: number = 0;
  private capturesSinceFah: number = 0;

  constructor() {
    // Load persisted audio settings if available
    try {
      const saved = localStorage.getItem('brainrot_chess_audio_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback to defaults
    }

    // User directive: ALWAYS have it enabled, keep it on shuffle, use MyInstants, no sound notifications
    this.settings.muted = false;
    this.settings.shuffleSounds = true;
    this.settings.voiceReactionsEnabled = false;
    this.settings.visualToastsEnabled = false;
    this.settings.selectedPack = 'myinstants_top';
    this.settings.onlyPlayOnCaptures = true;
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...partial, voiceReactionsEnabled: false };
    try {
      localStorage.setItem('brainrot_chess_audio_settings', JSON.stringify(this.settings));
    } catch {}
  }

  public subscribe(listener: ReactionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(reaction: ActiveVisualReaction): void {
    this.listeners.forEach((fn) => fn(reaction));
  }

  public unlockAudio(): void {
    realMemeAudio.unlock();
    soundSynthesizer.unlock();
  }

  /**
   * Main entry point: Called whenever any chess move or event occurs.
   * "also it doesnt need to be played every move, only on captures, from the collection you can play any meme sound"
   */
  public triggerChessEvent(ctx: ChessEventContext): MemeDefinition | null {
    if (this.settings.muted) return null;

    // 1. Always play base tactile chess sound (move or capture)
    this.playTactileSound(ctx);

    // If minimal pack is selected, skip meme overlay
    if (this.settings.selectedPack === 'minimal') {
      return null;
    }

    // 2. Enforce "ONLY ON CAPTURES" rule
    const isCapture = Boolean(ctx.captured || ctx.isEnPassant || ctx.event === 'en_passant' || ctx.event?.startsWith('capture_'));
    const isGameEnd = Boolean(ctx.isCheckmate || ctx.event === 'checkmate' || ctx.event === 'timeout' || ctx.event === 'resignation' || ctx.event === 'stalemate');

    if (this.settings.onlyPlayOnCaptures && !isCapture && !isGameEnd) {
      // Regular non-capture moves play only the subtle tactile wood move sound.
      return null;
    }

    // 3. Classify event and priority
    const classifiedEvents = this.classifyContext(ctx);
    if (classifiedEvents.length === 0 && !isCapture) return null;

    // 4. Select matching meme from the 2025-2026 collection
    const selectedMeme = this.selectMeme(classifiedEvents, ctx);
    if (!selectedMeme) return null;

    // 5. Check cooldown & anti-spam
    const now = Date.now();
    const isNuclear = selectedMeme.intensity === 4 || this.settings.chaosSetting === 'nuclear';
    if (!isNuclear && now - this.lastSoundTimestamp < this.minCooldownMs) {
      // Still allow visual toast even if sound cooldown is active
      if (this.settings.visualToastsEnabled) {
        this.notifyListeners({
          id: selectedMeme.id + '_' + now,
          toast: selectedMeme.visualToast,
          intensity: selectedMeme.intensity,
          timestamp: now,
        });
      }
      return selectedMeme;
    }

    this.lastSoundTimestamp = now;
    this.lastPlayedMemeId = selectedMeme.id;

    // 6. Play Audio FX (No AI robot talking over it)
    this.executeMemeAudio(selectedMeme);

    // 7. Broadcast Visual Toast to UI
    if (this.settings.visualToastsEnabled) {
      this.notifyListeners({
        id: selectedMeme.id + '_' + now,
        toast: selectedMeme.visualToast,
        intensity: selectedMeme.intensity,
        timestamp: now,
      });
    }

    return selectedMeme;
  }

  // Tactical Chess SFX (Click / Capture)
  private playTactileSound(ctx: ChessEventContext): void {
    // Zero sound overlap: only play move sound on NON-capture moves.
    // On captures, the real meme sound plays exclusively with NO overlap!
    if (!ctx.captured && !ctx.isEnPassant) {
      const vol = this.settings.masterVolume * this.settings.chessVolume;
      if (vol > 0) {
        soundSynthesizer.playChessMove(vol * 0.4);
      }
    }
  }

  // Classify one or more triggers based on rich context
  private classifyContext(ctx: ChessEventContext): ChessEventTrigger[] {
    const events: ChessEventTrigger[] = [];

    // Highest priority: Game termination
    if (ctx.isCheckmate) {
      events.push('checkmate');
      return events;
    }
    if (ctx.event === 'stalemate') {
      events.push('stalemate');
      return events;
    }
    if (ctx.event === 'resignation') {
      events.push('resignation');
      return events;
    }

    // Special Rules
    if (ctx.isEnPassant || ctx.event === 'en_passant') {
      events.push('en_passant');
    }
    if (ctx.isPromotion || ctx.event === 'pawn_promotion') {
      events.push('pawn_promotion');
    }
    if (ctx.event === 'castling') {
      events.push('castling');
    }

    // Catastrophic blunder & Queen loss
    if (ctx.captured === 'q' || ctx.event === 'queen_lost') {
      events.push('queen_lost');
      events.push('catastrophic_blunder');
    }

    // Engine Evaluation Swings
    if (ctx.evaluationSwing !== undefined) {
      const swing = ctx.evaluationSwing;
      if (swing <= -4.0) {
        this.consecutiveBlunders++;
        events.push('catastrophic_blunder');
      } else if (swing <= -2.2) {
        this.consecutiveBlunders++;
        events.push('blunder');
      } else if (swing <= -1.1) {
        events.push('mistake');
      } else if (swing <= -0.55) {
        events.push('inaccuracy');
      } else if (swing >= 3.0 && (ctx.captured || ctx.isCheck)) {
        events.push('brilliant');
        this.consecutiveBlunders = 0;
      } else if (swing >= 1.5) {
        events.push('great_move');
        this.consecutiveBlunders = 0;
      }
    }

    // Checks
    if (ctx.isCheck || ctx.event === 'check') {
      events.push('check');
    }

    // Captures
    if (ctx.captured) {
      if (ctx.captured === 'q') events.push('capture_queen');
      else if (ctx.captured === 'r') events.push('capture_rook');
      else if (ctx.captured === 'b' || ctx.captured === 'n') events.push('capture_minor');
      else if (ctx.captured === 'p') events.push('capture_pawn');
    }

    // Basic moves if no higher tactical event
    if (events.length === 0) {
      if (ctx.piece === 'p') events.push('move_pawn');
      else events.push('move_piece');
    }

    return events;
  }

  // Replenish and randomize the shuffle deck across all available memes
  // User directive: "use fah from time to time but everything else shuffled"
  private replenishShuffleDeck(availableMemes: MemeDefinition[]): void {
    const list = availableMemes && availableMemes.length > 0 ? availableMemes : MEMES_2025_2026;

    // Separate FAH from the other meme sounds
    const fahMeme = list.find((m) => m.id === 'sfx_fah' || m.id === 'fah');
    const others = list.filter((m) => m.id !== 'sfx_fah' && m.id !== 'fah');

    // Fisher-Yates true random shuffle of all other meme sounds
    const shuffledOthers = [...others];
    for (let i = shuffledOthers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOthers[i], shuffledOthers[j]] = [shuffledOthers[j], shuffledOthers[i]];
    }

    // "use fah from time to time but everything else shuffled":
    // Insert FAH evenly spaced (every 3-4 sounds) so it appears frequently from time to time
    const finalDeck: MemeDefinition[] = [];
    const fahCadence = 3;

    for (let i = 0; i < shuffledOthers.length; i++) {
      finalDeck.push(shuffledOthers[i]);
      if (fahMeme && (i + 1) % fahCadence === 0 && (i + 1) < shuffledOthers.length) {
        finalDeck.push(fahMeme);
      }
    }

    // Prevent consecutive sound repeats when resetting the deck
    if (finalDeck.length > 1 && this.lastPlayedMemeId && finalDeck[0].id === this.lastPlayedMemeId) {
      const swapIdx = 1 + Math.floor(Math.random() * (finalDeck.length - 1));
      [finalDeck[0], finalDeck[swapIdx]] = [finalDeck[swapIdx], finalDeck[0]];
    }

    this.shuffleDeck = finalDeck;
    this.currentDeckIndex = 0;
  }

  // Intelligent meme selector with True Shuffle Queue
  // "more shuffling and more fah from time to time"
  private selectMeme(events: ChessEventTrigger[], ctx: ChessEventContext): MemeDefinition | null {
    const pack = SOUND_PACKS.find((p) => p.id === this.settings.selectedPack) || SOUND_PACKS[0];
    const availableMemes = pack.memes.length > 0 ? pack.memes : MEMES_2025_2026;

    if (availableMemes.length === 0) return null;

    // Checkmate has top priority for legendary finale stingers
    if (ctx.isCheckmate || events.includes('checkmate')) {
      const checkmateOptions = availableMemes.filter((m) =>
        ['sfx_spiderman_2099', 'sfx_gigachad', 'sfx_siuuu', 'sfx_vine_boom'].includes(m.id)
      );
      if (checkmateOptions.length > 0) {
        return checkmateOptions[Math.floor(Math.random() * checkmateOptions.length)];
      }
    }

    // SHUFFLE MODE (Default): Ensures rich sound variety across all piece captures,
    // with FAH popping up more from time to time on pawn captures or in the shuffle queue
    if (this.settings.shuffleSounds) {
      const isPawnCapture = ctx.captured === 'p';
      const fahMeme = availableMemes.find((m) => m.id === 'sfx_fah' || m.id === 'fah');

      // More FAH from time to time: if it has been 2+ captures without FAH, trigger FAH with 55% chance
      if (
        isPawnCapture &&
        fahMeme &&
        this.capturesSinceFah >= 2 &&
        this.lastPlayedMemeId !== fahMeme.id &&
        Math.random() < 0.55
      ) {
        this.capturesSinceFah = 0;
        return fahMeme;
      }

      if (this.shuffleDeck.length === 0 || this.currentDeckIndex >= this.shuffleDeck.length) {
        this.replenishShuffleDeck(availableMemes);
      }
      const chosen = this.shuffleDeck[this.currentDeckIndex++] || availableMemes[0];

      if (chosen.id === 'sfx_fah' || chosen.id === 'fah') {
        this.capturesSinceFah = 0;
      } else {
        this.capturesSinceFah++;
      }

      return chosen;
    }

    // Fallback: Weighted selection if shuffle mode is explicitly toggled off
    const isCapture = Boolean(ctx.captured || ctx.isEnPassant || ctx.event === 'en_passant' || ctx.event?.startsWith('capture_'));
    let matches = availableMemes.filter((m) =>
      m.events.some((e) => events.includes(e))
    );

    if (isCapture && matches.length === 0) {
      matches = availableMemes;
    }

    if (matches.length === 0) {
      matches = availableMemes;
    }

    if (matches.length > 1 && this.lastPlayedMemeId) {
      const nonRepeated = matches.filter((m) => m.id !== this.lastPlayedMemeId);
      if (nonRepeated.length > 0) matches = nonRepeated;
    }

    return matches[Math.floor(Math.random() * matches.length)];
  }

  // Play real recorded meme audio from MyInstants collection (NO AI INBUILD audio)
  // Strictly max 1 second, zero sound overlap!
  private executeMemeAudio(meme: MemeDefinition): void {
    const memeVol = this.settings.masterVolume * this.settings.memeVolume;
    if (memeVol <= 0) return;

    // Use REAL MyInstants recorded audio clips exclusively!
    // Strict 1-second hard cutoff with micro-fade, zero overlap guaranteed
    const soundUrl = meme.soundUrl || '/sounds/vine_boom.wav';
    const fallbackUrl = meme.fallbackUrl || '/sounds/vine_boom.wav';
    realMemeAudio.play(soundUrl, fallbackUrl, memeVol, meme.id);
  }

  // Quick reaction trigger (one-tap emoji reactions like 💀, 😭, W, L)
  public triggerQuickReaction(emoji: string, senderName: string): void {
    if (this.settings.muted) return;
    const vol = this.settings.masterVolume * this.settings.memeVolume;

    // Play real recorded MyInstants sounds exclusively with zero overlap
    if (emoji === '💀' || emoji === 'NAHH') {
      realMemeAudio.play('/sounds/vine_boom.wav', undefined, vol * 0.9, 'quick_vine_boom');
    } else if (emoji === '😭' || emoji === 'L') {
      realMemeAudio.play('/sounds/spongebob_fail.wav', undefined, vol * 0.9, 'quick_spongebob_fail');
    } else if (emoji === 'W' || emoji === '🗿') {
      realMemeAudio.play('/sounds/bruh.wav', undefined, vol * 0.9, 'quick_bruh');
    } else {
      realMemeAudio.play('/sounds/ding.wav', undefined, vol * 0.85, 'quick_ding');
    }

    this.notifyListeners({
      id: 'quick_' + Date.now(),
      toast: `${senderName}: ${emoji}`,
      intensity: 2,
      timestamp: Date.now(),
    });
  }
}

export const audioEngine = new AudioEngineService();
