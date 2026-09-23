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
    if (!window.confirm('Are you sure you want to approve this claim? This will reject all other pending claims.')) return;
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
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse h-10 w-1/3 bg-gray-200 rounded mb-6"></div>
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-200 rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to={`/items/${id}`} className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
            ← Back to Item
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Review Claims</h1>
          <p className="text-gray-500 text-sm mt-1">Review ownership evidence submitted by users.</p>
        </div>
        {item?.status === 'claimed' && (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
            Item is Claimed
          </span>
        )}
      </div>

      {(error || actionError) && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error || actionError}</div>
      )}

      {claims.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500">No claims have been submitted for this item yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
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
