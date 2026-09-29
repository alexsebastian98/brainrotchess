/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PieceColor, PieceType } from '../types/chess';
import { ChessPieceIcon } from './ChessPieces';

interface PlayerCardProps {
  name: string;
  rating?: number;
  avatarUrl?: string;
  color: PieceColor;
  isTurn: boolean;
  timeRemainingMs: number;
  capturedPieces: PieceType[];
  materialAdvantage?: number;
  isAi?: boolean;
  connected?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  rating = 1200,
  avatarUrl,
  color,
  isTurn,
  timeRemainingMs,
  capturedPieces,
  materialAdvantage = 0,
  isAi = false,
  connected = true,
}) => {
  // Format clock mm:ss.s
  const formatTime = (ms: number) => {
    if (ms <= 0) return '0:00';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const tenths = Math.floor((ms % 1000) / 100);

    if (totalSecs < 20) {
      return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingMs > 0 && timeRemainingMs < 30000;

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 border ${
        isTurn
          ? 'bg-slate-800/90 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30'
          : 'bg-slate-900/70 border-slate-800/80'
      }`}
    >
      {/* Player info & captured pieces */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-slate-300">
              {color === 'w' ? '♔' : '♚'}
            </span>
          )}
          {!connected && (
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-red-500 ring-1 ring-slate-900" title="Disconnected" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 truncate">
            <span className="truncate">{name}</span>
            {isAi && (
              <span className="text-[10px] px-1 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-mono">
                BOT
              </span>
            )}
            <span className="text-[10px] text-slate-500 font-mono">({rating})</span>
          </div>

          {/* Captured Pieces list */}
          <div className="flex items-center gap-0.5 mt-0.5 h-3.5">
            {capturedPieces.slice(0, 8).map((p, idx) => (
              <div key={idx} className="w-3.5 h-3.5 opacity-70">
                <ChessPieceIcon type={p} color={color === 'w' ? 'b' : 'w'} />
              </div>
            ))}
            {capturedPieces.length > 8 && (
              <span className="text-[9px] text-slate-500 font-mono">+{capturedPieces.length - 8}</span>
            )}
            {materialAdvantage > 0 && (
              <span className="ml-1 text-[10px] font-bold text-emerald-400 font-mono">
                +{materialAdvantage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Clock Timer */}
      <div
        className={`px-3 py-1 rounded-lg font-mono font-bold text-sm tracking-wider tabular-nums transition-colors ${
          isLowTime
            ? 'bg-rose-950 text-rose-400 border border-rose-800/80 animate-pulse'
            : isTurn
            ? 'bg-slate-800 text-white border border-slate-700'
            : 'bg-slate-950/70 text-slate-400 border border-slate-800'
        }`}
      >
        {formatTime(timeRemainingMs)}
      </div>
    </div>
  );
};
