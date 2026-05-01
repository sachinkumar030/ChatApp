// hooks/useTyping.js - Debounced typing indicator
import { useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export function useTyping(receiverId) {
  const { socket } = useSocket();
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const startTyping = useCallback(() => {
    if (!socket || !receiverId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', { receiverId });
    }

    // Reset the stop-typing timer
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing:stop', { receiverId });
    }, 1500);
  }, [socket, receiverId]);

  const stopTyping = useCallback(() => {
    if (!socket || !receiverId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing:stop', { receiverId });
    }
  }, [socket, receiverId]);

  return { startTyping, stopTyping };
}
