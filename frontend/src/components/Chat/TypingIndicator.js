// components/Chat/TypingIndicator.js
import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-2 animate-fade-in">
      <div className="w-7 flex-shrink-0" />
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1 h-4">
          {[0, 0.2, 0.4].map((delay, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce-dot"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
