/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MemeDefinition } from '../types/audio';
import { TOP5_SPLICED_CLIPS } from './VideoSplicedEngine';

// Transform the exact 5 spliced sounds from DogH-RgansQ into the primary MemeDefinitions:
// 1. FAH
// 2. VINE BOOM
// 3. GET OUT
// 4. YOOO
// 5. FAT CAT HUH
export const VIDEO_SPLICED_MEMES: MemeDefinition[] = TOP5_SPLICED_CLIPS.map((clip) => {
  let synthFallback = 'fahh_whoosh';

  if (clip.id === 'fah') synthFallback = 'fahh_whoosh';
  else if (clip.id === 'vine_boom') synthFallback = 'vine_boom';
  else if (clip.id === 'get_out') synthFallback = 'get_out';
  else if (clip.id === 'yooo') synthFallback = 'yooo';
  else if (clip.id === 'fat_cat_huh') synthFallback = 'fat_cat_huh';

  return {
    id: `yt_${clip.id}`,
    name: clip.name,
    category: clip.category,
    intensity: clip.intensity,
    rarity: clip.intensity >= 4 ? 'legendary' : clip.intensity === 3 ? 'rare' : 'common',
    tags: ['top5_spliced', 'DogH-RgansQ', clip.id],
    events: [clip.chessEvent as any],
    synthEffect: synthFallback,
    videoClipId: clip.id,
    videoClipStartSec: clip.startSec,
    videoClipDuration: clip.duration,
    visualToast: clip.name,
    weight: 2.0,
  };
});
