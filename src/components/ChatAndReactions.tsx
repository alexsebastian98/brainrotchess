/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { audioEngine } from '../audio/AudioEngine';

interface ChatMessage {
  id: string;
  senderName: string;
  content: string;
  isSystem?: boolean;
}

interface ChatAndReactionsProps {
  onSendReaction: (emoji: string) => void;
  onSendChat?: (message: string) => void;
  messages: ChatMessage[];
  playerName: string;
  isMultiplayer?: boolean;
}

const QUICK_EMOJIS = ['💀', '😭', '🔥', 'NAHH', 'BRO', 'W', 'L', '???'];

export const ChatAndReactions: React.FC<ChatAndReactionsProps> = ({
  onSendReaction,
  onSendChat,
  messages,
  playerName,
  isMultiplayer = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [lastTapTime, setLastTapTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleQuickReaction = (emoji: string) => {
    const now = Date.now();
    if (now - lastTapTime < 500) return; // Anti-spam 500ms
    setLastTapTime(now);

    // Trigger audio effect locally and broadcast
    audioEngine.triggerQuickReaction(emoji, playerName);
    onSendReaction(emoji);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !onSendChat) return;
    onSendChat(inputText.trim());
    setInputText('');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden h-full">
      {/* Quick Reactions Bar */}
      <div className="flex items-center gap-1.5 p-2 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-400 pl-1 shrink-0 flex items-center gap-1">
          <Smile className="w-3.5 h-3.5 text-rose-400" />
        </span>
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleQuickReaction(emoji)}
            className="px-2 py-1 text-xs font-semibold bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/50 border border-slate-700/80 rounded-lg transition-all active:scale-90 shrink-0 text-slate-200"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Messages Log */}
      <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-2 text-xs min-h-[140px] max-h-[220px]">
        {messages.length === 0 ? (
          <p className="text-slate-500 text-center italic py-4">No messages yet. Send a quick reaction!</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`leading-relaxed ${m.isSystem ? 'text-slate-400 italic' : 'text-slate-200'}`}>
              {!m.isSystem && (
                <span className="font-bold text-rose-400 mr-1.5">
                  {m.senderName}:
                </span>
              )}
              <span>{m.content}</span>
            </div>
          ))
        )}
      </div>

      {/* Text Chat Input (only enabled in multiplayer) */}
      {isMultiplayer && onSendChat && (
        <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 p-2 bg-slate-950/80 border-t border-slate-800">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message or trash talk..."
            maxLength={100}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
