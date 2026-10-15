import React, { useState, useEffect } from 'react';
import itemService from '../services/itemService';
import ClaimCard from '../components/claims/ClaimCard';
import { Link } from 'react-router-dom';

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await itemService.getMyClaims();
      if (res.success) setClaims(res.data.claims);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch claims.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (claimId) => {
    try {
      const res = await itemService.cancelClaim(claimId);
      if (res.success) {
        setClaims(claims.map(c => c._id === claimId ? { ...c, status: 'cancelled' } : c));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel claim');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="h-8 bg-slate-200 rounded-md w-48 mb-2 animate-shimmer" />
        <div className="h-4 bg-slate-200 rounded-md w-72 mb-8 animate-shimmer" />
        <div className="space-y-4">
          <div className="h-44 bg-slate-100 rounded-2xl animate-shimmer" />
          <div className="h-44 bg-slate-100 rounded-2xl animate-shimmer" />
        </div>
      </div>
    );
  }

  const pendingCount = claims.filter(c => c.status === 'pending').length;
  const approvedCount = claims.filter(c => c.status === 'approved').length;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            Activity Hub
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Submitted Claims</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track real-time status and security answers for items you have claimed.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            {pendingCount} Pending
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            {approvedCount} Approved
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl mb-6 text-sm">
          {error}
        </div>
      )}

      {claims.length === 0 ? (
        <div className="card-saas p-12 sm:p-16 text-center border-dashed">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 text-3xl">
            📋
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">No Active Claims</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1 mb-6">
            You haven't submitted any verification claims yet. Found your lost item in the public catalog? Claim it directly from its details page.
          </p>
          <Link
            to="/items"
            className="btn-primary text-xs"
          >
            Browse Campus Items →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map(claim => (
            <ClaimCard
              key={claim._id}
              claim={claim}
              isFinderView={false}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClaims;
