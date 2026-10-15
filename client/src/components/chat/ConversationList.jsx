import React from 'react';
import { Link } from 'react-router-dom';
import AnonymousAvatar from './AnonymousAvatar';

const ConversationList = ({ conversations, currentId }) => {
  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        <div className="text-2xl mb-2">💬</div>
        No active conversations. Messages appear here when a claim is approved.
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full divide-y divide-slate-100">
      {conversations.map((c) => {
        const isSelected = c._id === currentId;
        const roleLabel = c.item.type === 'found' ? 'Claimant' : 'Finder';
        
        return (
          <Link
            key={c._id}
            to={`/messages/${c._id}`}
            className={`flex items-start p-3.5 sm:p-4 hover:bg-slate-50 transition-all ${
              isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
            }`}
          >
            <div className="relative shrink-0">
              <AnonymousAvatar role={roleLabel} />
              {c.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-600 border-2 border-white rounded-full animate-pulse" />
              )}
            </div>

            <div className="ml-3 flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <p className={`text-xs sm:text-sm truncate ${isSelected ? 'font-black text-indigo-950' : 'font-bold text-slate-900'}`}>
                  {c.item.title}
                </p>
                <span className="text-[10px] text-slate-400 shrink-0 ml-1.5">
                  {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {roleLabel}
                </span>
                {c.item.status === 'resolved' && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Returned
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <p className={`text-xs truncate ${c.unreadCount > 0 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                  {c.latestMessage ? c.latestMessage.content : 'Chat started'}
                </p>
                {c.unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-indigo-600 rounded-full">
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
