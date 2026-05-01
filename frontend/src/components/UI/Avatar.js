// components/UI/Avatar.js
import React from 'react';

// Deterministic color from username
const COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
];

function getColor(username = '') {
  const idx = username.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}

export default function Avatar({ user, size = 'md', showStatus = false, isOnline = false }) {
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const dotSizes = {
    xs: 'w-2 h-2 border',
    sm: 'w-2 h-2 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
  };

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();
  const colorClass = getColor(user?.username);

  return (
    <div className="relative flex-shrink-0">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.username}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`${sizes[size]} ${colorClass} rounded-full flex items-center justify-center font-semibold text-white`}>
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-white dark:border-gray-900 ${isOnline ? 'bg-emerald-400' : 'bg-gray-400'}`}
        />
      )}
    </div>
  );
}
