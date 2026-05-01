// components/Chat/MessageBubble.js - Individual message display
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function StatusIcon({ status }) {
  if (status === 'seen') {
    return <span className="text-brand-400" title="Seen">✓✓</span>;
  }
  if (status === 'delivered') {
    return <span className="text-gray-400" title="Delivered">✓✓</span>;
  }
  return <span className="text-gray-300" title="Sent">✓</span>;
}

export default function MessageBubble({ message, showAvatar, prevSenderId }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { activeChat } = useChat();
  const [showReactions, setShowReactions] = useState(false);

  const isMine = message.sender._id === user._id || message.sender === user._id;
  const senderName = message.sender?.username || 'Unknown';
  const time = format(new Date(message.createdAt), 'HH:mm');

  const handleReact = (emoji) => {
    if (!socket || !activeChat) return;
    socket.emit('message:react', {
      messageId: message._id,
      emoji,
      receiverId: activeChat._id,
    });
    setShowReactions(false);
  };

  // Group reactions by emoji
  const groupedReactions = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`flex items-end gap-2 mb-1 animate-slide-in group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar spacer */}
      <div className="w-7 flex-shrink-0">
        {/* Avatar can be added here if desired */}
      </div>

      <div className={`max-w-[75%] relative ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Reaction picker (hover) */}
        <div className={`absolute -top-8 ${isMine ? 'right-0' : 'left-0'} hidden group-hover:flex gap-1 bg-white dark:bg-gray-800 rounded-full shadow-lg px-2 py-1 border border-gray-100 dark:border-gray-700 z-10`}>
          {QUICK_REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="text-sm hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Bubble */}
        <div
          className={`relative px-4 py-2 rounded-2xl shadow-sm transition-all
            ${isMine
              ? 'bg-brand-500 text-white rounded-br-md'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-100 dark:border-gray-700'
            }
            ${message.isDeleted ? 'opacity-60 italic' : ''}
          `}
        >
          {/* Image message */}
          {message.type === 'image' && message.fileUrl && (
            <img
              src={message.fileUrl}
              alt="Shared"
              className="rounded-lg max-w-xs max-h-60 object-cover mb-1 cursor-pointer hover:opacity-90 transition"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
          )}

          {/* File message */}
          {message.type === 'file' && message.fileUrl && (
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-2 hover:opacity-80 transition ${isMine ? 'text-white' : 'text-brand-500'}`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm underline truncate max-w-xs">{message.fileName || 'File'}</span>
            </a>
          )}

          {/* Text content */}
          {message.content && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Time + status */}
          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isMine ? 'text-brand-200' : 'text-gray-400'}`}>{time}</span>
            {isMine && <span className="text-[10px]"><StatusIcon status={message.status} /></span>}
          </div>
        </div>

        {/* Reactions display */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={`flex gap-1 mt-1 flex-wrap ${isMine ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(groupedReactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="flex items-center gap-0.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2 py-0.5 shadow-sm hover:scale-105 transition-transform animate-pop"
              >
                <span>{emoji}</span>
                {count > 1 && <span className="text-gray-500 dark:text-gray-400">{count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
