/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IntensityLevel = 1 | 2 | 3 | 4;
// Level 1: Normal (subtle click / whoosh / mild reaction)
// Level 2: Reaction (medium meme, "bro what", hitmarker)
// Level 3: Chaos (vine boom, screech, screaming, "AH HELL NAH")
// Level 4: Nuclear (checkmate, catastrophic queen blunder, forced mate combo)

export type ChaosSetting = 'normal' | 'tiktok' | 'brainrot' | 'nuclear';

export type SoundRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type SoundCategory =
  | 'reaction'
  | 'victory'
  | 'defeat'
  | 'chaos'
  | 'tactical'
  | 'gaming'
  | 'brainrot'
  | 'chess_base';

export type ChessEventTrigger =
  | 'move_pawn'
  | 'move_piece'
  | 'capture_pawn'
  | 'capture_minor'
  | 'capture_rook'
  | 'capture_queen'
  | 'queen_lost'
  | 'castling'
  | 'en_passant'
  | 'pawn_promotion'
  | 'check'
  | 'double_check'
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'sacrifice'
  | 'blunder'
  | 'catastrophic_blunder'
  | 'mistake'
  | 'inaccuracy'
  | 'brilliant'
  | 'great_move'
  | 'book_move'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'resignation'
  | 'timeout'
  | 'quick_reaction'
  | 'comeback';

export interface MemeDefinition {
  id: string;
  name: string;
  category: SoundCategory;
  intensity: IntensityLevel;
  rarity: SoundRarity;
  tags: string[];
  events: ChessEventTrigger[];
  voicePhrase?: string; // Spoken line if voice reactions enabled
  synthEffect?: string; // Procedural Web Audio FX ID (e.g. 'vine_boom', 'sad_trombone')
  videoClipId?: string; // Direct ID of spliced video clip from 500+ Meme Sound Effects (pOlDL3_MYnI)
  videoClipStartSec?: number; // Exact timestamp in video
  videoClipDuration?: number; // Spliced snippet length
  visualToast: string; // Emoji / label shown on screen (e.g. 'AH HELL NAH 💀')
  soundUrl?: string; // Direct real audio clip URL (e.g. /sounds/vine_boom.wav or MyInstants)
  fallbackUrl?: string; // Fallback real audio clip URL
  weight?: number; // Selection probability weight
}

export type SoundPackId =
  | 'myinstants_top'
  | 'collection_2025_2026'
  | 'brainrot'
  | 'classic_vine'
  | 'gaming_mlg'
  | 'chaos_unhinged'
  | 'spliced_video'
  | 'minimal';

export interface SoundPack {
  id: SoundPackId;
  name: string;
  description: string;
  memes: MemeDefinition[];
}

export interface AudioSettings {
  masterVolume: number; // 0.0 to 1.0
  chessVolume: number; // piece moves, captures
  memeVolume: number; // vine booms, memes, sfx
  voiceVolume: number; // text-to-speech meme lines (disabled)
  uiVolume: number; // clicks, toggles
  muted: boolean;
  chaosSetting: ChaosSetting;
  selectedPack: SoundPackId;
  voiceReactionsEnabled: boolean;
  visualToastsEnabled: boolean;
  screenShakeEnabled: boolean;
  onlyPlayOnCaptures: boolean; // Only trigger meme sound on piece captures (pawn, knight, bishop, rook, queen, en passant)
  shuffleSounds: boolean; // Shuffle through all meme sounds on captures for maximum variety (not just one sound)
}

export interface ChessEventContext {
  event: ChessEventTrigger;
  piece?: string;
  captured?: string;
  from?: string;
  to?: string;
  san?: string;
  playerColor: 'w' | 'b';
  evaluationBefore?: number;
  evaluationAfter?: number;
  evaluationSwing?: number;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isEnPassant?: boolean;
  isPromotion?: boolean;
  moveNumber: number;
  gamePhase?: 'opening' | 'middlegame' | 'endgame';
  consecutiveBlunders?: number;
}
