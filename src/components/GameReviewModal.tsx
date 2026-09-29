/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Play, Square as StopIcon, X, Sparkles } from 'lucide-react';
import { RecordedMove } from '../types/chess';
import { ChessBoard } from './ChessBoard';
import { audioEngine } from '../audio/AudioEngine';

interface GameReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  moves: RecordedMove[];
}

export const GameReviewModal: React.FC<GameReviewModalProps> = ({ isOpen, onClose, moves }) => {
  const [currentMoveIdx, setCurrentMoveIdx] = useState<number>(moves.length - 1);
  const [reviewGame, setReviewGame] = useState<Chess>(new Chess());
  const [isHighlightPlaying, setIsHighlightPlaying] = useState<boolean>(false);

  useEffect(() => {
    // Replay up to currentMoveIdx
    const game = new Chess();
    for (let i = 0; i <= currentMoveIdx && i < moves.length; i++) {
      try {
        game.move({
          from: moves[i].from,
          to: moves[i].to,
          promotion: moves[i].promotion || 'q',
        });
      } catch {}
    }
    setReviewGame(game);
  }, [currentMoveIdx, moves]);

  if (!isOpen) return null;

  const currentMove = moves[currentMoveIdx];
  const lastMoveHighlight = currentMove ? { from: currentMove.from, to: currentMove.to } : null;

  // Brainrot Highlight Reel: Plays through the top funniest/worst blunder moments!
  const playHighlightReel = async () => {
    if (moves.length === 0) return;
    setIsHighlightPlaying(true);

    // Filter key highlights: catastrophic blunders, blunders, brilliant moves, or checkmate
    const highlightIndices = moves
      .map((m, idx) => ({ m, idx }))
      .filter(
        ({ m, idx }) =>
          m.classification === 'catastrophic_blunder' ||
          m.classification === 'blunder' ||
          m.classification === 'brilliant' ||
          idx === moves.length - 1
      )
      .map((x) => x.idx);

    const steps = highlightIndices.length > 0 ? highlightIndices : moves.map((_, i) => i);

    for (const stepIdx of steps) {
      setCurrentMoveIdx(stepIdx);
      const move = moves[stepIdx];

      // Trigger meme audio
      audioEngine.triggerChessEvent({
        event: move.classification === 'brilliant' ? 'brilliant' : move.captured ? 'capture_queen' : 'blunder',
        evaluationSwing: move.evalSwing,
        captured: move.captured,
        piece: move.piece,
        playerColor: move.color,
        moveNumber: stepIdx + 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setIsHighlightPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col md:flex-row gap-6 my-auto">
        {/* Left: Chessboard */}
        <div className="flex-1 flex flex-col items-center">
          <ChessBoard
            game={reviewGame}
            isInteractive={false}
            lastMove={lastMoveHighlight}
            onMakeMove={() => {}}
          />
        </div>

        {/* Right: Move history & Brainrot Highlight Reel Controls */}
        <div className="w-full md:w-80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-500" />
                Game Review & Highlights
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Move Evaluation Badge */}
            {currentMove && (
              <div className="my-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">
                    Move {currentMoveIdx + 1}: {currentMove.san}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      currentMove.classification === 'brilliant'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : currentMove.classification === 'catastrophic_blunder' ||
                          currentMove.classification === 'blunder'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {currentMove.classification.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Eval Swing:{' '}
                  <span className="font-mono text-slate-200">
                    {currentMove.evalSwing > 0 ? `+${currentMove.evalSwing}` : currentMove.evalSwing}
                  </span>
                </div>
              </div>
            )}

            {/* Move List */}
            <div className="max-h-48 overflow-y-auto bg-slate-950/40 p-2 rounded-xl border border-slate-800/80 space-y-1 text-xs">
              {moves.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentMoveIdx(idx)}
                  className={`w-full text-left px-2 py-1 rounded flex items-center justify-between transition-colors ${
                    currentMoveIdx === idx
                      ? 'bg-rose-600/30 text-rose-300 font-bold'
                      : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <span>
                    {Math.floor(idx / 2) + 1}. {m.san}
                  </span>
                  <span className="text-[10px] opacity-75">{m.classification}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stepper & Brainrot Reel Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentMoveIdx(-1)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                title="Start of game"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMoveIdx((prev) => Math.max(-1, prev - 1))}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                title="Previous move"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-400 px-2">
                {currentMoveIdx + 1} / {moves.length}
              </span>
              <button
                onClick={() => setCurrentMoveIdx((prev) => Math.min(moves.length - 1, prev + 1))}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                title="Next move"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMoveIdx(moves.length - 1)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                title="End of game"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={playHighlightReel}
              disabled={isHighlightPlaying || moves.length === 0}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              {isHighlightPlaying ? (
                <>
                  <StopIcon className="w-4 h-4 fill-white" />
                  Playing Highlights...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Play Brainrot Highlight Reel 🎬
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
