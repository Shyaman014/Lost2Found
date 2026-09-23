import React, { useState, useEffect, useCallback } from 'react';
import itemService from '../../services/itemService';
import MatchCard from './MatchCard';

const PotentialMatches = ({ itemId, isOwner }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [dismissingId, setDismissingId] = useState(null);
  const [error, setError] = useState(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Load existing matches on mount
  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await itemService.getMatches(itemId);
      if (res.success) {
        setMatches(res.data.matches);
        // If there are already stored matches, mark as triggered
        if (res.data.matches.length > 0) setHasTriggered(true);
      }
    } catch {
      setError('Could not load existing matches.');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleFindMatches = async (force = false) => {
    setTriggering(true);
    setError(null);
    try {
      const res = await itemService.findMatches(itemId, force);
      if (res.success) {
        setMatches(res.data.matches);
        setHasTriggered(true);
      } else {
        setError(res.message || 'Could not run matching.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to find matches right now. Please try again later.');
    } finally {
      setTriggering(false);
    }
  };

  const handleDismiss = async (matchId) => {
    setDismissingId(matchId);
    try {
      const res = await itemService.dismissMatch(matchId);
      if (res.success) {
        setMatches(prev => prev.filter(m => m._id !== matchId));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not dismiss match.');
    } finally {
      setDismissingId(null);
    }
  };

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Potential Matches</h2>
          <p className="text-sm text-gray-500">AI-suggested reports that may relate to this item.</p>
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => handleFindMatches(false)}
              disabled={triggering}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {triggering ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Finding matches…
                </>
              ) : (
                <>✨ Find Potential Matches</>
              )}
            </button>
            {hasTriggered && (
              <button
                onClick={() => handleFindMatches(true)}
                disabled={triggering}
                title="Force regenerate matches"
                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                ↺ Refresh
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white animate-pulse overflow-hidden">
              <div className="h-36 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Triggering state (AI running) */}
      {triggering && (
        <div className="text-center py-10 text-gray-500 text-sm">
          <svg className="animate-spin h-6 w-6 mx-auto mb-3 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          AI is analysing candidates…
        </div>
      )}

      {/* Empty — not yet triggered */}
      {!loading && !triggering && !hasTriggered && matches.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">No matches have been generated yet.</p>
          {isOwner ? (
            <p className="text-gray-400 text-xs mt-1">Click <strong>Find Potential Matches</strong> to run AI analysis.</p>
          ) : (
            <p className="text-gray-400 text-xs mt-1">The item reporter can trigger AI matching.</p>
          )}
        </div>
      )}

      {/* Empty — triggered but none found */}
      {!loading && !triggering && hasTriggered && matches.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-700 text-sm font-medium">No strong potential matches found.</p>
          <p className="text-gray-400 text-xs mt-1">You can try again later as new items are reported.</p>
        </div>
      )}

      {/* Match cards */}
      {!loading && !triggering && matches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map(match => (
            <MatchCard
              key={match._id}
              match={match}
              onDismiss={handleDismiss}
              isDismissing={dismissingId === match._id}
            />
          ))}
        </div>
      )}

      {!loading && !triggering && (
        <p className="mt-4 text-xs text-gray-400 italic">
          Match scores represent AI similarity assessments — not confirmation of identity. The user remains in control of all decisions.
        </p>
      )}
    </div>
  );
};

export default PotentialMatches;
