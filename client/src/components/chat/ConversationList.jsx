import React from 'react';
import { Link } from 'react-router-dom';
import AnonymousAvatar from './AnonymousAvatar';

const ConversationList = ({ conversations, currentId }) => {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 text-sm">
        No active conversations yet. Conversations appear here when a claim is approved.
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full divide-y divide-gray-100">
      {conversations.map((c) => {
        const isSelected = c._id === currentId;
        const roleLabel = c.item.type === 'found' ? 'Claimant' : 'Finder'; // Simplified role display for list
        
        return (
          <Link
            key={c._id}
            to={`/messages/${c._id}`}
            className={`flex items-start p-4 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
          >
            <AnonymousAvatar role={roleLabel} />
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {c.item.title}
                </p>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                  {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : ''}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-1">
                {roleLabel}
              </p>
              <div className="flex justify-between items-center">
                <p className={`text-sm truncate ${c.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {c.latestMessage ? c.latestMessage.content : 'No messages yet'}
                </p>
                {c.unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default ConversationList;
