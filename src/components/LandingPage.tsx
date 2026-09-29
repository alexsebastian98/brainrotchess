/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  ArrowRight,
  Zap,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { multiplayerClient } from '../services/multiplayerClient';

interface LandingPageProps {
  onStartGame: (mode: 'pvp_online' | 'vs_ai') => void;
  onJoinRoom: (roomId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartGame,
  onJoinRoom,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [generatedRoomId, setGeneratedRoomId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [playerName, setPlayerName] = useState(
    multiplayerClient.getPlayerName()
  );

  const handleCreatePrivateRoom = () => {
    multiplayerClient.setPlayerName(playerName);
    multiplayerClient.connect().then(() => {
      multiplayerClient.createRoom(300, 3);
      // Room ID will be set when we receive the room_created event
      setTimeout(() => {
        onStartGame('pvp_online');
      }, 500);
    });
  };

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      multiplayerClient.setPlayerName(playerName);
      multiplayerClient.connect().then(() => {
        onJoinRoom(roomCode.toUpperCase());
      });
    }
  };

  const copyInviteLink = () => {
    if (generatedRoomId) {
      const url = `${window.location.origin}?room=${generatedRoomId}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0f17] via-slate-900 to-[#1a1f2e] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 sm:px-8 py-4 border-b border-slate-800/50 bg-slate-950/60 backdrop-blur-md">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Outfit']">
          Brainrot Chess
        </h1>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-400" />
          <span className="text-xs font-semibold text-rose-300">
            Multiplayer Meme Chaos
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black mb-4 text-white font-['Outfit']">
            Chess meets
            <br />
            <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500 bg-clip-text text-transparent">
              Meme Madness
            </span>
          </h2>
          <p className="text-slate-300 text-lg max-w-xl mx-auto mb-8">
            Play competitive chess with friends. Every move triggers chaotic
            meme audio reactions, blunder alarms, and live evaluation roasting.
          </p>
        </div>

        {/* Player Name Setup */}
        <div className="mb-8 w-full max-w-md">
          <label className="block text-xs font-bold text-slate-300 mb-2">
            Your Player Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Two Column Layout for Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
          {/* Create Private Room Card */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 shadow-xl hover:border-rose-500/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-600/20 rounded-lg">
                <Users className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Private Room</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Create a room and share the link with your friend. They join
              instantly.
            </p>
            <button
              onClick={handleCreatePrivateRoom}
              className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Create & Share Room
            </button>
          </div>

          {/* Join with Code Card */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 shadow-xl hover:border-cyan-500/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-cyan-600/20 rounded-lg">
                <ArrowRight className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Join with Code</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Friend sent you a room code? Paste it here to join instantly.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC123"
                className="flex-1 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                onClick={handleJoinRoom}
                disabled={!roomCode.trim()}
                className="px-3 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-8" />

        {/* AI Option */}
        <div className="w-full max-w-2xl">
          <p className="text-xs font-semibold text-slate-400 text-center mb-4">
            OR PRACTICE AGAINST AI
          </p>
          <button
            onClick={() => onStartGame('vs_ai')}
            className="w-full py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Play vs AI Bot
          </button>
        </div>

        {/* Features List */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <div className="text-center p-4">
            <Users className="w-6 h-6 text-rose-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Real-Time</p>
            <p className="text-xs text-slate-400">WebSocket Multiplayer</p>
          </div>
          <div className="text-center p-4">
            <Volume2 className="w-6 h-6 text-rose-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Meme Audio</p>
            <p className="text-xs text-slate-400">1000+ Sound Reactions</p>
          </div>
          <div className="text-center p-4">
            <Sparkles className="w-6 h-6 text-rose-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Live Eval</p>
            <p className="text-xs text-slate-400">Engine Roasting</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/50 bg-slate-950/60 px-6 py-4 text-center">
        <p className="text-xs text-slate-500">
          Made for chaos. Powered by memes. Optimized for blunders. 💀
        </p>
      </footer>
    </div>
  );
};
