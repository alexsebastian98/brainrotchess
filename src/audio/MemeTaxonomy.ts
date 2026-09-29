/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MemeDefinition, SoundPack } from '../types/audio';
import { FAMOUS_2025_2026_CLIPS, TOP5_SPLICED_CLIPS } from './VideoSplicedEngine';
import { MYINSTANTS_MEME_BUTTONS } from './MyInstantsMemeCollection';

// Authentic MyInstants Meme Definitions (https://www.myinstants.com/en/search/?name=meme)
export const MYINSTANTS_MEMES: MemeDefinition[] = MYINSTANTS_MEME_BUTTONS.map((btn) => ({
  id: `sfx_${btn.id}`,
  name: btn.name,
  category:
    btn.category === 'popular' || btn.category === 'reactions'
      ? 'reaction'
      : btn.category === 'gaming'
      ? 'gaming'
      : btn.category === 'brainrot'
      ? 'brainrot'
      : 'chaos',
  intensity: btn.intensity,
  rarity: btn.intensity >= 4 ? 'legendary' : btn.intensity === 3 ? 'rare' : 'common',
  tags: [btn.id, btn.category, 'myinstants', 'meme'],
  events: [btn.chessEvent, 'capture_pawn', 'capture_minor', 'capture_rook', 'capture_queen'],
  soundUrl: btn.soundUrl,
  fallbackUrl: btn.fallbackUrl,
  visualToast: btn.visualToast,
  weight: 2.0,
}));

