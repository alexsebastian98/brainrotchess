/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, X, Sparkles, Sliders, ShieldAlert } from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';
import { AudioSettings, ChaosSetting, SoundPackId } from '../types/audio';
import { SOUND_PACKS } from '../audio/MemeTaxonomy';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>(audioEngine.getSettings());

  if (!isOpen) return null;

  const handleChange = (partial: Partial<AudioSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    audioEngine.updateSettings(partial);
  };

  const chaosOptions: { id: ChaosSetting; label: string; desc: string }[] = [
    { id: 'normal', label: 'Normal', desc: 'Light sounds only on critical captures & checks' },
    { id: 'tiktok', label: 'TikTok', desc: 'Frequent soundbites on tactical moves' },
    { id: 'brainrot', label: 'Brainrot', desc: 'FAH, VINE BOOM, GET OUT, YOOO, FAT CAT HUH on captures & blunders' },
    { id: 'nuclear', label: 'Nuclear', desc: 'Maximum sound chaos and screen shake on every move' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white">Audio & Chaos Engine Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Mute & Volume */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3">
              {settings.muted ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              )}
              <div>
                <p className="text-xs font-bold text-white">Sound Output</p>
                <p className="text-[11px] text-slate-400">
                  {settings.muted ? 'Audio is currently muted' : 'Audio engine active'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleChange({ muted: !settings.muted })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                settings.muted
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {settings.muted ? 'Unmute' : 'Mute All'}
            </button>
          </div>

          {/* Volume Sliders */}
          <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Master Volume</span>
                <span className="font-mono text-slate-400">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleChange({ masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Meme Sounds (MyInstants Soundboard)</span>
                <span className="font-mono text-slate-400">{Math.round(settings.memeVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.memeVolume}
                onChange={(e) => handleChange({ memeVolume: parseFloat(e.target.value) })}
                className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Tactile Chess Sounds (Moves, Captures)</span>
                <span className="font-mono text-slate-400">{Math.round(settings.chessVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.chessVolume}
                onChange={(e) => handleChange({ chessVolume: parseFloat(e.target.value) })}
                className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Chaos Setting */}
        <div>
          <label className="text-xs font-bold text-slate-300 mb-2 block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Chaos & Meme Frequency
          </label>
          <div className="grid grid-cols-2 gap-2">
            {chaosOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleChange({ chaosSetting: opt.id })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  settings.chaosSetting === opt.id
                    ? 'bg-rose-500/15 border-rose-500 text-white shadow-sm'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold capitalize text-slate-200">{opt.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sound Packs */}
        <div>
          <label className="text-xs font-bold text-slate-300 mb-2 block">
            Sound Pack Architecture
          </label>
          <div className="space-y-1.5">
            {SOUND_PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => handleChange({ selectedPack: pack.id as SoundPackId })}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  settings.selectedPack === pack.id
                    ? 'bg-slate-800 border-rose-500 text-white'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">{pack.name}</div>
                  <div className="text-[10px] text-slate-500">{pack.description}</div>
                </div>
                {settings.selectedPack === pack.id && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Direct User Request: Only on Captures */}
          <label className="flex items-start gap-2.5 p-3 bg-slate-950/80 rounded-xl border border-rose-500/40 text-xs text-slate-200 cursor-pointer col-span-2 hover:bg-slate-950 transition-colors">
            <input
              type="checkbox"
              checked={settings.onlyPlayOnCaptures}
              onChange={(e) => handleChange({ onlyPlayOnCaptures: e.target.checked })}
              className="accent-rose-500 rounded mt-0.5"
            />
            <div className="flex-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                Play Meme Sounds Only on Captures
                <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full font-mono">
                  Recommended
                </span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Normal piece moves play quiet natural wood clicks. Spliced 2025-2026 meme sounds blast exclusively when a piece is captured!
              </p>
            </div>
          </label>

          {/* User Request: Sound Variety on Shuffle */}
          <label className="flex items-start gap-2.5 p-3 bg-slate-950/80 rounded-xl border border-indigo-500/40 text-xs text-slate-200 cursor-pointer col-span-2 hover:bg-slate-950 transition-colors">
            <input
              type="checkbox"
              checked={settings.shuffleSounds}
              onChange={(e) => handleChange({ shuffleSounds: e.target.checked })}
              className="accent-indigo-500 rounded mt-0.5"
            />
            <div className="flex-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                Sound Variety on Shuffle (True Shuffled Queue)
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full font-mono">
                  Active
                </span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Shuffles through all MyInstants meme sounds (Vine Boom, Bruh, Emotional Damage, Metal Pipe, Windows XP Error, SpongeBob Fail & more) while bringing in FAH from time to time.
              </p>
            </div>
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.visualToastsEnabled}
              onChange={(e) => handleChange({ visualToastsEnabled: e.target.checked })}
              className="accent-rose-500 rounded"
            />
            <span>Visual Meme Popups</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.screenShakeEnabled}
              onChange={(e) => handleChange({ screenShakeEnabled: e.target.checked })}
              className="accent-rose-500 rounded"
            />
            <span>Screen Shake</span>
          </label>

          <div className="col-span-2 p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>AI Robot Voice / TTS:</span>
            <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
              Completely Disabled (0 Robot Talk)
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Save & Return to Chessboard
          </button>
        </div>
      </div>
    </div>
  );
};
