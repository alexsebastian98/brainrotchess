/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Sliders, Swords } from 'lucide-react';
import { GameMode } from '../types/chess';

interface HeaderProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenAudioSettings: () => void;
  onOpenDebugBench: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartNewGame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenAudioSettings,
  onOpenDebugBench,
  isMuted,
  onToggleMute,
  onStartNewGame,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Wordmark Single Text Element */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectMode('pvp_online');
        }}
        className="text-lg sm:text-xl font-black tracking-tight text-white hover:text-rose-400 transition-colors font-['Outfit']"
      >
        Brainrot Chess
      </a>

      {/* Zone 2: 4 Clean Nav Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectMode('pvp_online')}
          className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
            currentMode === 'pvp_online' ? 'text-rose-400 font-semibold underline underline-offset-8' : ''
          }`}
        >
          Online PvP
        </button>
        <button
          onClick={() => onSelectMode('vs_ai')}
          className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
            currentMode === 'vs_ai' ? 'text-rose-400 font-semibold underline underline-offset-8' : ''
          }`}
        >
          Vs Bot
        </button>
        <button
          onClick={() => onSelectMode('pvp_local')}
          className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap ${
            currentMode === 'pvp_local' ? 'text-rose-400 font-semibold underline underline-offset-8' : ''
          }`}
        >
          Pass & Play
        </button>
        <button
          onClick={onOpenDebugBench}
          className="hover:text-white transition-colors cursor-pointer whitespace-nowrap text-slate-300 flex items-center gap-1.5"
          title="Open MyInstants Meme Soundboard (myinstants.com/en/search/?name=meme)"
        >
          <span>MyInstants</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-rose-600/40 text-rose-200 border border-rose-500/50 rounded-full font-bold">
            Memes
          </span>
        </button>
      </nav>

      {/* Zone 3: 1-2 Primary Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className={`p-2 rounded-lg border transition-all ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenAudioSettings}
          title="Audio Engine Settings"
          className="p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <button
          onClick={onStartNewGame}
          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap"
        >
          <Swords className="w-3.5 h-3.5" />
          <span>New Game</span>
        </button>
      </div>
    </header>
  );
};
