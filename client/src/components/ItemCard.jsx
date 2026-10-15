import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPlaceholderImage } from '../utils/placeholders';

const ItemCard = ({ item }) => {
  const isLost = item.type === 'lost';
  const fallbackUrl = getPlaceholderImage(item.category);
  const initialUrl = item.image?.url && item.image.url.trim().length > 0 
    ? item.image.url.trim() 
    : fallbackUrl;

  const [imgSrc, setImgSrc] = useState(initialUrl);

  useEffect(() => {
    const nextUrl = item.image?.url && item.image.url.trim().length > 0 
      ? item.image.url.trim() 
      : fallbackUrl;
    setImgSrc(nextUrl);
  }, [item.image?.url, item.category, fallbackUrl]);

  const handleImageError = () => {
    if (imgSrc !== fallbackUrl) {
      setImgSrc(fallbackUrl);
    }
  };

  return (
    <Link to={`/items/${item._id}`} className="block h-full group">
      <div className="card-saas-hover h-full flex flex-col overflow-hidden bg-white">
        
        {/* Item Image Container with Guaranteed Visibility */}
        <div className="h-48 sm:h-52 bg-slate-100 w-full relative overflow-hidden border-b border-slate-100">
          <img 
            src={imgSrc} 
            alt={item.title} 
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          {/* Type Badge */}
          <div className="absolute top-3 left-3 z-10">
            {isLost ? (
              <span className="badge-lost shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Lost
              </span>
            ) : (
              <span className="badge-found shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Found
              </span>
            )}
          </div>

          {/* Resolved Status Overlay */}
          {item.status === 'resolved' && (
            <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md backdrop-blur-xs tracking-wider uppercase z-10 shadow-xs">
              Resolved
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between">
          <div>
            {/* Category tag & Brand */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center text-[11px] font-semibold tracking-wider text-indigo-700 uppercase bg-indigo-50/80 px-2.5 py-0.5 rounded-md border border-indigo-100/60">
                {item.category || 'General'}
              </span>
              {item.brand && (
                <span className="text-[11px] font-medium text-slate-400 truncate max-w-[120px]">
                  {item.brand}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
              {item.title}
            </h3>
          </div>

          {/* Metadata Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
            {/* Location */}
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="line-clamp-1 text-slate-600 font-medium">{item.location}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-slate-500">
                {item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
