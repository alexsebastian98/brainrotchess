/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Video-Spliced Audio Player and Procedural Sound Splicer
// Synchronized directly with Supplier XD's "Top 5 Meme Sound Effect" (Video ID: DogH-RgansQ).
// Features exactly the 5 requested sounds:
// 1. FAH
// 2. VINE BOOM
// 3. GET OUT
// 4. YOOO
// 5. FAT CAT HUH

export type SplicedClipId =
  | 'fah'
  | 'vine_boom'
  | 'get_out'
  | 'yooo'
  | 'fat_cat_huh'
  | 'chill_guy'
  | 'brother_eww'
  | 'he_needs_some_milk'
  | 'spiderman_2099'
  | 'spiderman_pizza'
  | 'spiderman_60s'
  | 'metal_pipe'
  | 'taco_bell'
  | 'gigachad'
  | 'siuuu'
  | 'emotional_damage'
  | 'among_us'
  | 'bruh'
  | 'roblox_oof'
  | 'airhorn';

export interface SplicedMemeClip {
  id: SplicedClipId;
  name: string;
  time: string;
  startSec: number;
  duration: number;
  category: 'reaction' | 'tactical' | 'chaos' | 'brainrot' | 'victory' | 'gaming';
  chessEvent: string;
  intensity: 1 | 2 | 3 | 4;
  description: string;
  yearTag: '2025' | '2026' | 'Classic Viral';
}

// The 5 Spliced Clips from the Core Lineup
export const TOP5_SPLICED_CLIPS: SplicedMemeClip[] = [
  {
    id: 'fah',
    name: 'FAH 💨',
    time: '00:00',
    startSec: 0.0,
    duration: 1.5,
    category: 'reaction',
    chessEvent: 'capture_pawn',
    intensity: 1,
    description: 'Crisp airy breathy "FAH" meme sound effect on pawn captures',
    yearTag: '2025',
  },
  {
    id: 'vine_boom',
    name: 'VINE BOOM 💥',
    time: '00:01',
    startSec: 1.8,
    duration: 1.6,
    category: 'chaos',
    chessEvent: 'capture_rook',
    intensity: 3,
    description: 'Iconic deep sub-bass distorted Vine Boom on major piece captures and blunders',
    yearTag: 'Classic Viral',
  },
  {
    id: 'get_out',
    name: 'GET OUT 🚪',
    time: '00:03',
    startSec: 3.5,
    duration: 1.8,
    category: 'reaction',
    chessEvent: 'capture_minor',
    intensity: 3,
    description: 'Loud aggressive "GET OUT!!" shouted sound effect on piece captures and tactical forks',
    yearTag: '2025',
  },
  {
    id: 'yooo',
    name: 'YOOOO 😱',
    time: '00:05',
    startSec: 5.3,
    duration: 1.8,
    category: 'victory',
    chessEvent: 'capture_queen',
    intensity: 3,
    description: 'Escalating hype collective "YOOOOOO!" scream on epic queen captures',
    yearTag: '2025',
  },
  {
    id: 'fat_cat_huh',
    name: 'FAT CAT HUH 🐱',
    time: '00:09',
    startSec: 9.0,
    duration: 0.9,
    category: 'reaction',
    chessEvent: 'capture_minor',
    intensity: 2,
    description: 'The viral chunky confused cat staring with echoed questioning "HUH?!" meme',
    yearTag: '2025',
  },
];

