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
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Claims</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-200 rounded-lg w-full"></div>
          <div className="h-40 bg-gray-200 rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Claims</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Track the status of items you have claimed.
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>
      )}

      {claims.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 mb-4">You haven't submitted any claims yet.</p>
          <Link
            to="/items"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Browse Found Items
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
