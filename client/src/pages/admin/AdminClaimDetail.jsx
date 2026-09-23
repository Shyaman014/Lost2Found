import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { ClaimStatusBadge } from '../../components/admin/Badges';

const AdminClaimDetail = () => {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await adminService.getAdminClaimById(id);
        setClaim(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load claim details.');
      } finally {
        setLoading(false);
      }
    };
    fetchClaim();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 sm:p-8 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-32" />
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-48 bg-white rounded-xl border border-gray-100" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="p-6 sm:p-8 text-center py-16">
        <p className="text-red-600 font-medium mb-4">{error || 'Claim not found'}</p>
        <Link to="/admin/claims" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          ← Back to Claims
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link to="/admin/claims" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to Claims
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900">Claim Details</h1>
          <ClaimStatusBadge status={claim.status} />
        </div>
        <p className="text-gray-400 text-xs mt-1">Submitted on {new Date(claim.createdAt).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Item Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Target Item</h2>
          {claim.item ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{claim.item.title}</p>
              <p className="text-gray-500 capitalize">Type: {claim.item.type}</p>
              <p className="text-gray-500 capitalize">Category: {claim.item.category}</p>
              <p className="text-gray-500">Location: {claim.item.location}</p>
              <div className="pt-2">
                <Link
                  to={`/admin/items/${claim.item._id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View Item Details →
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Item has been deleted.</p>
          )}
        </div>

        {/* Claimant Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Claimant</h2>
          {claim.claimant ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{claim.claimant.name}</p>
              <p className="text-gray-500">{claim.claimant.email}</p>
              {claim.claimant.studentId && (
                <p className="text-gray-500 text-xs">Student ID: {claim.claimant.studentId}</p>
              )}
              <div className="pt-2">
                <Link
                  to={`/admin/users/${claim.claimant._id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View Claimant Profile →
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Claimant unavailable.</p>
          )}
        </div>
      </div>

      {/* Evidence */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Proof & Evidence</h2>
        <div>
          <span className="text-xs uppercase text-gray-400 font-semibold block mb-1">Claim Statement</span>
          <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg leading-relaxed whitespace-pre-wrap">
            {claim.evidence?.message || 'No statement provided.'}
          </p>
        </div>

        {claim.evidence?.specificDetails && claim.evidence.specificDetails.length > 0 && (
          <div>
            <span className="text-xs uppercase text-gray-400 font-semibold block mb-2">Specific Details</span>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {claim.evidence.specificDetails.map((detail, idx) => (
                <li key={idx} className="bg-gray-50 px-3 py-1.5 rounded-md inline-block mr-2 mb-2">
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Review details */}
      {(claim.status === 'approved' || claim.status === 'rejected') && (
        <div className={`p-6 rounded-xl border ${claim.status === 'approved' ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
          <h2 className="font-semibold text-gray-800 mb-2">Review Summary</h2>
          <p className="text-sm text-gray-700">
            Reviewed by: <span className="font-medium">{claim.reviewedBy?.name || 'Item Reporter'}</span> on{' '}
            {claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleString() : 'N/A'}
          </p>
          {claim.rejectionReason && (
            <p className="text-sm text-red-700 mt-2">
              <strong>Rejection Reason:</strong> {claim.rejectionReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminClaimDetail;
