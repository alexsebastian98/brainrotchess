/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../audio/AudioEngine';

// Visual overlay component:
// Sound name notifications removed per user directive ("remove the notifications of sounds used").
// Retains board screen shake and victory confetti on game end.
export const MemeOverlay: React.FC = () => {
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((reaction) => {
      // Screen shake on heavy blunder/stinger
      if (reaction.intensity >= 3) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 450);
      }

      // Checkmate celebration confetti
      if (
        reaction.intensity === 4 ||
        reaction.toast?.includes('CHECKMATE') ||
        reaction.toast?.includes('W PLAY')
      ) {
        try {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#f43f5e', '#38bdf8', '#10b981', '#f59e0b'],
          });
        } catch {}
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      {/* Screen Shake Class on Body wrapper */}
      <div
        className={`pointer-events-none fixed inset-0 z-40 transition-transform ${
          isShaking ? 'translate-x-1 -translate-y-1 rotate-1 scale-[1.01]' : ''
        }`}
      />
    </>
  );
};
