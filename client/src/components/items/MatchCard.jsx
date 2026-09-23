import React from 'react';
import { Link } from 'react-router-dom';

const MatchCard = ({ match, onDismiss, isDismissing }) => {
  const { matchedItem, score, reasons } = match;
  if (!matchedItem) return null;

  const isLost = matchedItem.type === 'lost';
  const badgeColor = isLost ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

  const scoreColor =
    score >= 85 ? 'text-green-600' :
    score >= 70 ? 'text-yellow-600' :
    'text-gray-500';

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="h-36 bg-gray-100 w-full relative">
        {matchedItem.image?.url ? (
          <img
            src={matchedItem.image.url}
            alt={matchedItem.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${badgeColor}`}>
          {matchedItem.type}
        </span>
      </div>

      <div className="p-4">
        {/* Score */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-lg font-bold ${scoreColor}`}>{score}% match</span>
          <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded">{matchedItem.category}</span>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{matchedItem.title}</h4>

        {/* Location & Date */}
        <div className="space-y-0.5 text-xs text-gray-500 mb-3">
          {matchedItem.location && <p>📍 {matchedItem.location}</p>}
          {matchedItem.date && <p>📅 {new Date(matchedItem.date).toLocaleDateString()}</p>}
        </div>

        {/* Reasons */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Why this may match:</p>
          <ul className="space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            to={`/items/${matchedItem._id}`}
            className="flex-1 text-center px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            View Item
          </Link>
          <button
            onClick={() => onDismiss(match._id)}
            disabled={isDismissing}
            className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
