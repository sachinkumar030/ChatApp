// components/Chat/Sidebar.js - Left sidebar with conversations list
import React, { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../hooks/useTheme';
import Avatar from '../UI/Avatar';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { conversations, allUsers, activeChat, setActiveChat, fetchConversations, fetchAllUsers, unreadCounts } = useChat();
  const { isUserOnline } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchAllUsers();
  }, [fetchConversations, fetchAllUsers]);

  // Search users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = allUsers.filter(u =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(filtered);
  }, [searchQuery, allUsers]);

  const displayList = searchQuery ? searchResults : (showAllUsers ? allUsers : conversations);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">ChatWave</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Toggle theme"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          {/* New Chat */}
          <button
            onClick={() => setShowAllUsers(!showAllUsers)}
            className={`p-2 rounded-lg transition ${showAllUsers ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title="New chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Current user */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <Avatar user={user} size="sm" showStatus isOnline />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{user?.username}</p>
          <p className="text-xs text-emerald-500">Active now</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search people..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 border-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              ×
            </button>
          )}
        </div>
      </div>

      {/* List label */}
      <div className="px-4 py-1.5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {searchQuery ? 'Results' : showAllUsers ? 'All People' : 'Messages'}
        </span>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 px-4 text-center">
            <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <p className="text-sm">{searchQuery ? 'No users found' : 'No conversations yet'}</p>
            {!searchQuery && <p className="text-xs mt-1">Click + to start chatting</p>}
          </div>
        ) : (
          displayList.map(chatUser => {
            const isActive = activeChat?._id === chatUser._id;
            const isOnline = isUserOnline(chatUser._id);
            const unread = unreadCounts[chatUser._id] || 0;
            const lastMsg = chatUser.lastMessage;

            return (
              <button
                key={chatUser._id}
                onClick={() => setActiveChat(chatUser)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 border-r-2 border-brand-500' : ''}`}
              >
                <Avatar user={chatUser} size="md" showStatus isOnline={isOnline} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold truncate ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-900 dark:text-white'}`}>
                      {chatUser.username}
                    </span>
                    {lastMsg && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                        {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {lastMsg
                        ? lastMsg.type === 'image' ? '📷 Photo'
                          : lastMsg.type === 'file' ? '📎 File'
                          : lastMsg.content
                        : isOnline ? 'Online' : 'Tap to chat'}
                    </p>
                    {unread > 0 && (
                      <span className="ml-2 flex-shrink-0 bg-brand-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