// Expanded 2025-2026 Most Famous Meme Sounds Collection
export const FAMOUS_2025_2026_CLIPS: SplicedMemeClip[] = [
  ...TOP5_SPLICED_CLIPS,
  {
    id: 'chill_guy',
    name: 'CHILL GUY 🧸',
    time: '00:10',
    startSec: 10.0,
    duration: 1.5,
    category: 'brainrot',
    chessEvent: 'capture_pawn',
    intensity: 1,
    description: 'Just a Chill Guy 2024-2025 viral laid-back acoustic whistle & strum',
    yearTag: '2025',
  },
  {
    id: 'brother_eww',
    name: 'BROTHER EWW 🤢',
    time: '00:12',
    startSec: 12.0,
    duration: 1.4,
    category: 'reaction',
    chessEvent: 'capture_minor',
    intensity: 3,
    description: 'The viral "Brother Eww! What is that?!" meme reaction sound',
    yearTag: '2025',
  },
  {
    id: 'he_needs_some_milk',
    name: 'HE NEEDS SOME MILK 🥛',
    time: '00:14',
    startSec: 14.0,
    duration: 1.2,
    category: 'reaction',
    chessEvent: 'capture_minor',
    intensity: 3,
    description: 'The iconic urgent "Oh he need some milk! Somebody give him some milk!" viral sound',
    yearTag: '2025',
  },
  {
    id: 'spiderman_2099',
    name: 'SPIDER-MAN 2099 (CANON EVENT) 🕷️⚡',
    time: '00:15',
    startSec: 15.0,
    duration: 1.5,
    category: 'brainrot',
    chessEvent: 'capture_queen',
    intensity: 4,
    description: 'The viral Spider-Verse Miguel O\'Hara 2099 canon event synth siren stinger',
    yearTag: '2026',
  },
  {
    id: 'spiderman_pizza',
    name: 'SPIDER-MAN PIZZA THEME 🍕🕷️',
    time: '00:16',
    startSec: 16.5,
    duration: 1.6,
    category: 'gaming',
    chessEvent: 'capture_minor',
    intensity: 3,
    description: 'The high-speed comedic Spider-Man 2 Pizza Delivery / Funiculì Funiculà meme soundtrack',
    yearTag: 'Classic Viral',
  },
  {
    id: 'spiderman_60s',
    name: 'SPIDER-MAN POINTING MEME 🕸️👉',
    time: '00:18',
    startSec: 18.0,
    duration: 1.3,
    category: 'reaction',
    chessEvent: 'capture_rook',
    intensity: 2,
    description: 'The classic Spider-Man pointing meme retro brass jazz fanfare',
    yearTag: 'Classic Viral',
  },
  {
    id: 'metal_pipe',
    name: 'METAL PIPE 🪙',
    time: '00:19',
    startSec: 19.5,
    duration: 1.2,
    category: 'chaos',
    chessEvent: 'capture_rook',
    intensity: 3,
    description: 'Ultra crisp resonant reverberating metal pipe drop impact',
    yearTag: '2025',
  },
  {
    id: 'taco_bell',
    name: 'TACO BELL BONG 🔔',
    time: '00:17',
    startSec: 17.0,
    duration: 1.5,
    category: 'reaction',
    chessEvent: 'capture_minor',
    intensity: 2,
    description: 'Deep ringing metallic bronze bell chime',
    yearTag: 'Classic Viral',
  },
  {
    id: 'gigachad',
    name: 'GIGACHAD PHONK 🗿',
    time: '00:19',
    startSec: 19.0,
    duration: 1.2,
    category: 'brainrot',
    chessEvent: 'capture_queen',
    intensity: 4,
    description: 'Dark Brazilian phonk drift 808 sub bass & cowbell stab',
    yearTag: '2026',
  },
  {
    id: 'siuuu',
    name: 'SIUUU ⚡',
    time: '00:21',
    startSec: 21.0,
    duration: 1.4,
    category: 'victory',
    chessEvent: 'capture_queen',
    intensity: 3,
    description: 'Cristiano Ronaldo echoing hype stadium roar',
    yearTag: '2025',
  },
  {
    id: 'emotional_damage',
    name: 'EMOTIONAL DAMAGE 💔',
    time: '00:23',
    startSec: 23.0,
    duration: 1.5,
    category: 'reaction',
    chessEvent: 'capture_rook',
    intensity: 3,
    description: 'Dramatic cinematic oriental gong strike',
    yearTag: '2025',
  },
  {
    id: 'among_us',
    name: 'AMONG US SUS 📮',
    time: '00:25',
    startSec: 25.0,
    duration: 0.6,
    category: 'gaming',
    chessEvent: 'capture_minor',
    intensity: 2,
    description: 'High-tension 4-note impostor stinger',
    yearTag: 'Classic Viral',
  },
  {
    id: 'bruh',
    name: 'BRUH 🗿',
    time: '00:26',
    startSec: 26.0,
    duration: 0.8,
    category: 'reaction',
    chessEvent: 'capture_pawn',
    intensity: 2,
    description: 'Iconic deep resonant baritone "bruh" sound effect',
    yearTag: 'Classic Viral',
  },
  {
    id: 'roblox_oof',
    name: 'ROBLOX OOF 💀',
    time: '00:27',
    startSec: 27.0,
    duration: 0.4,
    category: 'gaming',
    chessEvent: 'capture_pawn',
    intensity: 2,
    description: 'Classic pitch-dropped retro oof pop',
    yearTag: 'Classic Viral',
  },
  {
    id: 'airhorn',
    name: 'MLG AIRHORN 🎺',
    time: '00:28',
    startSec: 28.0,
    duration: 1.0,
    category: 'gaming',
    chessEvent: 'capture_queen',
    intensity: 3,
    description: 'Triple rapid brass airhorn blast',
    yearTag: 'Classic Viral',
  },
];

export const YOUTUBE_VIDEO_ID = 'DogH-RgansQ';
export const YOUTUBE_EMBED_URL = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&widgetid=1`;
