// components/Chat/ChatWindow.js - Main chat area
import React, { useEffect, useRef, useCallback } from 'react';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../UI/Avatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

function DateDivider({ date }) {
  let label;
  const d = new Date(date);
  if (isToday(d)) label = 'Today';
  else if (isYesterday(d)) label = 'Yesterday';
  else label = format(d, 'MMMM d, yyyy');

  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
      <span className="text-xs text-gray-400 font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-24 h-24 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-4">
        <svg className="w-12 h-12 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a conversation</h3>
      <p className="text-sm text-gray-400 max-w-xs">Choose someone from the sidebar to start chatting in real-time</p>
    </div>
  );
}

export default function ChatWindow() {
  const { activeChat, messages, typingUsers, loadingMessages } = useChat();
  const { isUserOnline } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const chatMessages = activeChat ? (messages[activeChat._id] || []) : [];
  const isTyping = activeChat ? typingUsers[activeChat._id] : false;
  const isOnline = activeChat ? isUserOnline(activeChat._id) : false;

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom(chatMessages.length <= 1 ? 'instant' : 'smooth');
  }, [chatMessages.length, isTyping]);

  if (!activeChat) {
    return (
      <div className="flex-1 bg-gray-50 dark:bg-gray-950">
        <EmptyState />
      </div>
    );
  }

  // Group messages by date
  let lastDate = null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <Avatar user={activeChat} size="md" showStatus isOnline={isOnline} />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 dark:text-white truncate">{activeChat.username}</h2>
          <p className={`text-xs ${isTyping ? 'text-brand-500 animate-pulse' : isOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
            {isTyping ? 'typing…' : isOnline ? 'Online' : activeChat.lastSeen
              ? `Last seen ${formatDistanceToNow(new Date(activeChat.lastSeen), { addSuffix: true })}`
              : 'Offline'}
          </p>
        </div>
        {/* Chat actions */}
        <div className="flex items-center gap-1">
          <button className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition" title="Search in chat">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        ) : chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Avatar user={activeChat} size="xl" />
            <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{activeChat.username}</h3>
            {activeChat.bio && <p className="text-sm text-gray-400 mt-1">{activeChat.bio}</p>}
            <p className="text-sm text-gray-400 mt-4 bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-sm">
              👋 Say hello to start the conversation!
            </p>
          </div>
        ) : (
          chatMessages.map((msg, idx) => {
            const msgDate = new Date(msg.createdAt).toDateString();
            const showDivider = msgDate !== lastDate;
            lastDate = msgDate;
            const prevMsg = chatMessages[idx - 1];
            const showAvatar = !prevMsg || prevMsg.sender._id !== msg.sender._id;

            return (
              <React.Fragment key={msg._id}>
                {showDivider && <DateDivider date={msg.createdAt} />}
                <MessageBubble
                  message={msg}
                  showAvatar={showAvatar}
                  prevSenderId={prevMsg?.sender._id}
                />
              </React.Fragment>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput />
    </div>
  );
}
