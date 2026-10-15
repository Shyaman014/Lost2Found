import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import itemService from '../services/itemService';
import ClaimCard from '../components/claims/ClaimCard';

const ItemClaimsReview = () => {
  const { id } = useParams();
  const [claims, setClaims] = useState([]);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [claimsRes, itemRes] = await Promise.all([
        itemService.getItemClaims(id),
        itemService.getItemById(id)
      ]);
      if (claimsRes.success) setClaims(claimsRes.data.claims);
      if (itemRes.success) setItem(itemRes.data.item);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch claims.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (claimId) => {
    if (!window.confirm('Are you sure you want to approve this claim? This will automatically reject all other pending claims and mark this item as claimed.')) return;
    try {
      setActionError(null);
      const res = await itemService.approveClaim(claimId);
      if (res.success) {
        // Refresh claims and item state
        fetchData();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to approve claim');
    }
  };

  const handleReject = async (claimId, reason) => {
    try {
      setActionError(null);
      const res = await itemService.rejectClaim(claimId, reason);
      if (res.success) {
        setClaims(claims.map(c => c._id === claimId ? res.data.claim : c));
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject claim');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="h-8 bg-slate-200 rounded-md w-48 mb-3 animate-shimmer" />
        <div className="h-4 bg-slate-200 rounded-md w-72 mb-8 animate-shimmer" />
        <div className="space-y-4">
          <div className="h-44 bg-slate-100 rounded-2xl animate-shimmer" />
          <div className="h-44 bg-slate-100 rounded-2xl animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link to={`/items/${id}`} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 mb-2 inline-flex items-center gap-1 transition-colors">
          <span>←</span> Back to Item Details
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Review Ownership Claims
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Verify claimant evidence for <strong className="text-slate-800">{item?.title || 'this item'}</strong>.
            </p>
          </div>
          {item?.status === 'claimed' && (
            <span className="px-3.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold shrink-0">
              Item Status: Claimed
            </span>
          )}
        </div>
      </div>

      {(error || actionError) && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl mb-6 text-sm">
          {error || actionError}
        </div>
      )}

      {claims.length === 0 ? (
        <div className="card-saas p-12 sm:p-16 text-center border-dashed">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 text-3xl">
            📭
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">No Claims Yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
            No students have submitted verification answers for this found item yet. You will receive an instant notification when a claim arrives.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {claims.map(claim => (
            <ClaimCard
              key={claim._id}
              claim={claim}
              isFinderView={true}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemClaimsReview;