// Definitive 2025-2026 Viral Meme Definitions
// Pure sound effects ONLY - NO AI VOICES, NO ROBOTS, NO SPEECH
export const MEMES_2025_2026: MemeDefinition[] = [
  // 1. FAH
  {
    id: 'sfx_fah',
    name: 'FAH 💨',
    category: 'reaction',
    intensity: 1,
    rarity: 'common',
    tags: ['fah', 'pawn', 'breath', '2025'],
    events: ['capture_pawn', 'capture_minor', 'move_piece'],
    synthEffect: 'fahh_whoosh',
    videoClipId: 'fah',
    videoClipStartSec: 0.0,
    videoClipDuration: 1.5,
    visualToast: 'FAH 💨',
    weight: 2.0,
  },
  // 2. VINE BOOM
  {
    id: 'sfx_vine_boom',
    name: 'VINE BOOM 💥',
    category: 'chaos',
    intensity: 3,
    rarity: 'common',
    tags: ['vine_boom', 'bass', 'blunder', 'rook', 'queen'],
    events: ['capture_rook', 'capture_queen', 'capture_minor', 'blunder', 'catastrophic_blunder'],
    synthEffect: 'vine_boom',
    videoClipId: 'vine_boom',
    videoClipStartSec: 1.8,
    videoClipDuration: 1.6,
    visualToast: 'VINE BOOM 💥',
    weight: 2.5,
  },
  // 3. GET OUT
  {
    id: 'sfx_get_out',
    name: 'GET OUT 🚪',
    category: 'reaction',
    intensity: 3,
    rarity: 'common',
    tags: ['get_out', 'check', 'pin', 'fork', '2025'],
    events: ['capture_minor', 'capture_rook', 'check', 'double_check'],
    synthEffect: 'get_out',
    videoClipId: 'get_out',
    videoClipStartSec: 3.5,
    videoClipDuration: 1.8,
    visualToast: 'GET OUT!! 🚪🗣️',
    weight: 2.0,
  },
  // 4. YOOO
  {
    id: 'sfx_yooo',
    name: 'YOOOO 😱',
    category: 'victory',
    intensity: 3,
    rarity: 'uncommon',
    tags: ['yooo', 'hype', 'brilliant', 'promotion', 'en_passant', '2025'],
    events: ['capture_queen', 'capture_rook', 'brilliant', 'en_passant', 'pawn_promotion'],
    synthEffect: 'yooo',
    videoClipId: 'yooo',
    videoClipStartSec: 5.3,
    videoClipDuration: 1.8,
    visualToast: 'YOOOOOO!! 😱🔥',
    weight: 2.0,
  },
  // 5. FAT CAT HUH
  {
    id: 'sfx_fat_cat_huh',
    name: 'FAT CAT HUH 🐱',
    category: 'reaction',
    intensity: 2,
    rarity: 'common',
    tags: ['fat_cat', 'huh', 'cat', 'confusion', '2025', '2026'],
    events: ['capture_pawn', 'capture_minor', 'mistake', 'inaccuracy'],
    synthEffect: 'fat_cat_huh',
    videoClipId: 'fat_cat_huh',
    videoClipStartSec: 9.0,
    videoClipDuration: 0.9,
    visualToast: 'FAT CAT: HUH?! 🐱❓',
    weight: 2.5,
  },
  // 7. CHILL GUY
  {
    id: 'sfx_chill_guy',
    name: 'CHILL GUY 🧸',
    category: 'brainrot',
    intensity: 1,
    rarity: 'common',
    tags: ['chill_guy', 'laid_back', 'guitar', '2025', '2026'],
    events: ['capture_pawn', 'capture_minor', 'draw', 'stalemate'],
    synthEffect: 'chill_guy',
    videoClipId: 'chill_guy',
    videoClipStartSec: 10.0,
    videoClipDuration: 1.5,
    visualToast: 'JUST A CHILL GUY 🧸☕',
    weight: 2.5,
  },
  // 8. BROTHER EWW
  {
    id: 'sfx_brother_eww',
    name: 'BROTHER EWW 🤢',
    category: 'reaction',
    intensity: 3,
    rarity: 'uncommon',
    tags: ['brother_eww', 'eughh', 'disgust', '2025'],
    events: ['capture_minor', 'capture_rook', 'blunder', 'fork'],
    synthEffect: 'brother_eww',
    videoClipId: 'brother_eww',
    videoClipStartSec: 12.0,
    videoClipDuration: 1.4,
    visualToast: 'BROTHER EWW!! 🤢🤮',
    weight: 2.0,
  },
  // 9. HE NEEDS SOME MILK
  {
    id: 'sfx_he_needs_some_milk',
    name: 'HE NEEDS SOME MILK 🥛',
    category: 'reaction',
    intensity: 3,
    rarity: 'common',
    tags: ['milk', 'he_needs_some_milk', 'reaction', '2025', '2026'],
    events: ['capture_pawn', 'capture_minor', 'capture_rook', 'blunder'],
    synthEffect: 'he_needs_some_milk',
    videoClipId: 'he_needs_some_milk',
    videoClipStartSec: 14.0,
    videoClipDuration: 1.2,
    visualToast: 'HE NEED SOME MILK!! 🥛💀',
    weight: 2.5,
  },
  // 10. SPIDER-MAN 2099 CANON EVENT
  {
    id: 'sfx_spiderman_2099',
    name: 'SPIDER-MAN 2099 (CANON EVENT) 🕷️⚡',
    category: 'brainrot',
    intensity: 4,
    rarity: 'rare',
    tags: ['spiderman', 'spiderverse', 'canon_event', '2099', '2025', '2026'],
    events: ['capture_queen', 'capture_rook', 'checkmate', 'catastrophic_blunder'],
    synthEffect: 'spiderman_2099',
    videoClipId: 'spiderman_2099',
    videoClipStartSec: 15.0,
    videoClipDuration: 1.5,
    visualToast: 'IT\'S A CANON EVENT 🕷️🕸️',
    weight: 2.8,
  },
  // 11. SPIDER-MAN PIZZA THEME
  {
    id: 'sfx_spiderman_pizza',
    name: 'SPIDER-MAN PIZZA THEME 🍕🕷️',
    category: 'gaming',
    intensity: 3,
    rarity: 'uncommon',
    tags: ['spiderman', 'pizza_theme', 'funiculi', 'meme', 'chase', '2025'],
    events: ['capture_pawn', 'capture_minor', 'en_passant', 'fork'],
    synthEffect: 'spiderman_pizza',
    videoClipId: 'spiderman_pizza',
    videoClipStartSec: 16.5,
    videoClipDuration: 1.6,
    visualToast: 'PIZZA TIME! 🍕🕷️',
    weight: 2.5,
  },
  // 12. SPIDER-MAN POINTING MEME
  {
    id: 'sfx_spiderman_60s',
    name: 'SPIDER-MAN POINTING MEME 🕸️👉',
    category: 'reaction',
    intensity: 2,
    rarity: 'common',
    tags: ['spiderman', 'pointing_meme', 'fanfare', 'brass', '2025'],
    events: ['capture_minor', 'capture_rook', 'check'],
    synthEffect: 'spiderman_60s',
    videoClipId: 'spiderman_60s',
    videoClipStartSec: 18.0,
    videoClipDuration: 1.3,
    visualToast: 'SPIDER-MAN POINTING 🕸️👉👈',
    weight: 2.2,
  },
  // 10. METAL PIPE
  {
    id: 'sfx_metal_pipe',
    name: 'METAL PIPE 🪙',
    category: 'chaos',
    intensity: 3,
    rarity: 'uncommon',
    tags: ['metal_pipe', 'reverb', 'slam', 'blunder', '2025'],
    events: ['capture_rook', 'capture_queen', 'blunder', 'catastrophic_blunder'],
    synthEffect: 'metal_pipe',
    videoClipId: 'metal_pipe',
    videoClipStartSec: 15.0,
    videoClipDuration: 1.2,
    visualToast: 'METAL PIPE DROP 🪙💥',
    weight: 2.0,
  },
  // 11. TACO BELL BONG
  {
    id: 'sfx_taco_bell',
    name: 'TACO BELL BONG 🔔',
    category: 'reaction',
    intensity: 2,
    rarity: 'common',
    tags: ['taco_bell', 'bong', 'bell', 'gong'],
    events: ['capture_minor', 'capture_rook', 'capture_pawn'],
    synthEffect: 'taco_bell',
    videoClipId: 'taco_bell',
    videoClipStartSec: 17.0,
    videoClipDuration: 1.5,
    visualToast: 'BONGGGG 🔔🌮',
    weight: 2.0,
  },
  // 12. GIGACHAD PHONK
  {
    id: 'sfx_gigachad',
    name: 'GIGACHAD PHONK 🗿',
    category: 'brainrot',
    intensity: 4,
    rarity: 'rare',
    tags: ['gigachad', 'phonk', 'sigma', 'cowbell', '2025', '2026'],
    events: ['capture_queen', 'checkmate', 'brilliant', 'comeback'],
    synthEffect: 'gigachad_phonk',
    videoClipId: 'gigachad',
    videoClipStartSec: 19.0,
    videoClipDuration: 1.2,
    visualToast: 'GIGACHAD PHONK 🗿⚡',
    weight: 2.5,
  },
  // 13. SIUUU
  {
    id: 'sfx_siuuu',
    name: 'SIUUU ⚡',
    category: 'victory',
    intensity: 3,
    rarity: 'uncommon',
    tags: ['siuuu', 'ronaldo', 'hype', 'victory', '2025'],
    events: ['capture_queen', 'capture_rook', 'checkmate', 'brilliant'],
    synthEffect: 'siuuu',
    videoClipId: 'siuuu',
    videoClipStartSec: 21.0,
    videoClipDuration: 1.4,
    visualToast: 'SIUUUUUU!! ⚡🔥',
    weight: 2.0,
  },
  // 14. EMOTIONAL DAMAGE
  {
    id: 'sfx_emotional_damage',
    name: 'EMOTIONAL DAMAGE 💔',
    category: 'reaction',
    intensity: 3,
    rarity: 'uncommon',
    tags: ['emotional_damage', 'gong', 'reaction', '2025'],
    events: ['capture_queen', 'capture_rook', 'blunder', 'catastrophic_blunder'],
    synthEffect: 'emotional_damage',
    videoClipId: 'emotional_damage',
    videoClipStartSec: 23.0,
    videoClipDuration: 1.5,
    visualToast: 'EMOTIONAL DAMAGE 💔',
    weight: 2.0,
  },
  // 15. AMONG US SUS
  {
    id: 'sfx_among_us',
    name: 'AMONG US SUS 📮',
    category: 'gaming',
    intensity: 2,
    rarity: 'common',
    tags: ['among_us', 'sus', 'impostor', 'stinger'],
    events: ['capture_minor', 'capture_pawn', 'fork', 'pin'],
    synthEffect: 'among_us',
    videoClipId: 'among_us',
    videoClipStartSec: 25.0,
    videoClipDuration: 0.6,
    visualToast: 'SUSPICIOUS 📮🔪',
    weight: 2.0,
  },
  // 16. BRUH
  {
    id: 'sfx_bruh',
    name: 'BRUH 🗿',
    category: 'reaction',
    intensity: 2,
    rarity: 'common',
    tags: ['bruh', 'reaction', 'baritone'],
    events: ['capture_pawn', 'capture_minor', 'blunder'],
    synthEffect: 'bruh',
    videoClipId: 'bruh',
    videoClipStartSec: 26.0,
    videoClipDuration: 0.8,
    visualToast: 'BRUH 🗿',
    weight: 2.0,
  },
  // 17. ROBLOX OOF
  {
    id: 'sfx_roblox_oof',
    name: 'ROBLOX OOF 💀',
    category: 'gaming',
    intensity: 2,
    rarity: 'common',
    tags: ['oof', 'roblox', 'death', 'pop'],
    events: ['capture_pawn', 'capture_minor', 'en_passant'],
    synthEffect: 'roblox_oof',
    videoClipId: 'roblox_oof',
    videoClipStartSec: 27.0,
    videoClipDuration: 0.4,
    visualToast: 'OOF! 💀',
    weight: 2.0,
  },
  // 18. MLG AIRHORN
  {
    id: 'sfx_airhorn',
    name: 'MLG AIRHORN 🎺',
    category: 'gaming',
    intensity: 3,
    rarity: 'uncommon',
    tags: ['airhorn', 'mlg', 'hype', 'blast'],
    events: ['capture_queen', 'capture_rook', 'brilliant'],
    synthEffect: 'airhorn',
    videoClipId: 'airhorn',
    videoClipStartSec: 28.0,
    videoClipDuration: 1.0,
    visualToast: 'AIRHORN BLAST 🎺🎺🎺',
    weight: 2.0,
  },
];

