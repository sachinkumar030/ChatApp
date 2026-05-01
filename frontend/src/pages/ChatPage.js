// pages/ChatPage.js - Main layout: sidebar + chat window
import React, { useState } from 'react';
import { ChatProvider } from '../context/ChatContext';
import Sidebar from '../components/Chat/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import { useChat } from '../context/ChatContext';

function ChatLayout() {
  const { activeChat, setActiveChat } = useChat();
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar - hidden on mobile when chat is active */}
      <div className={`
        flex-shrink-0 w-80 xl:w-96 border-r border-gray-200 dark:border-gray-800
        ${activeChat ? 'hidden md:flex md:flex-col' : 'flex flex-col w-full md:w-80 xl:w-96'}
      `}>
        <Sidebar />
      </div>

      {/* Chat window */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${!activeChat ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Mobile back button */}
        {activeChat && (
          <div className="md:hidden absolute top-3 left-2 z-20">
            <button
              onClick={() => setActiveChat(null)}
              className="p-2 bg-white dark:bg-gray-800 rounded-full shadow text-gray-600 dark:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
        <ChatWindow />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
}
