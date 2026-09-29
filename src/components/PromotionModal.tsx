/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PieceColor, PieceType } from '../types/chess';
import { ChessPieceIcon } from './ChessPieces';

interface PromotionModalProps {
  color: PieceColor;
  onSelect: (piece: PieceType) => void;
  onCancel: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ color, onSelect, onCancel }) => {
  const pieces: { type: PieceType; label: string }[] = [
    { type: 'q', label: 'Queen (Ascend 👑)' },
    { type: 'r', label: 'Rook' },
    { type: 'b', label: 'Bishop' },
    { type: 'n', label: 'Knight' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
        <h3 className="text-lg font-bold text-white mb-1">Promote Your Pawn</h3>
        <p className="text-xs text-slate-400 mb-5">Select piece to evolve into:</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="flex flex-col items-center justify-center p-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all hover:scale-105 active:scale-95 group"
            >
              <div className="w-12 h-12 mb-2 group-hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                <ChessPieceIcon type={p.type} color={color} />
              </div>
              <span className="text-xs font-semibold text-slate-200">{p.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-300 py-1 transition-colors"
        >
          Cancel move
        </button>
      </div>
    </div>
  );
};
