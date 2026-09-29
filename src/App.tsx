/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import {
  VolumeX,
  Volume2,
  RotateCcw,
  Sparkles,
  Share2,
  Check,
  Flag,
  Handshake,
  Home,
} from 'lucide-react';

import {
  GameMode,
  PieceColor,
  PieceType,
  AIDifficulty,
  AI_DIFFICULTIES,
  RecordedMove,
  TIME_CONTROLS,
  GameRoomState,
} from './types/chess';
import { ChessBoard } from './components/ChessBoard';
import { PlayerCard } from './components/GameHUD';
import { PromotionModal } from './components/PromotionModal';
import { GameReviewModal } from './components/GameReviewModal';
import { MemeOverlay } from './components/MemeOverlay';
import { ChatAndReactions } from './components/ChatAndReactions';
import { audioEngine } from './audio/AudioEngine';
import { realMemeAudio } from './audio/RealMemeAudioService';
import { MYINSTANTS_MEME_BUTTONS } from './audio/MyInstantsMemeCollection';
import { ChessEventTrigger } from './types/audio';
import { evaluateBoard, classifyMove } from './engine/evaluator';
import { getAIMove } from './engine/aiBot';
import { multiplayerClient } from './services/multiplayerClient';
import { LandingPage } from './components/LandingPage';

const KING_MASCOT = '/src/assets/images/mascot_brainrot_king_1790611325139.jpg';
const GIGACHAD_MASCOT = '/src/assets/images/mascot_gigachad_knight_1790611336636.jpg';

