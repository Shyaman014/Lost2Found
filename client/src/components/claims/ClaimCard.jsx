import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ClaimStatusBadge from './ClaimStatusBadge';

const ClaimCard = ({ claim, isFinderView, onApprove, onReject, onCancel }) => {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const { _id, status, evidence, message, item, claimant, rejectionReason, createdAt } = claim;

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold text-gray-900">
              {isFinderView ? `Claim by ${claimant?.name || 'Unknown User'}` : `Claim on: ${item?.title || 'Unknown Item'}`}
            </h3>
            <ClaimStatusBadge status={status} />
          </div>
          <p className="text-xs text-gray-500">Submitted {new Date(createdAt).toLocaleDateString()}</p>
        </div>
        {!isFinderView && item && (
          <Link
            to={`/items/${item._id}`}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            View Item
          </Link>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Message</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{evidence?.message || message}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Identifying Details</h4>
          <ul className="list-disc pl-5 space-y-1">
            {evidence?.specificDetails?.map((detail, idx) => (
              <li key={idx} className="text-sm text-gray-600">{detail}</li>
            ))}
          </ul>
        </div>
      </div>

      {status === 'rejected' && rejectionReason && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
          <p className="text-xs font-semibold text-red-800 mb-1">Rejection Reason:</p>
          <p className="text-sm text-red-700">{rejectionReason}</p>
        </div>
      )}

      {/* Finder Actions */}
      {isFinderView && status === 'pending' && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          {!rejecting ? (
            <div className="flex gap-3">
              <button
                onClick={() => onApprove(_id)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-green-700"
              >
                Approve Claim
              </button>
              <button
                onClick={() => setRejecting(true)}
                className="flex-1 bg-white text-red-600 border border-red-200 px-4 py-2 rounded-md font-medium text-sm hover:bg-red-50"
              >
                Reject Claim
              </button>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-md border border-red-100">
              <label className="block text-sm font-medium text-red-800 mb-1">Reason for Rejection</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-sm p-2 border border-red-200 rounded-md mb-3"
                rows="2"
                placeholder="Optional explanation..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onReject(_id, reason)}
                  className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-700"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => { setRejecting(false); setReason(''); }}
                  className="bg-white text-gray-600 border border-gray-300 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Claimant Actions */}
      {!isFinderView && status === 'pending' && (
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={() => {
              if(window.confirm('Are you sure you want to cancel this claim?')) onCancel(_id);
            }}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Cancel Claim
          </button>
        </div>
      )}
    </div>
  );
};

export default ClaimCard;
