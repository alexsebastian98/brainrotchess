/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { MoveClassification } from '../types/chess';

// Piece-Square Values (Centipawns)
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Simplified Piece-Square Tables (White perspective; flipped for Black)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

/**
 * Evaluates the board position in pawns from White's perspective (+ is winning for White, - is winning for Black).
 */
export function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -100 : 100;
  }
  if (game.isDraw()) {
    return 0;
  }

  let score = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseVal = PIECE_VALUES[piece.type];
      const squareIdx = r * 8 + c;
      const flippedIdx = (7 - r) * 8 + c;

      let positional = 0;
      if (piece.type === 'p') {
        positional = piece.color === 'w' ? PAWN_TABLE[squareIdx] : PAWN_TABLE[flippedIdx];
      } else if (piece.type === 'n') {
        positional = piece.color === 'w' ? KNIGHT_TABLE[squareIdx] : KNIGHT_TABLE[flippedIdx];
      } else if (piece.type === 'b') {
        positional = piece.color === 'w' ? BISHOP_TABLE[squareIdx] : BISHOP_TABLE[flippedIdx];
      }

      const totalPieceScore = baseVal + positional;
      score += piece.color === 'w' ? totalPieceScore : -totalPieceScore;
    }
  }

  // Convert centipawns to pawns
  return Number((score / 100).toFixed(2));
}

/**
 * Classifies a move based on the evaluation swing from the mover's point of view.
 */
export function classifyMove(
  evalBefore: number,
  evalAfter: number,
  color: Color,
  isCheckmate: boolean,
  isCapture: boolean,
  isCheck: boolean,
  pieceSacrificed: boolean = false
): { classification: MoveClassification; swing: number } {
  // Mover perspective: positive swing means improvement, negative means loss
  const swing = color === 'w' ? evalAfter - evalBefore : evalBefore - evalAfter;

  if (isCheckmate) {
    return { classification: 'brilliant', swing: Math.max(swing, 10.0) };
  }

  // Brilliant move: tactical sacrifice yielding a winning advantage
  if (pieceSacrificed && swing >= 1.5) {
    return { classification: 'brilliant', swing };
  }
  if (swing >= 2.5 && isCheck) {
    return { classification: 'brilliant', swing };
  }

  if (swing <= -4.0) {
    return { classification: 'catastrophic_blunder', swing };
  }
  if (swing <= -2.2) {
    return { classification: 'blunder', swing };
  }
  if (swing <= -1.1) {
    return { classification: 'mistake', swing };
  }
  if (swing <= -0.55) {
    return { classification: 'inaccuracy', swing };
  }
  if (swing >= 1.2) {
    return { classification: 'great', swing };
  }
  if (swing >= -0.25) {
    return { classification: 'best', swing };
  }
  return { classification: 'good', swing };
}