export const TOP5_MEME_DEFINITIONS = MYINSTANTS_MEMES.slice(0, 5);

export const ALL_MEMES: MemeDefinition[] = MYINSTANTS_MEMES;

// Curated Sound Packs
export const SOUND_PACKS: SoundPack[] = [
  {
    id: 'myinstants_top',
    name: 'MyInstants Top Meme Buttons (Default)',
    description: 'Exact meme soundboard from MyInstants: Vine Boom, Emotional Damage, Bruh, Sad Violin, Roblox Oof, Goofy Ahh, Among Us, FBI Open Up, Metal Pipe, Taco Bell, Coffin Dance, SIUUU & more.',
    memes: MYINSTANTS_MEMES,
  },
  {
    id: 'collection_2025_2026',
    name: 'Famous Meme Sounds Collection (Shuffle)',
    description: 'Diverse shuffled sounds on captures only: Vine Boom, Get Out, Yooo, Fat Cat Huh, He Needs Some Milk, Spider-Man Themes, Metal Pipe, Fah, Chill Guy & more.',
    memes: MYINSTANTS_MEMES,
  },
  {
    id: 'spliced_video',
    name: 'Core Spliced Memes',
    description: 'FAH, VINE BOOM, GET OUT, YOOO, FAT CAT HUH — Spliced core sound clips on shuffle.',
    memes: TOP5_MEME_DEFINITIONS,
  },
  {
    id: 'brainrot',
    name: '2025-2026 Brainrot Hits',
    description: 'Spider-Man 2099 Canon Event, Chill Guy, Gigachad Phonk, Brother Eww, and Fat Cat Huh on piece captures.',
    memes: MEMES_2025_2026.filter((m) =>
      ['sfx_spiderman_2099', 'sfx_chill_guy', 'sfx_gigachad', 'sfx_brother_eww', 'sfx_fat_cat_huh', 'sfx_fah'].includes(m.id)
    ),
  },
  {
    id: 'classic_vine',
    name: 'Vine Boom & Impact Hits',
    description: 'Heavy bass Vine Boom, Metal Pipe, He Needs Some Milk, and Taco Bell Bong on captures.',
    memes: MEMES_2025_2026.filter((m) => ['sfx_vine_boom', 'sfx_metal_pipe', 'sfx_he_needs_some_milk', 'sfx_taco_bell'].includes(m.id)),
  },
  {
    id: 'gaming_mlg',
    name: 'Hype Sounds & Spider-Man Themes',
    description: 'Spider-Man Pizza Theme, Spider-Man Pointing, SIUUU, YOOOO, and MLG Airhorn on piece captures.',
    memes: MEMES_2025_2026.filter((m) => ['sfx_spiderman_pizza', 'sfx_spiderman_60s', 'sfx_yooo', 'sfx_siuuu', 'sfx_airhorn'].includes(m.id)),
  },
  {
    id: 'chaos_unhinged',
    name: 'All Spliced Sounds Randomizer',
    description: 'Randomly triggers any sound from the entire 2025-2026 collection on piece captures.',
    memes: MEMES_2025_2026,
  },
  {
    id: 'minimal',
    name: 'Minimal Tactile (Serious Mode)',
    description: 'Pure chess move wood clicks only, no meme sound effects.',
    memes: [],
  },
];

