/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameRoomState, PieceColor } from '../types/chess';

type RoomStateListener = (state: GameRoomState) => void;
type CustomEventListener = (type: string, data: any) => void;

class MultiplayerClientService {
  private ws: WebSocket | null = null;
  private roomListeners: Set<RoomStateListener> = new Set();
  private eventListeners: Set<CustomEventListener> = new Set();
  private playerId: string;
  private playerName: string = 'Grandmaster Sigma';
  private currentRoomId: string | null = null;
  private isConnecting: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    let savedId = localStorage.getItem('brainrot_chess_player_id');
    if (!savedId) {
      savedId = 'usr_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('brainrot_chess_player_id', savedId);
    }
    this.playerId = savedId;

    const savedName = localStorage.getItem('brainrot_chess_player_name');
    if (savedName) this.playerName = savedName;
  }

  public getPlayerId(): string {
    return this.playerId;
  }

  public getPlayerName(): string {
    return this.playerName;
  }

  public setPlayerName(name: string): void {
    this.playerName = name;
    localStorage.setItem('brainrot_chess_player_name', name);
  }

  public onRoomState(cb: RoomStateListener): () => void {
    this.roomListeners.add(cb);
    return () => this.roomListeners.delete(cb);
  }

  public onCustomEvent(cb: CustomEventListener): () => void {
    this.eventListeners.add(cb);
    return () => this.eventListeners.delete(cb);
  }

  public connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnecting = false;
          if (this.currentRoomId) {
            this.joinRoom(this.currentRoomId);
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.room) {
              this.currentRoomId = data.room.roomId;
              this.roomListeners.forEach((fn) => fn(data.room));
            }
            this.eventListeners.forEach((fn) => fn(data.type, data));
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          // Auto-reconnect after 2 seconds
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            if (this.currentRoomId) {
              this.connect();
            }
          }, 2000);
        };

        this.ws.onerror = (err) => {
          this.isConnecting = false;
          reject(err);
        };
      } catch (err) {
        this.isConnecting = false;
        reject(err);
      }
    });
  }

  private send(type: string, payload: Record<string, any> = {}) {
    const data = JSON.stringify({
      type,
      playerId: this.playerId,
      name: this.playerName,
      ...payload,
    });

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.connect().then(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(data);
        }
      });
    }
  }

  public joinQueue(timeControlName = '5+3 Blitz'): void {
    this.send('join_queue', { timeControlName });
  }

  public createRoom(initialSeconds = 300, incrementSeconds = 3, customCode?: string): void {
    this.send('create_room', { initialSeconds, incrementSeconds, customCode });
  }

  public joinRoom(roomId: string): void {
    this.currentRoomId = roomId;
    this.send('join_room', { roomId });
  }

  public makeMove(from: string, to: string, promotion = 'q', evalSwing = 0): void {
    this.send('make_move', { from, to, promotion, evalSwing });
  }

  public resign(): void {
    this.send('resign');
  }

  public offerDraw(): void {
    this.send('offer_draw');
  }

  public respondDraw(accept: boolean): void {
    this.send('respond_draw', { accept });
  }

  public sendReaction(emoji: string): void {
    this.send('send_reaction', { content: emoji });
  }

  public sendChat(message: string): void {
    this.send('send_chat', { content: message });
  }

  public requestRematch(): void {
    this.send('request_rematch');
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.currentRoomId = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const multiplayerClient = new MultiplayerClientService();
