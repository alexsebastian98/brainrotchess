/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { PieceColor, PieceType } from '../types/chess';
import { ChessPieceIcon } from './ChessPieces';

interface ChessBoardProps {
  game: Chess;
  orientation?: PieceColor; // 'w' or 'b'
  isInteractive?: boolean;
  lastMove?: { from: string; to: string } | null;
  onMakeMove: (from: string, to: string, promotion?: PieceType) => void;
  onRequestPromotion?: (from: string, to: string) => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  orientation = 'w',
  isInteractive = true,
  lastMove = null,
  onMakeMove,
  onRequestPromotion,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const board = game.board(); // 8x8 array: rank 8 down to 1, file a to h
  const isFlipped = orientation === 'b';
  const ranks = isFlipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  // Calculate legal moves for selected square
  const legalMovesFromSelected = selectedSquare
    ? game.moves({ square: selectedSquare, verbose: true })
    : [];

  const handleSquareClick = (sq: Square) => {
    if (!isInteractive) return;

    if (selectedSquare) {
      if (selectedSquare === sq) {
        setSelectedSquare(null);
        return;
      }

      // Check if clicked square is a valid target
      const move = legalMovesFromSelected.find((m) => m.to === sq);
      if (move) {
        // Check for pawn promotion
        const piece = game.get(selectedSquare);
        const isPromotion =
          piece &&
          piece.type === 'p' &&
          ((piece.color === 'w' && sq.endsWith('8')) || (piece.color === 'b' && sq.endsWith('1')));

        if (isPromotion && onRequestPromotion) {
          onRequestPromotion(selectedSquare, sq);
        } else {
          onMakeMove(selectedSquare, sq, 'q');
        }
        setSelectedSquare(null);
        return;
      }
    }

    // Try selecting piece of current turn
    const pieceOnSquare = game.get(sq);
    if (pieceOnSquare && pieceOnSquare.color === game.turn()) {
      setSelectedSquare(sq);
    } else {
      setSelectedSquare(null);
    }
  };

  // Find king in check for red alert glow
  let checkedKingSquare: Square | null = null;
  if (game.inCheck()) {
    const turnColor = game.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turnColor) {
          checkedKingSquare = p.square as Square;
        }
      }
    }
  }

  return (
    <div className="relative w-full max-w-[560px] aspect-square select-none rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800/80 bg-slate-900">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {ranks.map((rank) =>
          files.map((file) => {
            const squareName = `${file}${rank}` as Square;
            const piece = game.get(squareName);

            const fileIdx = file.charCodeAt(0) - 97;
            const isLightSquare = (fileIdx + rank) % 2 !== 0;

            const isSelected = selectedSquare === squareName;
            const isLastMoveFrom = lastMove?.from === squareName;
            const isLastMoveTo = lastMove?.to === squareName;
            const isCheckedKing = checkedKingSquare === squareName;

            const targetMove = legalMovesFromSelected.find((m) => m.to === squareName);
            const isLegalTarget = Boolean(targetMove);
            const isCaptureTarget = isLegalTarget && (Boolean(piece) || targetMove?.flags.includes('e'));

            return (
              <div
                key={squareName}
                onClick={() => handleSquareClick(squareName)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${
                  isLightSquare ? 'bg-[#3b4759]' : 'bg-[#1e2738]'
                } ${
                  isSelected ? '!bg-rose-500/50 ring-2 ring-rose-400 inset-0' : ''
                } ${
                  isLastMoveFrom || isLastMoveTo ? '!bg-indigo-500/35' : ''
                } ${
                  isCheckedKing ? '!bg-red-600/70 animate-pulse ring-4 ring-red-500' : ''
                }`}
              >
                {/* Board Notation Labels */}
                {file === (isFlipped ? 'h' : 'a') && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] font-mono font-bold pointer-events-none ${
                      isLightSquare ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {rank === (isFlipped ? 8 : 1) && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] font-mono font-bold pointer-events-none ${
                      isLightSquare ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Chess Piece Vector */}
                {piece && (
                  <div className="w-[85%] h-[85%] transition-transform duration-100 hover:scale-105 active:scale-95 z-10 drop-shadow-md">
                    <ChessPieceIcon type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Legal Move Indicators */}
                {isLegalTarget && !isCaptureTarget && (
                  <div className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400/80 pointer-events-none shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                )}
                {isCaptureTarget && (
                  <div className="absolute inset-1 rounded-full border-4 border-rose-500/80 pointer-events-none animate-pulse" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
