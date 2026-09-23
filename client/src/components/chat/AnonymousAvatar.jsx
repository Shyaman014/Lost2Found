import React from 'react';

const AnonymousAvatar = ({ role }) => {
  const isFinder = role === 'Finder';
  const bgColor = isFinder ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700';

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${bgColor}`}>
      {role.charAt(0)}
    </div>
  );
};

export default AnonymousAvatar;
