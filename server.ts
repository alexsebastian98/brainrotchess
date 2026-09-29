/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { Chess } from 'chess.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const app = express();
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Server-authoritative game room model
interface ServerPlayer {
  id: string;
  name: string;
  rating: number;
  color?: 'w' | 'b';
  ws: WebSocket | null;
  connected: boolean;
  disconnectedAt?: number;
}

interface ServerRoom {
  id: string;
  isPrivate: boolean;
  game: Chess;
  white: ServerPlayer | null;
  black: ServerPlayer | null;
  spectators: ServerPlayer[];
  status: string; // 'waiting' | 'in_progress' | 'checkmate' | 'stalemate' | 'draw' | 'resigned' | 'timeout'
  winner?: 'w' | 'b' | 'draw';
  timeControl: {
    initialSeconds: number;
    incrementSeconds: number;
  };
  clocks: {
    w: number; // ms remaining
    b: number; // ms remaining
    lastMoveTimestamp: number;
  };
  clockInterval?: NodeJS.Timeout;
  moves: any[];
  drawOfferFrom?: 'w' | 'b' | null;
  rematchRequestedBy?: string | null;
}

const rooms = new Map<string, ServerRoom>();
const matchmakingQueue: { player: ServerPlayer; timeControlName: string }[] = [];

// Helper to broadcast room state to all players and spectators
function broadcastRoom(room: ServerRoom, eventType = 'room_state', extraData: any = {}) {
  const payload = JSON.stringify({
    type: eventType,
    room: {
      roomId: room.id,
      isPrivate: room.isPrivate,
      fen: room.game.fen(),
      pgn: room.game.pgn(),
      turn: room.game.turn(),
      status: room.status,
      winner: room.winner,
      whitePlayer: room.white ? { id: room.white.id, name: room.white.name, rating: room.white.rating, color: 'w', connected: room.white.connected } : null,
      blackPlayer: room.black ? { id: room.black.id, name: room.black.name, rating: room.black.rating, color: 'b', connected: room.black.connected } : null,
      spectators: room.spectators.map(s => ({ id: s.id, name: s.name, rating: s.rating, connected: s.connected })),
      timeControl: room.timeControl,
      clocks: {
        w: room.clocks.w,
        b: room.clocks.b,
        lastMoveTime: room.clocks.lastMoveTimestamp
      },
      moves: room.moves,
      drawOfferFrom: room.drawOfferFrom,
      rematchRequestedBy: room.rematchRequestedBy
    },
    ...extraData
  });

  const sendSafe = (p: ServerPlayer | null) => {
    if (p && p.ws && p.ws.readyState === WebSocket.OPEN) {
      try { p.ws.send(payload); } catch {}
    }
  };

  sendSafe(room.white);
  sendSafe(room.black);
  room.spectators.forEach(sendSafe);
}

// Clock management
function startRoomTimer(room: ServerRoom) {
  if (room.clockInterval) clearInterval(room.clockInterval);
  if (room.timeControl.initialSeconds <= 0) return; // Unlimited

  room.clocks.lastMoveTimestamp = Date.now();

  room.clockInterval = setInterval(() => {
    if (room.status !== 'in_progress') {
      if (room.clockInterval) clearInterval(room.clockInterval);
      return;
    }

    const now = Date.now();
    const elapsed = now - room.clocks.lastMoveTimestamp;
    room.clocks.lastMoveTimestamp = now;

    const turn = room.game.turn();
    if (turn === 'w') {
      room.clocks.w = Math.max(0, room.clocks.w - elapsed);
      if (room.clocks.w <= 0) {
        room.status = 'timeout';
        room.winner = 'b';
        clearInterval(room.clockInterval);
        broadcastRoom(room, 'game_over', { reason: 'White ran out of time!' });
      }
    } else {
      room.clocks.b = Math.max(0, room.clocks.b - elapsed);
      if (room.clocks.b <= 0) {
        room.status = 'timeout';
        room.winner = 'w';
        clearInterval(room.clockInterval);
        broadcastRoom(room, 'game_over', { reason: 'Black ran out of time!' });
      }
    }
  }, 1000);
}

