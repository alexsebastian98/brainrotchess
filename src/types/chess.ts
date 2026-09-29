/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type GameMode = 'pvp_online' | 'pvp_local' | 'vs_ai' | 'sandbox';

export type TimeControl = {
  name: string;
  initialSeconds: number;
  incrementSeconds: number;
};

export const TIME_CONTROLS: TimeControl[] = [
  { name: '1 min Bullet', initialSeconds: 60, incrementSeconds: 0 },
  { name: '3+2 Blitz', initialSeconds: 180, incrementSeconds: 2 },
  { name: '5+3 Blitz', initialSeconds: 300, incrementSeconds: 3 },
  { name: '10 min Rapid', initialSeconds: 600, incrementSeconds: 0 },
  { name: 'Unlimited', initialSeconds: 0, incrementSeconds: 0 },
];

export type AIDifficulty =
  | 'beginner'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'expert'
  | 'master'
  | 'stockfish';

export interface AIDifficultyConfig {
  id: AIDifficulty;
  name: string;
  elo: number;
  depth: number;
  blunderRate: number; // 0 to 1
  description: string;
  avatarSeed: string;
}

export const AI_DIFFICULTIES: AIDifficultyConfig[] = [
  {
    id: 'beginner',
    name: 'Skibidi Noob',
    elo: 600,
    depth: 1,
    blunderRate: 0.45,
    description: 'Blunders constantly, forgets how the horsey moves.',
    avatarSeed: 'noob',
  },
  {
    id: 'easy',
    name: 'Casual Blunderer',
    elo: 1000,
    depth: 2,
    blunderRate: 0.28,
    description: 'Plays basic opening moves then gives away free pawns.',
    avatarSeed: 'easy',
  },
  {
    id: 'medium',
    name: 'Mid Tactician',
    elo: 1350,
    depth: 3,
    blunderRate: 0.12,
    description: 'Spots obvious 1-move forks and pins.',
    avatarSeed: 'mid',
  },
  {
    id: 'hard',
    name: 'TikTok Grandmaster',
    elo: 1700,
    depth: 4,
    blunderRate: 0.05,
    description: 'Calculates 3-4 moves ahead, solid positional sense.',
    avatarSeed: 'hard',
  },
  {
    id: 'expert',
    name: 'GigaChad Knight',
    elo: 2000,
    depth: 5,
    blunderRate: 0.01,
    description: 'Rarely blunders. Hunts your queen relentlessly.',
    avatarSeed: 'gigachad',
  },
  {
    id: 'master',
    name: 'Brainrot Final Boss',
    elo: 2350,
    depth: 6,
    blunderRate: 0.0,
    description: 'Ruthless opening theory and tactical calculation.',
    avatarSeed: 'boss',
  },
  {
    id: 'stockfish',
    name: 'Maximum Engine',
    elo: 2700,
    depth: 7,
    blunderRate: 0.0,
    description: 'Near-flawless minimax search with alpha-beta pruning.',
    avatarSeed: 'max',
  },
];

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'catastrophic_blunder'
  | 'forced';

export interface RecordedMove {
  san: string;
  from: string;
  to: string;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  flags: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: number;
  evalAfter: number;
  evalSwing: number;
  classification: MoveClassification;
  timeSpentMs?: number;
  audioEventId?: string;
  timestamp: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  rating: number;
  isHost?: boolean;
  color?: PieceColor;
  avatarUrl?: string;
  connected: boolean;
}

export type GameStatus =
  | 'waiting'
  | 'in_progress'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'draw_repetition'
  | 'draw_fifty_moves'
  | 'draw_insufficient_material'
  | 'draw_agreement'
  | 'resigned'
  | 'timeout'
  | 'abandoned';

export interface GameRoomState {
  roomId: string;
  isPrivate: boolean;
  fen: string;
  pgn: string;
  turn: PieceColor;
  status: GameStatus;
  winner?: PieceColor | 'draw';
  whitePlayer: PlayerInfo | null;
  blackPlayer: PlayerInfo | null;
  spectators: PlayerInfo[];
  timeControl: TimeControl;
  clocks: {
    w: number; // remaining ms
    b: number; // remaining ms
    lastMoveTime: number; // timestamp ms
  };
  moves: RecordedMove[];
  drawOfferFrom?: PieceColor | null;
  rematchRequestedBy?: string | null;
}
