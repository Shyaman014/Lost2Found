import React from 'react';
import { Link } from 'react-router-dom';
import { getPlaceholderImage } from '../utils/placeholders';

const ItemCard = ({ item }) => {
  const isLost = item.type === 'lost';
  const badgeColor = isLost ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

  return (
    <Link to={`/items/${item._id}`} className="block h-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200 h-full flex flex-col relative overflow-hidden group">
        
        {item.status === 'resolved' && (
          <div className="absolute top-0 right-0 bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
            RESOLVED
          </div>
        )}

        <div className="h-48 bg-gray-100 w-full relative overflow-hidden border-b border-gray-100">
          <img 
            src={item.image?.url || getPlaceholderImage(item.category)} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <span className={`absolute top-3 left-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${badgeColor} shadow-sm`}>
            {item.type}
          </span>
        </div>

        <div className="p-5 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
              {item.category}
            </span>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
          
          <div className="mt-auto space-y-2 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="mr-2">📍</span>
              <span className="line-clamp-1">{item.location}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📅</span>
              <span>{new Date(item.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