// WebSocket Connection Handler
wss.on('connection', (ws: WebSocket) => {
  let boundPlayerId: string | null = null;
  let boundRoomId: string | null = null;

  ws.on('message', (messageRaw: string) => {
    try {
      const data = JSON.parse(messageRaw);
      const { type } = data;

      // 1. MATCHMAKING QUEUE
      if (type === 'join_queue') {
        const player: ServerPlayer = {
          id: data.playerId,
          name: data.name || 'Anonymous Blunderer',
          rating: data.rating || 1200,
          ws,
          connected: true
        };
        boundPlayerId = player.id;

        // Check if there is another player waiting
        const waitingIdx = matchmakingQueue.findIndex(q => q.player.id !== player.id);
        if (waitingIdx !== -1) {
          const matched = matchmakingQueue.splice(waitingIdx, 1)[0].player;
          const roomId = 'MATCH_' + Math.random().toString(36).substring(2, 8).toUpperCase();
          const game = new Chess();

          const isHostWhite = Math.random() < 0.5;
          const white = isHostWhite ? matched : player;
          const black = isHostWhite ? player : matched;
          white.color = 'w';
          black.color = 'b';

          const initialSecs = 300; // 5 min default blitz
          const newRoom: ServerRoom = {
            id: roomId,
            isPrivate: false,
            game,
            white,
            black,
            spectators: [],
            status: 'in_progress',
            timeControl: { initialSeconds: initialSecs, incrementSeconds: 3 },
            clocks: {
              w: initialSecs * 1000,
              b: initialSecs * 1000,
              lastMoveTimestamp: Date.now()
            },
            moves: []
          };

          rooms.set(roomId, newRoom);
          boundRoomId = roomId;
          startRoomTimer(newRoom);
          broadcastRoom(newRoom, 'match_found');
        } else {
          matchmakingQueue.push({ player, timeControlName: data.timeControlName || '5+3 Blitz' });
          ws.send(JSON.stringify({ type: 'queued', message: 'Waiting for an opponent...' }));
        }
      }

      // 2. CREATE PRIVATE ROOM
      if (type === 'create_room') {
        const roomId = (data.customCode || Math.random().toString(36).substring(2, 8)).toUpperCase();
        const initialSecs = data.initialSeconds ?? 300;
        const incSecs = data.incrementSeconds ?? 3;

        const player: ServerPlayer = {
          id: data.playerId,
          name: data.name || 'Room Host',
          rating: data.rating || 1200,
          color: 'w',
          ws,
          connected: true
        };
        boundPlayerId = player.id;
        boundRoomId = roomId;

        const room: ServerRoom = {
          id: roomId,
          isPrivate: true,
          game: new Chess(),
          white: player,
          black: null,
          spectators: [],
          status: 'waiting',
          timeControl: { initialSeconds: initialSecs, incrementSeconds: incSecs },
          clocks: {
            w: initialSecs * 1000,
            b: initialSecs * 1000,
            lastMoveTimestamp: Date.now()
          },
          moves: []
        };

        rooms.set(roomId, room);
        broadcastRoom(room, 'room_created');
      }

      // 3. JOIN PRIVATE ROOM
      if (type === 'join_room') {
        const roomId = (data.roomId || '').toUpperCase();
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found. Check the code!' }));
          return;
        }

        const player: ServerPlayer = {
          id: data.playerId,
          name: data.name || 'Opponent',
          rating: data.rating || 1200,
          ws,
          connected: true
        };
        boundPlayerId = player.id;
        boundRoomId = roomId;

        // Check if player is reconnecting
        if (room.white && room.white.id === player.id) {
          room.white.ws = ws;
          room.white.connected = true;
        } else if (room.black && room.black.id === player.id) {
          room.black.ws = ws;
          room.black.connected = true;
        } else if (!room.black) {
          // Join as Black player
          player.color = 'b';
          room.black = player;
          room.status = 'in_progress';
          startRoomTimer(room);
        } else {
          // Join as spectator
          room.spectators.push(player);
        }

        broadcastRoom(room, 'room_state');
      }

      // 4. AUTHORITATIVE MOVE
      if (type === 'make_move') {
        const room = boundRoomId ? rooms.get(boundRoomId) : null;
        if (!room || room.status !== 'in_progress') return;

        const turn = room.game.turn();
        const player = turn === 'w' ? room.white : room.black;

        // Validate player turn
        if (!player || player.id !== data.playerId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not your turn!' }));
          return;
        }

        try {
          const moveResult = room.game.move({
            from: data.from,
            to: data.to,
            promotion: data.promotion || 'q'
          });

          if (!moveResult) {
            ws.send(JSON.stringify({ type: 'error', message: 'Illegal move!' }));
            return;
          }

          // Apply clock increment
          if (room.timeControl.initialSeconds > 0) {
            const incMs = room.timeControl.incrementSeconds * 1000;
            if (turn === 'w') room.clocks.w += incMs;
            else room.clocks.b += incMs;
          }
          room.clocks.lastMoveTimestamp = Date.now();

          // Record move
          room.moves.push({
            san: moveResult.san,
            from: moveResult.from,
            to: moveResult.to,
            piece: moveResult.piece,
            color: moveResult.color,
            captured: moveResult.captured,
            promotion: moveResult.promotion,
            fenAfter: room.game.fen(),
            evalSwing: data.evalSwing || 0,
            timestamp: Date.now()
          });

          // Check game completion conditions
          if (room.game.isCheckmate()) {
            room.status = 'checkmate';
            room.winner = turn;
            if (room.clockInterval) clearInterval(room.clockInterval);
          } else if (room.game.isStalemate()) {
            room.status = 'stalemate';
            room.winner = 'draw';
            if (room.clockInterval) clearInterval(room.clockInterval);
          } else if (room.game.isDraw()) {
            room.status = 'draw';
            room.winner = 'draw';
            if (room.clockInterval) clearInterval(room.clockInterval);
          }

          broadcastRoom(room, 'move_made', {
            lastMove: moveResult,
            audioContext: {
              event: moveResult.captured ? 'capture' : 'move',
              piece: moveResult.piece,
              captured: moveResult.captured,
              isCheck: room.game.inCheck(),
              isCheckmate: room.game.isCheckmate(),
              san: moveResult.san,
              playerColor: turn,
              moveNumber: room.moves.length
            }
          });
        } catch (err: any) {
          ws.send(JSON.stringify({ type: 'error', message: err?.message || 'Move execution error' }));
        }
      }

      // 5. RESIGN
      if (type === 'resign') {
        const room = boundRoomId ? rooms.get(boundRoomId) : null;
        if (!room) return;
        const isWhite = room.white && room.white.id === data.playerId;
        const isBlack = room.black && room.black.id === data.playerId;
        if (!isWhite && !isBlack) return;

        room.status = 'resigned';
        room.winner = isWhite ? 'b' : 'w';
        if (room.clockInterval) clearInterval(room.clockInterval);
        broadcastRoom(room, 'game_over', { reason: `${isWhite ? 'White' : 'Black'} resigned 💀` });
      }

      // 6. DRAW OFFER / RESPONSE
      if (type === 'offer_draw') {
        const room = boundRoomId ? rooms.get(boundRoomId) : null;
        if (!room || room.status !== 'in_progress') return;
        const color = room.white?.id === data.playerId ? 'w' : 'b';
        room.drawOfferFrom = color;
        broadcastRoom(room, 'draw_offered');
      }

      if (type === 'respond_draw') {
        const room = boundRoomId ? rooms.get(boundRoomId) : null;
        if (!room) return;
        if (data.accept) {
          room.status = 'draw';
          room.winner = 'draw';
          if (room.clockInterval) clearInterval(room.clockInterval);
          broadcastRoom(room, 'game_over', { reason: 'Draw agreed by mutual consent' });
        } else {
          room.drawOfferFrom = null;
          broadcastRoom(room, 'draw_declined');
        }
      }

      // 7. QUICK REACTION & CHAT
      if (type === 'send_reaction' || type === 'send_chat') {
        const room = boundRoomId ? rooms.get(boundRoomId) : null;
        if (room) {
          broadcastRoom(room, type === 'send_reaction' ? 'reaction_broadcast' : 'chat_broadcast', {
            senderId: data.playerId,
            senderName: data.name || 'Player',
            content: data.content
          });
        }
      }

      // 8. REMATCH
      if (type === 'request_rematch') {
        const room = boundRoomId ? rooms.get(boundRoomId) : null;
        if (!room) return;
        if (!room.rematchRequestedBy) {
          room.rematchRequestedBy = data.playerId;
          broadcastRoom(room, 'rematch_requested', { fromId: data.playerId });
        } else if (room.rematchRequestedBy !== data.playerId) {
          // Both accepted! Reset game with swapped colors
          room.rematchRequestedBy = null;
          const prevWhite = room.white;
          room.white = room.black;
          room.black = prevWhite;
          if (room.white) room.white.color = 'w';
          if (room.black) room.black.color = 'b';

          room.game = new Chess();
          room.status = 'in_progress';
          room.winner = undefined;
          room.moves = [];
          const initMs = room.timeControl.initialSeconds * 1000;
          room.clocks = { w: initMs, b: initMs, lastMoveTimestamp: Date.now() };
          startRoomTimer(room);
          broadcastRoom(room, 'rematch_started');
        }
      }
    } catch (e) {
      console.error('WebSocket message parsing error:', e);
    }
  });

  ws.on('close', () => {
    // Handle disconnect with grace period
    if (boundRoomId) {
      const room = rooms.get(boundRoomId);
      if (room) {
        if (room.white && room.white.id === boundPlayerId) {
          room.white.connected = false;
          room.white.disconnectedAt = Date.now();
        }
        if (room.black && room.black.id === boundPlayerId) {
          room.black.connected = false;
          room.black.disconnectedAt = Date.now();
        }
        broadcastRoom(room, 'player_disconnected', { playerId: boundPlayerId });
      }
    }

    // Remove from queue if waiting
    const qIdx = matchmakingQueue.findIndex(q => q.player.id === boundPlayerId);
    if (qIdx !== -1) matchmakingQueue.splice(qIdx, 1);
  });
});

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    queuedPlayers: matchmakingQueue.length
  });
});

// Production vs Development Setup
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gen-Z Brainrot Chess] Running on port ${PORT}`);
  });
}

startServer();
