// context/ChatContext.js - Chat state management
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

const initialState = {
  conversations: [],     // Users with chat history
  allUsers: [],          // All users (for new chats)
  activeChat: null,      // Currently selected user
  messages: {},          // { userId: [messages] }
  typingUsers: {},       // { userId: boolean }
  loadingMessages: false,
  unreadCounts: {},      // { userId: count }
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'SET_ALL_USERS':
      return { ...state, allUsers: action.payload };
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChat: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: { ...state.messages, [action.userId]: action.payload } };
    case 'ADD_MESSAGE': {
      const { userId, message } = action;
      const existing = state.messages[userId] || [];
      const isDuplicate = existing.some(m => m._id === message._id);
      if (isDuplicate) return state;
      return { ...state, messages: { ...state.messages, [userId]: [...existing, message] } };
    }
    case 'UPDATE_MESSAGE_STATUS': {
      const updated = {};
      Object.keys(state.messages).forEach(uid => {
        updated[uid] = state.messages[uid].map(m =>
          action.messageIds.includes(m._id) ? { ...m, status: action.status } : m
        );
      });
      return { ...state, messages: updated };
    }
    case 'UPDATE_REACTIONS': {
      const { messageId, reactions } = action;
      const updated = {};
      Object.keys(state.messages).forEach(uid => {
        updated[uid] = state.messages[uid].map(m =>
          m._id === messageId ? { ...m, reactions } : m
        );
      });
      return { ...state, messages: updated };
    }
    case 'SET_TYPING':
      return { ...state, typingUsers: { ...state.typingUsers, [action.userId]: action.isTyping } };
    case 'SET_LOADING_MESSAGES':
      return { ...state, loadingMessages: action.payload };
    case 'SET_UNREAD': {
      return { ...state, unreadCounts: { ...state.unreadCounts, [action.userId]: action.count } };
    }
    case 'CLEAR_UNREAD':
      return { ...state, unreadCounts: { ...state.unreadCounts, [action.userId]: 0 } };
    default:
      return state;
  }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket } = useSocket();
  const { user } = useAuth();

  // Fetch conversations sidebar
  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/users/conversations');
      dispatch({ type: 'SET_CONVERSATIONS', payload: data.users });
    } catch (err) {
      console.error('fetchConversations error:', err);
    }
  }, []);

  // Fetch all users
  const fetchAllUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/users');
      dispatch({ type: 'SET_ALL_USERS', payload: data.users });
    } catch (err) {
      console.error('fetchAllUsers error:', err);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (userId) => {
    dispatch({ type: 'SET_LOADING_MESSAGES', payload: true });
    try {
      const { data } = await api.get(`/messages/${userId}`);
      dispatch({ type: 'SET_MESSAGES', userId, payload: data.messages });
      dispatch({ type: 'CLEAR_UNREAD', userId });
    } catch (err) {
      console.error('fetchMessages error:', err);
    } finally {
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: false });
    }
  }, []);

  // Send message via socket
  const sendMessage = useCallback((receiverId, content, type = 'text', fileUrl = null) => {
    if (!socket) return;
    socket.emit('message:send', { receiverId, content, type, fileUrl });
  }, [socket]);

  // Select active chat
  const setActiveChat = useCallback((chatUser) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: chatUser });
    if (chatUser) fetchMessages(chatUser._id);
  }, [fetchMessages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !user) return;

    // Message sent confirmation (from server to sender)
    const onSent = (message) => {
      const otherId = message.receiver._id || message.receiver;
      dispatch({ type: 'ADD_MESSAGE', userId: otherId, message });
      fetchConversations();
    };

    // Incoming message from another user
    const onReceive = (message) => {
      const senderId = message.sender._id || message.sender;
      dispatch({ type: 'ADD_MESSAGE', userId: senderId, message });
      fetchConversations();

      // If not actively chatting with sender, increment unread
      dispatch(s => {
        if (s.activeChat?._id !== senderId) {
          return { type: 'SET_UNREAD', userId: senderId, count: (s.unreadCounts[senderId] || 0) + 1 };
        }
        // Mark as seen if in active chat
        socket.emit('message:seen', { senderId, messageIds: [message._id] });
        return s;
      });
    };

    const onStatus = ({ messageId, status }) => {
      dispatch({ type: 'UPDATE_MESSAGE_STATUS', messageIds: [messageId], status });
    };

    const onSeen = ({ messageIds }) => {
      dispatch({ type: 'UPDATE_MESSAGE_STATUS', messageIds, status: 'seen' });
    };

    const onTypingStart = ({ senderId }) => {
      dispatch({ type: 'SET_TYPING', userId: senderId, isTyping: true });
    };

    const onTypingStop = ({ senderId }) => {
      dispatch({ type: 'SET_TYPING', userId: senderId, isTyping: false });
    };

    const onReacted = ({ messageId, reactions }) => {
      dispatch({ type: 'UPDATE_REACTIONS', messageId, reactions });
    };

    socket.on('message:sent', onSent);
    socket.on('message:receive', onReceive);
    socket.on('message:status', onStatus);
    socket.on('message:seen', onSeen);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    socket.on('message:reacted', onReacted);

    return () => {
      socket.off('message:sent', onSent);
      socket.off('message:receive', onReceive);
      socket.off('message:status', onStatus);
      socket.off('message:seen', onSeen);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
      socket.off('message:reacted', onReacted);
    };
  }, [socket, user, fetchConversations]);

  return (
    <ChatContext.Provider value={{
      ...state,
      fetchConversations,
      fetchAllUsers,
      fetchMessages,
      sendMessage,
      setActiveChat,
      dispatch,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};
