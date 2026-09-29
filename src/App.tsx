/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';
import {
  Volume2,
  VolumeX,
  Swords,
  Bot,
  Users,
  RotateCcw,
  Sparkles,
  Share2,
  Check,
  Flag,
  Handshake,
  Play,
  ArrowRight,
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
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { DebugAudioPanel } from './components/DebugAudioPanel';
import { GameReviewModal } from './components/GameReviewModal';
import { MemeOverlay } from './components/MemeOverlay';
import { ChatAndReactions } from './components/ChatAndReactions';
import { Header } from './components/Header';
import { audioEngine } from './audio/AudioEngine';
import { realMemeAudio } from './audio/RealMemeAudioService';
import { MYINSTANTS_MEME_BUTTONS } from './audio/MyInstantsMemeCollection';
import { ChessEventTrigger } from './types/audio';
import { evaluateBoard, classifyMove } from './engine/evaluator';
import { getAIMove } from './engine/aiBot';
import { multiplayerClient } from './services/multiplayerClient';

const HERO_IMAGE = '/src/assets/images/hero_brainrot_chess_1790611314350.jpg';
const KING_MASCOT = '/src/assets/images/mascot_brainrot_king_1790611325139.jpg';
const GIGACHAD_MASCOT = '/src/assets/images/mascot_gigachad_knight_1790611336636.jpg';

export default function App() {
  // Game State
  const [game, setGame] = useState<Chess>(new Chess());
  const [gameMode, setGameMode] = useState<GameMode>('vs_ai');
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [orientation, setOrientation] = useState<PieceColor>('w');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [recordedMoves, setRecordedMoves] = useState<RecordedMove[]>([]);
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null);

  // Clocks
  const [selectedTimeControl, setSelectedTimeControl] = useState(TIME_CONTROLS[2]); // 5+3
  const [clocks, setClocks] = useState<{ w: number; b: number }>({
    w: 300000,
    b: 300000,
  });
  const [isClockRunning, setIsClockRunning] = useState<boolean>(false);

  // Evaluation & Game status
  const [currentEval, setCurrentEval] = useState<number>(0);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [capturedWhite, setCapturedWhite] = useState<PieceType[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<PieceType[]>([]);

  // Modals & Panels
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isDebugBenchOpen, setIsDebugBenchOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(audioEngine.getSettings().muted);

  // Multiplayer State
  const [mpRoomState, setMpRoomState] = useState<GameRoomState | null>(null);
  const [isQueuing, setIsQueuing] = useState(false);
  const [privateRoomCodeInput, setPrivateRoomCodeInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { id: string; senderName: string; content: string; isSystem?: boolean }[]
  >([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize Audio & URL params for Room joins
  useEffect(() => {
    // Check if room code in URL params
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setGameMode('pvp_online');
      multiplayerClient.connect().then(() => {
        multiplayerClient.joinRoom(roomParam.toUpperCase());
      });
    }

    // Subscribe to multiplayer client
    const unsubRoom = multiplayerClient.onRoomState((state) => {
      setMpRoomState(state);
      setIsQueuing(false);

      // Sync chess board
      const newGame = new Chess();
      if (state.fen) {
        try {
          newGame.load(state.fen);
          setGame(newGame);
        } catch {}
      }

      // Determine local player color
      const myId = multiplayerClient.getPlayerId();
      if (state.whitePlayer?.id === myId) {
        setPlayerColor('w');
        setOrientation('w');
      } else if (state.blackPlayer?.id === myId) {
        setPlayerColor('b');
        setOrientation('b');
      }

      // Clocks
      if (state.clocks) {
        setClocks({ w: state.clocks.w, b: state.clocks.b });
      }

      // Game over
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
          {
            id: 'react_' + Date.now(),
            senderName: data.senderName,
            content: data.content,
          },
        ]);
      } else if (type === 'chat_broadcast') {
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'chat_' + Date.now(),
            senderName: data.senderName,
            content: data.content,
          },
        ]);
      } else if (type === 'queued') {
        setIsQueuing(true);
      } else if (type === 'move_made' && data.audioContext) {
        audioEngine.triggerChessEvent(data.audioContext);
      }
    });

    // Preload MyInstants meme sound files for instant 0ms response
    MYINSTANTS_MEME_BUTTONS.forEach((btn) => {
      realMemeAudio.preload(btn.soundUrl);
    });

    return () => {
      unsubRoom();
      unsubCustom();
    };
  }, []);

  // Unlock Audio
  const handleUnlockAudio = () => {
    audioEngine.unlockAudio();
    realMemeAudio.unlock();
    setAudioUnlocked(true);
    // Play greeting Vine Boom (max 1s, zero overlap)
    realMemeAudio.play('/sounds/vine_boom.wav', undefined, 0.85, 'vine_boom');
  };

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

  // Execute Move locally or send to multiplayer
  const executeMove = useCallback(
    (from: string, to: string, promotion: PieceType = 'q') => {
      if (game.isGameOver()) return;

      const evalBefore = evaluateBoard(game);
      const pieceOnSource = game.get(from as Square);
      const targetPiece = game.get(to as Square);
      const isEnPassant =
        pieceOnSource?.type === 'p' &&
        from[0] !== to[0] &&
        !targetPiece;

      // Online Multiplayer Route
      if (gameMode === 'pvp_online') {
        multiplayerClient.makeMove(from, to, promotion, 0);
        return;
      }

      // Local / AI Route
      try {
        const moveResult = game.move({
          from,
          to,
          promotion,
        });

        if (!moveResult) return;

        // Apply clock increment
        if (selectedTimeControl.incrementSeconds > 0) {
          const incMs = selectedTimeControl.incrementSeconds * 1000;
          setClocks((prev) => ({
            ...prev,
            [moveResult.color]: prev[moveResult.color] + incMs,
          }));
        }

        // Start clock on first move
        if (!isClockRunning && selectedTimeControl.initialSeconds > 0) {
          setIsClockRunning(true);
        }

        const evalAfter = evaluateBoard(game);
        setCurrentEval(evalAfter);

        // Classify move
        const { classification, swing } = classifyMove(
          evalBefore,
          evalAfter,
          moveResult.color,
          game.isCheckmate(),
          Boolean(moveResult.captured),
          game.inCheck()
        );

        // Update captured pieces
        if (moveResult.captured) {
          if (moveResult.color === 'w') {
            setCapturedBlack((prev) => [...prev, moveResult.captured as PieceType]);
          } else {
            setCapturedWhite((prev) => [...prev, moveResult.captured as PieceType]);
          }
        }

        // Record move
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

        // Trigger Audio Reaction Engine
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

        // Check game over
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

        // Trigger AI reply if in VS AI mode
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
    [
      game,
      gameMode,
      selectedTimeControl,
      isClockRunning,
      playerColor,
      aiDifficulty,
      recordedMoves.length,
    ]
  );

  // New Game Reset
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

    if (gameMode === 'pvp_online') {
      multiplayerClient.joinQueue();
    }
  };

  // Switch Mode
  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'pvp_online') {
      multiplayerClient.connect();
    }
    startNewGame();
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.updateSettings({ muted: nextMuted });
  };

  // Share invite link
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
      (gameMode === 'pvp_online' &&
        mpRoomState?.status === 'in_progress' &&
        mpRoomState.turn === playerColor));

  // Determine top/bottom player details
  const isPlayerWhite = orientation === 'w';
  const topColor: PieceColor = isPlayerWhite ? 'b' : 'w';
  const bottomColor: PieceColor = isPlayerWhite ? 'w' : 'b';

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      <MemeOverlay />

      {/* Top Bar Contract (Single text brand, 4-6 links, 1-2 actions) */}
      <Header
        currentMode={gameMode}
        onSelectMode={handleSelectMode}
        onOpenAudioSettings={() => setIsAudioSettingsOpen(true)}
        onOpenDebugBench={() => setIsDebugBenchOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onStartNewGame={startNewGame}
      />

      {/* Audio Autoplay Unlock Prompt Banner (First Launch) */}
      {!audioUnlocked && (
        <div className="w-full bg-gradient-to-r from-rose-950/90 via-purple-950/90 to-slate-950/90 border-b border-rose-500/30 px-4 py-2.5 flex items-center justify-between text-xs animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-rose-400 animate-pulse" />
            <span className="font-semibold text-rose-100">
              MyInstants Meme Soundboard Active: Exact sounds from myinstants.com (Vine Boom, Bruh, Emotional Damage, Metal Pipe, SpongeBob Fail & more) • Strictly max 1s & 0 overlap!
            </span>
          </div>
          <button
            onClick={handleUnlockAudio}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-transform active:scale-95 shadow-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>Enable MyInstants Audio 🔊</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Chessboard & HUD (Columns 1-8 on desktop) */}
        <div className="lg:col-span-8 flex flex-col items-center gap-3">
          {/* Top Player HUD */}
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

          {/* Central Chessboard Container with Side Evaluation Bar */}
          <div className="relative flex items-center justify-center gap-3 w-full">
            {/* Visual Centipawn Eval Bar */}
            <div className="hidden sm:flex flex-col w-3 h-[420px] bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner relative">
              <div
                className="w-full bg-white transition-all duration-300 rounded-b-none"
                style={{
                  height: `${Math.min(96, Math.max(4, 50 + currentEval * 5))}%`,
                }}
              />
              <span className="absolute bottom-1 w-full text-center text-[9px] font-mono font-bold text-slate-400">
                {currentEval > 0 ? `+${currentEval}` : currentEval}
              </span>
            </div>

            {/* Chessboard */}
            <ChessBoard
              game={game}
              orientation={orientation}
              isInteractive={isInteractive}
              lastMove={lastMove}
              onMakeMove={(from, to, promo) => executeMove(from, to, promo)}
              onRequestPromotion={(from, to) => setPromotionPending({ from, to })}
            />
          </div>

          {/* Bottom Player HUD */}
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

          {/* Game Controls Toolbar */}
          <div className="flex items-center gap-2 w-full max-w-[560px] justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Flip Board</span>
              </button>

              {gameMode === 'pvp_online' && mpRoomState?.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => multiplayerClient.resign()}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5 text-rose-500" />
                    <span>Resign</span>
                  </button>
                  <button
                    onClick={() => multiplayerClient.offerDraw()}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Handshake className="w-3.5 h-3.5 text-amber-400" />
                    <span>Draw</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {recordedMoves.length > 0 && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-rose-400 font-bold border border-slate-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Highlight Reel 🎬</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Mode Controls, Quick Match / Room Manager & Chat (Columns 9-12) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Mode Selector Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Mode & Matchmaking
              </span>
              <span className="text-xs font-semibold text-rose-400 capitalize">
                {gameMode.replace('_', ' ')}
              </span>
            </div>

            {/* PVP Online Controls */}
            {gameMode === 'pvp_online' && (
              <div className="space-y-3">
                <button
                  onClick={() => multiplayerClient.joinQueue()}
                  disabled={isQueuing}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md cursor-pointer"
                >
                  <Swords className="w-4 h-4" />
                  <span>{isQueuing ? 'Searching for Opponent...' : 'Quick Match (Instant 5m Blitz)'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => multiplayerClient.createRoom(300, 3)}
                    className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-colors"
                  >
                    Create Private Room
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Room Code"
                      value={privateRoomCodeInput}
                      onChange={(e) => setPrivateRoomCodeInput(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs font-mono uppercase text-center focus:outline-none focus:border-rose-500"
                    />
                    <button
                      onClick={() => multiplayerClient.joinRoom(privateRoomCodeInput)}
                      disabled={!privateRoomCodeInput.trim()}
                      className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-slate-200"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Active Room Code & Share */}
                {mpRoomState?.roomId && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-slate-500">Room:</span>{' '}
                      <span className="text-cyan-400 font-bold">{mpRoomState.roomId}</span>
                    </div>
                    <button
                      onClick={copyInviteLink}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied Link!' : 'Invite Friend'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VS AI Controls */}
            {gameMode === 'vs_ai' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Select Bot Persona & Elo:
                </label>
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {AI_DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setAiDifficulty(d.id);
                        startNewGame();
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                        aiDifficulty === d.id
                          ? 'bg-rose-500/15 border-rose-500 text-white'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-200">{d.name}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                          {d.description}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {d.elo}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time Controls */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                Time Control:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
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
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
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

          {/* Chat & Quick Reaction Panel */}
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

      {/* Promotion Choice Modal */}
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

      {/* Game Over Announcement Modal */}
      {gameOverReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <h3 className="text-2xl font-black text-white font-['Outfit']">
              {gameOverReason}
            </h3>
            <p className="text-xs text-slate-400">
              The game has concluded. Would you like to review the moves or play again?
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setGameOverReason(null);
                  startNewGame();
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                Play Another Game ⚔️
              </button>

              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
              >
                Review Game & Memes 🎬
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
      />

      {/* Debug Audio Soundboard & Event Inspector Modal */}
      <DebugAudioPanel
        isOpen={isDebugBenchOpen}
        onClose={() => setIsDebugBenchOpen(false)}
      />

      {/* Game Review & Brainrot Highlight Reel Modal */}
      <GameReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        moves={recordedMoves}
      />
    </div>
  );
}
