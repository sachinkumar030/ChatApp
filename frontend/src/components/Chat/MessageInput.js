// components/Chat/MessageInput.js - Message composition area
import React, { useState, useRef, useCallback } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useTyping } from '../../hooks/useTyping';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function MessageInput() {
  const { activeChat, sendMessage } = useChat();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { startTyping, stopTyping } = useTyping(activeChat?._id);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeChat) return;

    sendMessage(activeChat._id, trimmed, 'text');
    setText('');
    stopTyping();
    setShowEmoji(false);
    textareaRef.current?.focus();
  }, [text, activeChat, sendMessage, stopTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    startTyping();
  };

  const handleEmojiClick = (emojiData) => {
    const cursor = textareaRef.current?.selectionStart ?? text.length;
    const newText = text.slice(0, cursor) + emojiData.emoji + text.slice(cursor);
    setText(newText);
    setShowEmoji(false);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursor + 2, cursor + 2);
    }, 10);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      sendMessage(activeChat._id, data.fileName || file.name, data.type, data.fileUrl);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (!activeChat) return null;

  return (
    <div className="relative">
      {/* Emoji picker */}
      {showEmoji && (
        <div className="absolute bottom-full right-0 mb-2 z-50 shadow-xl rounded-2xl overflow-hidden">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
            width={320}
            height={380}
          />
        </div>
      )}

      <div className="flex items-end gap-2 p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-xl transition flex-shrink-0"
          title="Attach file"
        >
          {uploading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            placeholder="Type a message…"
            rows={1}
            className="w-full resize-none px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm max-h-32 scrollbar-hide"
            style={{ overflowY: text.split('\n').length > 3 ? 'auto' : 'hidden' }}
          />
        </div>

        {/* Emoji */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={`p-2 rounded-xl transition flex-shrink-0 ${showEmoji ? 'bg-brand-100 text-brand-500 dark:bg-brand-900/30' : 'text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20'}`}
          title="Emoji"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Send */}
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition flex-shrink-0 shadow-md shadow-brand-200/50 dark:shadow-none"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