export default function App() {
  // Game State
  const [game, setGame] = useState<Chess>(new Chess());
  const [gameMode, setGameMode] = useState<GameMode>('pvp_online');
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [orientation, setOrientation] = useState<PieceColor>('w');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [recordedMoves, setRecordedMoves] = useState<RecordedMove[]>([]);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);

  const [selectedTimeControl, setSelectedTimeControl] = useState(TIME_CONTROLS[2]); // 5+3
  const [clocks, setClocks] = useState<{ w: number; b: number }>({
    w: 300000,
    b: 300000,
  });
  const [isClockRunning, setIsClockRunning] = useState<boolean>(false);

  const [currentEval, setCurrentEval] = useState<number>(0);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [capturedWhite, setCapturedWhite] = useState<PieceType[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<PieceType[]>([]);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(audioEngine.getSettings().muted);
  const [mpRoomState, setMpRoomState] = useState<GameRoomState | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { id: string; senderName: string; content: string; isSystem?: boolean }[]
  >([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLanding, setShowLanding] = useState(false);

  // Initialize Audio & URL params for Room joins
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setGameMode('pvp_online');
      multiplayerClient.connect().then(() => {
        multiplayerClient.joinRoom(roomParam.toUpperCase());
      });
    }

    // Unlock audio automatically on load
    audioEngine.unlockAudio();
    realMemeAudio.unlock();

    // Subscribe to multiplayer client
    const unsubRoom = multiplayerClient.onRoomState((state) => {
      setMpRoomState(state);

      const newGame = new Chess();
      if (state.fen) {
        try {
          newGame.load(state.fen);
          setGame(newGame);
        } catch {}
      }

      const myId = multiplayerClient.getPlayerId();
      if (state.whitePlayer?.id === myId) {
        setPlayerColor('w');
        setOrientation('w');
      } else if (state.blackPlayer?.id === myId) {
        setPlayerColor('b');
        setOrientation('b');
      }

      if (state.clocks) {
        setClocks({ w: state.clocks.w, b: state.clocks.b });
      }

      if (state.status === 'checkmate') {
        setGameOverReason(`Checkmate! ${state.winner === 'w' ? 'White' : 'Black'} Wins 💀`);
      } else if (state.status === 'stalemate' || state.status === 'draw') {
        setGameOverReason('Game Drawn');
      } else if (state.status === 'timeout') {
        setGameOverReason(`Timeout! ${state.winner === 'w' ? 'White' : 'Black'} Wins on time ⏳`);
      } else if (state.status === 'resigned') {
        setGameOverReason(`${state.winner === 'w' ? 'White' : 'Black'} Won by Resignation 💀`);
      }
    });

    const unsubCustom = multiplayerClient.onCustomEvent((type, data) => {
      if (type === 'reaction_broadcast') {
        audioEngine.triggerQuickReaction(data.content, data.senderName);
        setChatMessages((prev) => [
          ...prev,
          { id: 'react_' + Date.now(), senderName: data.senderName, content: data.content },
        ]);
      } else if (type === 'chat_broadcast') {
        setChatMessages((prev) => [
          ...prev,
          { id: 'chat_' + Date.now(), senderName: data.senderName, content: data.content },
        ]);
      } else if (type === 'move_made' && data.audioContext) {
        audioEngine.triggerChessEvent(data.audioContext);
      }
    });

    MYINSTANTS_MEME_BUTTONS.forEach((btn) => {
      realMemeAudio.preload(btn.soundUrl);
    });

    return () => {
      unsubRoom();
      unsubCustom();
    };
  }, []);

  // Clock countdown timer
  useEffect(() => {
    if (!isClockRunning || gameMode === 'pvp_online' || selectedTimeControl.initialSeconds === 0) return;

    const interval = setInterval(() => {
      setClocks((prev) => {
        const turn = game.turn();
        if (turn === 'w') {
          const next = Math.max(0, prev.w - 100);
          if (next === 0) {
            setIsClockRunning(false);
            setGameOverReason('Black wins on time! 💀');
            audioEngine.triggerChessEvent({ event: 'timeout', playerColor: 'w', moveNumber: recordedMoves.length });
          }
          return { ...prev, w: next };
        } else {
          const next = Math.max(0, prev.b - 100);
          if (next === 0) {
            setIsClockRunning(false);
            setGameOverReason('White wins on time! 💀');
            audioEngine.triggerChessEvent({ event: 'timeout', playerColor: 'b', moveNumber: recordedMoves.length });
          }
          return { ...prev, b: next };
        }
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isClockRunning, game, gameMode, selectedTimeControl, recordedMoves.length]);

  // Execute Move
  const executeMove = useCallback(
    (from: string, to: string, promotion: PieceType = 'q') => {
      if (game.isGameOver()) return;

      const evalBefore = evaluateBoard(game);
      const pieceOnSource = game.get(from as Square);
      const targetPiece = game.get(to as Square);
      const isEnPassant = pieceOnSource?.type === 'p' && from[0] !== to[0] && !targetPiece;

      if (gameMode === 'pvp_online') {
        multiplayerClient.makeMove(from, to, promotion, 0);
        return;
      }

      try {
        const moveResult = game.move({ from, to, promotion });

        if (!moveResult) return;

        if (selectedTimeControl.incrementSeconds > 0) {
          const incMs = selectedTimeControl.incrementSeconds * 1000;
          setClocks((prev) => ({
            ...prev,
            [moveResult.color]: prev[moveResult.color] + incMs,
          }));
        }

        if (!isClockRunning && selectedTimeControl.initialSeconds > 0) {
          setIsClockRunning(true);
        }

        const evalAfter = evaluateBoard(game);
        setCurrentEval(evalAfter);

        const { classification, swing } = classifyMove(
          evalBefore,
          evalAfter,
          moveResult.color,
          game.isCheckmate(),
          Boolean(moveResult.captured),
          game.inCheck()
        );

        if (moveResult.captured) {
          if (moveResult.color === 'w') {
            setCapturedBlack((prev) => [...prev, moveResult.captured as PieceType]);
          } else {
            setCapturedWhite((prev) => [...prev, moveResult.captured as PieceType]);
          }
        }

        const recMove: RecordedMove = {
          san: moveResult.san,
          from: moveResult.from,
          to: moveResult.to,
          piece: moveResult.piece as PieceType,
          color: moveResult.color,
          captured: moveResult.captured as PieceType,
          promotion: moveResult.promotion as PieceType,
          flags: moveResult.flags,
          fenBefore: game.fen(),
          fenAfter: game.fen(),
          evalBefore,
          evalAfter,
          evalSwing: swing,
          classification,
          timestamp: Date.now(),
        };
        setRecordedMoves((prev) => [...prev, recMove]);
        setLastMove({ from: moveResult.from, to: moveResult.to });

        const captureEvent: ChessEventTrigger = moveResult.captured === 'q'
          ? 'capture_queen'
          : moveResult.captured === 'r'
          ? 'capture_rook'
          : (moveResult.captured === 'b' || moveResult.captured === 'n')
          ? 'capture_minor'
          : (moveResult.captured === 'p' || isEnPassant)
          ? 'capture_pawn'
          : 'move_piece';

        audioEngine.triggerChessEvent({
          event: captureEvent,
          piece: moveResult.piece,
          captured: moveResult.captured,
          from: moveResult.from,
          to: moveResult.to,
          san: moveResult.san,
          playerColor: moveResult.color,
          evaluationBefore: evalBefore,
          evaluationAfter: evalAfter,
          evaluationSwing: swing,
          isCheck: game.inCheck(),
          isCheckmate: game.isCheckmate(),
          isEnPassant,
          isPromotion: Boolean(moveResult.promotion),
          moveNumber: recordedMoves.length + 1,
        });

        if (game.isCheckmate()) {
          setIsClockRunning(false);
          setGameOverReason(`Checkmate! ${moveResult.color === 'w' ? 'White' : 'Black'} Wins 💀`);
        } else if (game.isStalemate()) {
          setIsClockRunning(false);
          setGameOverReason('Stalemate! Accidental Draw 🤡');
        } else if (game.isDraw()) {
          setIsClockRunning(false);
          setGameOverReason('Draw by repetition or material');
        }

        if (gameMode === 'vs_ai' && !game.isGameOver() && game.turn() !== playerColor) {
          setIsAiThinking(true);
          getAIMove(game, aiDifficulty).then((aiMove) => {
            setIsAiThinking(false);
            if (aiMove) {
              executeMove(aiMove.from, aiMove.to, aiMove.promotion as PieceType);
            }
          });
        }
      } catch (err) {
        console.error('Move error:', err);
      }
    },
    [game, gameMode, selectedTimeControl, isClockRunning, playerColor, aiDifficulty, recordedMoves.length]
  );

  const startNewGame = () => {
    const newG = new Chess();
    setGame(newG);
    setRecordedMoves([]);
    setLastMove(null);
    setGameOverReason(null);
    setCurrentEval(0);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setClocks({
      w: selectedTimeControl.initialSeconds * 1000,
      b: selectedTimeControl.initialSeconds * 1000,
    });
    setIsClockRunning(false);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.updateSettings({ muted: nextMuted });
  };

  const copyInviteLink = () => {
    if (!mpRoomState?.roomId) return;
    const url = `${window.location.origin}?room=${mpRoomState.roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const isInteractive =
    !gameOverReason &&
    !isAiThinking &&
    (gameMode === 'pvp_local' ||
      (gameMode === 'vs_ai' && game.turn() === playerColor) ||
      (gameMode === 'pvp_online' && mpRoomState?.status === 'in_progress' && mpRoomState.turn === playerColor));

  const isPlayerWhite = orientation === 'w';
  const topColor: PieceColor = isPlayerWhite ? 'b' : 'w';
  const bottomColor: PieceColor = isPlayerWhite ? 'w' : 'b';

  if (showLanding) {
    return (
      <LandingPage
        onStartGame={(mode) => {
          setGameMode(mode);
          setShowLanding(false);
          startNewGame();
        }}
        onJoinRoom={(roomId) => {
          window.location.href = `${window.location.pathname}?room=${encodeURIComponent(roomId)}`;
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      <MemeOverlay />

      {/* Header */}
      <header className="w-full flex items-center justify-between px-4 sm:px-8 py-3 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <button
          onClick={() => setShowLanding(true)}
          className="text-lg sm:text-xl font-black text-white hover:text-rose-400 transition-colors font-['Outfit'] flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Brainrot Chess
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className={`p-2 rounded-lg border transition-all ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Game Board */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Chessboard */}
        <div className="lg:col-span-8 flex flex-col items-center gap-3">
          {/* Top Player */}
          <div className="w-full max-w-[560px]">
            <PlayerCard
              name={
                gameMode === 'vs_ai'
                  ? AI_DIFFICULTIES.find((d) => d.id === aiDifficulty)?.name || 'AI Bot'
                  : gameMode === 'pvp_online'
                  ? topColor === 'w'
                    ? mpRoomState?.whitePlayer?.name || 'Waiting...'
                    : mpRoomState?.blackPlayer?.name || 'Waiting...'
                  : `Player 2 (${topColor === 'w' ? 'White' : 'Black'})`
              }
              rating={
                gameMode === 'vs_ai'
                  ? AI_DIFFICULTIES.find((d) => d.id === aiDifficulty)?.elo || 1200
                  : 1350
              }
              avatarUrl={
                gameMode === 'vs_ai'
                  ? aiDifficulty === 'expert' || aiDifficulty === 'master'
                    ? GIGACHAD_MASCOT
                    : KING_MASCOT
                  : undefined
              }
              color={topColor}
              isTurn={game.turn() === topColor}
              timeRemainingMs={clocks[topColor]}
              capturedPieces={topColor === 'w' ? capturedWhite : capturedBlack}
              isAi={gameMode === 'vs_ai'}
            />
          </div>

          {/* Board */}
          <div className="relative flex items-center justify-center w-full">
            <ChessBoard
              game={game}
              orientation={orientation}
              isInteractive={isInteractive}
              lastMove={lastMove}
              onMakeMove={(from, to, promo) => executeMove(from, to, promo)}
              onRequestPromotion={(from, to) => setPromotionPending({ from, to })}
            />
          </div>

          {/* Bottom Player */}
          <div className="w-full max-w-[560px]">
            <PlayerCard
              name={
                gameMode === 'pvp_online'
                  ? multiplayerClient.getPlayerName()
                  : `You (${bottomColor === 'w' ? 'White' : 'Black'})`
              }
              rating={1420}
              color={bottomColor}
              isTurn={game.turn() === bottomColor}
              timeRemainingMs={clocks[bottomColor]}
              capturedPieces={bottomColor === 'w' ? capturedWhite : capturedBlack}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 w-full max-w-[560px]">
            <button
              onClick={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Flip
            </button>

            {gameMode === 'pvp_online' && mpRoomState?.status === 'in_progress' && (
              <>
                <button
                  onClick={() => multiplayerClient.resign()}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-950/60 text-rose-500 border border-slate-800 rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Resign
                </button>
                <button
                  onClick={() => multiplayerClient.offerDraw()}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                >
                  <Handshake className="w-3.5 h-3.5 text-amber-400" />
                  Draw
                </button>
              </>
            )}

            <div className="ml-auto">
              {recordedMoves.length > 0 && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-rose-400 font-bold border border-slate-800 rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Reel 🎬
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Multiplayer/AI Controls & Chat */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Game Controls Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {gameMode === 'pvp_online' && mpRoomState?.roomId && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Invite Link:</span>
                  <button
                    onClick={copyInviteLink}
                    className="flex items-center gap-1 px-2 py-1 bg-rose-600 hover:bg-rose-500 rounded-lg text-white text-xs font-bold transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3 h-3" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
                <code className="block text-xs font-mono text-cyan-300 bg-slate-900 p-2 rounded text-center">
                  {mpRoomState.roomId}
                </code>
              </div>
            )}

            {gameMode === 'vs_ai' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">AI Difficulty:</label>
                <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                  {AI_DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setAiDifficulty(d.id);
                        startNewGame();
                      }}
                      className={`p-2 rounded-lg text-xs font-semibold border transition-all text-left ${
                        aiDifficulty === d.id
                          ? 'bg-rose-500/15 border-rose-500 text-white'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold">{d.name}</div>
                      <div className="text-[10px] text-slate-500">{d.elo}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-700">
              <label className="text-xs font-bold text-slate-300 mb-2 block">Time Control:</label>
              <div className="grid grid-cols-3 gap-1">
                {TIME_CONTROLS.slice(0, 3).map((tc) => (
                  <button
                    key={tc.name}
                    onClick={() => {
                      setSelectedTimeControl(tc);
                      setClocks({
                        w: tc.initialSeconds * 1000,
                        b: tc.initialSeconds * 1000,
                      });
                    }}
                    className={`py-1 px-1 rounded text-xs font-semibold border transition-all ${
                      selectedTimeControl.name === tc.name
                        ? 'bg-slate-800 border-rose-500 text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {tc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat */}
          <ChatAndReactions
            onSendReaction={(emoji) => {
              if (gameMode === 'pvp_online') {
                multiplayerClient.sendReaction(emoji);
              }
            }}
            onSendChat={(msg) => {
              if (gameMode === 'pvp_online') {
                multiplayerClient.sendChat(msg);
              }
            }}
            messages={chatMessages}
            playerName={multiplayerClient.getPlayerName()}
            isMultiplayer={gameMode === 'pvp_online'}
          />
        </div>
      </main>

      {/* Modals */}
      {promotionPending && (
        <PromotionModal
          color={game.turn()}
          onSelect={(piece) => {
            executeMove(promotionPending.from, promotionPending.to, piece);
            setPromotionPending(null);
          }}
          onCancel={() => setPromotionPending(null)}
        />
      )}

      {gameOverReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-2xl font-black text-white font-['Outfit']">{gameOverReason}</h3>
            <p className="text-xs text-slate-400">Play again or review the game?</p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setGameOverReason(null);
                  startNewGame();
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Play Again ⚔️
              </button>
              {recordedMoves.length > 0 && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
                >
                  Review 🎬
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <GameReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        moves={recordedMoves}
      />
    </div>
  );
}
