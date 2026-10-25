import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/voice';
import { Bot, User, Volume2 } from 'lucide-react';

interface ConversationFeedProps {
  messages: ChatMessage[];
}

export const ConversationFeed: React.FC<ConversationFeedProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-2 select-none px-6 text-center">
        <Volume2 className="w-8 h-8 text-slate-600 mb-1" />
        <p className="font-medium text-slate-400">Speak into your microphone to start talking</p>
        <p className="text-xs text-slate-500">
          Powered by GLM-4-Voice on Google Colab A100/L4 via vspagent MCP
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 p-4 overflow-y-auto max-h-full">
      {messages.map((msg) => {
        const isUser = msg.sender === 'user';
        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fadeIn`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs shadow-md ${
                isUser
                  ? 'bg-vibe-green text-black font-bold'
                  : 'bg-purple-600 text-white font-bold'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg ${
                isUser
                  ? 'bg-vibe-surface border border-vibe-green/30 text-slate-100 rounded-tr-none'
                  : 'bg-slate-900/90 border border-purple-500/30 text-slate-100 rounded-tl-none'
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isUser ? 'You' : 'GLM-4-Voice'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
              </div>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.emotion && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-purple-300 font-mono">
                  <span>Emotion:</span>
                  <span className="bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-400/30">
                    {msg.emotion}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
