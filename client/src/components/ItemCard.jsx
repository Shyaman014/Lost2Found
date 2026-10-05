import React from 'react';
import { Link } from 'react-router-dom';
import { getPlaceholderImage } from '../utils/placeholders';

const ItemCard = ({ item }) => {
  const isLost = item.type === 'lost';
  const badgeColor = isLost 
    ? 'bg-rose-500/90 text-white backdrop-blur-sm shadow-sm ring-1 ring-white/20' 
    : 'bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm ring-1 ring-white/20';

  return (
    <Link to={`/items/${item._id}`} className="block h-full group">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
        
        {item.status === 'resolved' && (
          <div className="absolute top-0 right-0 bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
            RESOLVED
          </div>
        )}

        <div className="h-48 bg-gray-100 w-full relative overflow-hidden border-b border-gray-100">
          <img 
            src={item.image?.url || getPlaceholderImage(item.category)} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          {/* Subtle gradient overlay to make badges pop */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 opacity-60"></div>
          <span className={`absolute top-3 left-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${badgeColor} shadow-sm`}>
            {item.type}
          </span>
        </div>

        <div className="p-5 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-semibold tracking-wider text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-md">
              {item.category}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200 leading-snug">
            {item.title}
          </h3>
          
          <div className="mt-auto space-y-2.5 text-sm text-slate-500 font-medium">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="line-clamp-1">{item.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
