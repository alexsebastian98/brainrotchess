/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chess, Move } from 'chess.js';
import { AIDifficulty, AI_DIFFICULTIES } from '../types/chess';
import { evaluateBoard } from './evaluator';

/**
 * Minimax with Alpha-Beta Pruning and Move Ordering.
 */
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): { score: number; bestMove: Move | null } {
  if (depth === 0 || game.isGameOver()) {
    return { score: evaluateBoard(game), bestMove: null };
  }

  // Get legal moves with verbose detail
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) {
    return { score: evaluateBoard(game), bestMove: null };
  }

  // Move ordering heuristic: order captures, checks, and promotions first
  moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) scoreA += 10;
    if (b.captured) scoreB += 10;
    if (a.san.includes('+')) scoreA += 5;
    if (b.san.includes('+')) scoreB += 5;
    if (a.promotion) scoreA += 8;
    if (b.promotion) scoreB += 8;
    return scoreB - scoreA;
  });

  let bestMove: Move | null = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false).score;
      game.undo();

      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move;
      }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Beta cutoff
    }
    return { score: maxEval, bestMove };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, true).score;
      game.undo();

      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move;
      }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return { score: minEval, bestMove };
  }
}

/**
 * Computes the next best AI move based on difficulty settings.
 */
export async function getAIMove(game: Chess, difficulty: AIDifficulty): Promise<Move | null> {
  const config = AI_DIFFICULTIES.find((d) => d.id === difficulty) || AI_DIFFICULTIES[2];
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Add realistic human-like thinking delay (350ms - 850ms)
  const delay = Math.floor(Math.random() * 500) + 350;
  await new Promise((r) => setTimeout(r, delay));

  // Blunder injection for lower difficulty levels
  if (Math.random() < config.blunderRate && moves.length > 1) {
    // Pick a suboptimal or random move
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }

  // Minimax search
  const isWhite = game.turn() === 'w';
  const result = minimax(game, config.depth, -Infinity, Infinity, isWhite);

  if (result.bestMove) {
    return result.bestMove;
  }

  // Fallback: Pick first legal move
  return moves[0];
}
