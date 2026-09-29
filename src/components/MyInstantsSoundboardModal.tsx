/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Volume2,
  Square,
  Shuffle,
  Sparkles,
  ExternalLink,
  Flame,
  Swords,
  Radio,
} from 'lucide-react';
import {
  MYINSTANTS_MEME_BUTTONS,
  MyInstantsSoundButton,
} from '../audio/MyInstantsMemeCollection';
import { audioEngine } from '../audio/AudioEngine';
import { realMemeAudio } from '../audio/RealMemeAudioService';

interface MyInstantsSoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyInstantsSoundboardModal: React.FC<MyInstantsSoundboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeButtonId, setActiveButtonId] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0.9);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(['vine_boom', 'emotional_damage', 'bruh']));

  // Shuffle queue for zero-repeat random playback
  const shuffleDeckRef = useRef<MyInstantsSoundButton[]>([]);
  const shuffleIndexRef = useRef<number>(0);

  // Sync active playing button with single-voice RealMemeAudioService
  useEffect(() => {
    if (!isOpen) return;
    const unsub = realMemeAudio.subscribe((activeId) => {
      setActiveButtonId(activeId);
    });
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Buttons', count: MYINSTANTS_MEME_BUTTONS.length },
    { id: 'popular', label: '🔥 Top Memes', count: MYINSTANTS_MEME_BUTTONS.filter((b) => b.category === 'popular').length },
    { id: 'reactions', label: '🗣️ Reactions', count: MYINSTANTS_MEME_BUTTONS.filter((b) => b.category === 'reactions').length },
    { id: 'gaming', label: '🎮 Gaming & SFX', count: MYINSTANTS_MEME_BUTTONS.filter((b) => b.category === 'gaming').length },
    { id: 'music', label: '🎵 Music & Drops', count: MYINSTANTS_MEME_BUTTONS.filter((b) => b.category === 'music').length },
    { id: 'brainrot', label: '🗿 Brainrot', count: MYINSTANTS_MEME_BUTTONS.filter((b) => b.category === 'brainrot').length },
    { id: 'favorites', label: '⭐ Favorites', count: favorites.size },
  ];

  const filteredButtons = useMemo(() => {
    return MYINSTANTS_MEME_BUTTONS.filter((btn) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        btn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        btn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        btn.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'favorites'
          ? favorites.has(btn.id)
          : btn.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory, favorites]);

  const replenishShuffleDeck = () => {
    const deck = [...MYINSTANTS_MEME_BUTTONS];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    shuffleDeckRef.current = deck;
    shuffleIndexRef.current = 0;
  };

  const handlePlaySound = (btn: MyInstantsSoundButton) => {
    audioEngine.unlockAudio();
    setActiveButtonId(btn.id);

    // ZERO OVERLAP, STRICT 1-SECOND MAXIMUM, REAL RECORDED AUDIO ONLY!
    realMemeAudio.play(btn.soundUrl, btn.fallbackUrl, volume, btn.id);
  };

  const handleStopAll = () => {
    realMemeAudio.stop();
    setActiveButtonId(null);
  };

  const handleRandomShuffle = () => {
    if (
      shuffleDeckRef.current.length === 0 ||
      shuffleIndexRef.current >= shuffleDeckRef.current.length
    ) {
      replenishShuffleDeck();
    }
    const nextBtn = shuffleDeckRef.current[shuffleIndexRef.current++];
    if (nextBtn) {
      handlePlaySound(nextBtn);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSimulateChessCapture = (btn: MyInstantsSoundButton, e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.unlockAudio();
    audioEngine.triggerChessEvent({
      event: btn.chessEvent,
      piece: 'q',
      captured: 'r',
      playerColor: 'w',
      moveNumber: 18,
      evaluationSwing: btn.intensity >= 3 ? -3.5 : 1.5,
    });
    handlePlaySound(btn);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#12161f] border border-slate-700/80 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col font-['Plus_Jakarta_Sans']">
        {/* Header - Styled like authentic MyInstants */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            {/* MyInstants Red Badge Logo */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center shadow-lg border border-rose-400/40 shrink-0">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white font-['Outfit']">
                  MyInstants Meme Soundboard
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full">
                  {MYINSTANTS_MEME_BUTTONS.length} Buttons
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Exact meme sound buttons from</span>
                <span className="text-rose-400 font-mono text-[11px]">myinstants.com/en/search/?name=meme</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.myinstants.com/en/search/?name=meme"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <span>Source URL</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Global Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sound buttons... (e.g. Vine Boom, Bruh, Emotional Damage)"
              className="w-full pl-10 pr-9 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleRandomShuffle}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle Instant</span>
            </button>

            <button
              onClick={handleStopAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-200 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              title="Stop All Playing Sounds"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 accent-rose-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
            </div>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat.id ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* The Signature MyInstants 3D Push-Button Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredButtons.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">No meme sound buttons match "{searchQuery}"</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-rose-400 hover:underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4 p-1">
              {filteredButtons.map((btn) => {
                const isPlaying = activeButtonId === btn.id;
                const isFav = favorites.has(btn.id);

                return (
                  <div
                    key={btn.id}
                    onClick={() => handlePlaySound(btn)}
                    className="group relative flex flex-col items-center p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-950 transition-all cursor-pointer select-none"
                  >
                    {/* Top Action Buttons (Favorite + Chess Simulation) */}
                    <div className="w-full flex items-center justify-between mb-2 px-1">
                      <button
                        onClick={(e) => toggleFavorite(btn.id, e)}
                        className={`text-xs p-1 rounded-md transition-colors ${
                          isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                        }`}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        ★
                      </button>
                      <button
                        onClick={(e) => handleSimulateChessCapture(btn, e)}
                        className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-0.5 px-1 py-0.5 rounded border border-transparent hover:border-rose-500/30 transition-colors"
                        title="Test sound as Chess Capture reaction"
                      >
                        <Swords className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Iconic MyInstants Circular 3D Push Button */}
                    <div className="relative mb-2.5">
                      {/* Ripple Glow Halo When Playing */}
                      {isPlaying && (
                        <div
                          className="absolute -inset-2 rounded-full animate-ping opacity-75"
                          style={{ backgroundColor: btn.color }}
                        />
                      )}

                      {/* 3D Button Outer Bezel / Base */}
                      <div
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-1 transition-transform group-active:translate-y-1 shadow-lg"
                        style={{
                          backgroundColor: btn.darkColor,
                          boxShadow: isPlaying
                            ? `0 0 20px ${btn.color}, inset 0 2px 4px rgba(0,0,0,0.4)`
                            : `0 6px 0 ${btn.darkColor}, 0 10px 12px rgba(0,0,0,0.5)`,
                        }}
                      >
                        {/* 3D Button Front Face with Specular Highlight */}
                        <div
                          className={`w-full h-full rounded-full flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                            isPlaying ? 'brightness-125 scale-95' : 'group-hover:brightness-110'
                          }`}
                          style={{
                            background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${btn.color} 55%, ${btn.darkColor} 100%)`,
                          }}
                        >
                          {/* Top Specular Glare Arc */}
                          <div className="absolute top-1 left-2 right-2 h-4 rounded-full bg-white/40 blur-[1px] pointer-events-none" />

                          {/* Center Icon: Animated Waveform or Speaker */}
                          {isPlaying ? (
                            <div className="flex items-center gap-0.5 h-5">
                              <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:0ms] h-4" />
                              <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:150ms] h-5" />
                              <span className="w-1 bg-white rounded-full animate-bounce [animation-delay:300ms] h-3" />
                            </div>
                          ) : (
                            <Volume2 className="w-6 h-6 text-white drop-shadow-md group-hover:scale-110 transition-transform" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Button Name Label */}
                    <div className="text-center w-full px-1">
                      <p className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors line-clamp-2 leading-tight">
                        {btn.name}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] text-slate-500 font-mono">
                        <span>{btn.playsCount}</span>
                        <span>•</span>
                        <span className="capitalize">{btn.category}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer / Chess Integration Summary */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>
              All <strong>{MYINSTANTS_MEME_BUTTONS.length} MyInstants buttons</strong> are automatically active in your chess games on captures & checks!
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Done & Return to Chessboard
          </button>
        </div>
      </div>
    </div>
  );
};
