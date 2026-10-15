import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ClaimStatusBadge from './ClaimStatusBadge';

const ClaimCard = ({ claim, isFinderView, onApprove, onReject, onCancel }) => {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const { _id, status, evidence, message, item, claimant, rejectionReason, createdAt } = claim;

  return (
    <div className="card-saas p-5 sm:p-6 bg-white overflow-hidden shadow-xs hover:border-slate-300 transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <h3 className="font-bold text-base text-slate-900">
              {isFinderView ? `Claim by ${claimant?.name || 'Campus Student'}` : `Claim on: ${item?.title || 'Reported Item'}`}
            </h3>
            <ClaimStatusBadge status={status} />
          </div>
          <p className="text-xs text-slate-400">
            Submitted on {new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {!isFinderView && item && (
          <Link
            to={`/items/${item._id}`}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors self-start sm:self-auto"
          >
            View Item Details →
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Verification Message */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Claimant's Message
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
            {evidence?.message || message || 'No message provided.'}
          </p>
        </div>

        {/* Identifying Details Answers */}
        {evidence?.specificDetails && evidence.specificDetails.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Provided Security Answers
            </h4>
            <div className="space-y-1.5">
              {evidence.specificDetails.map((detail, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 bg-indigo-50/40 border border-indigo-100/60 p-2.5 rounded-lg">
                  <span className="text-indigo-600 font-bold shrink-0">#{idx + 1}</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rejection Banner */}
      {status === 'rejected' && rejectionReason && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs sm:text-sm">
          <p className="font-bold text-rose-800 mb-0.5">Rejection Reason:</p>
          <p className="text-rose-700">{rejectionReason}</p>
        </div>
      )}

      {/* Finder Actions (Approve / Reject) */}
      {isFinderView && status === 'pending' && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          {!rejecting ? (
            <div className="flex gap-2.5">
              <button
                onClick={() => onApprove(_id)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>✓</span> Approve & Open Private Chat
              </button>
              <button
                onClick={() => setRejecting(true)}
                className="flex-1 bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Reject Claim
              </button>
            </div>
          ) : (
            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-100 anim-scale-in">
              <label className="block text-xs font-bold text-rose-800 mb-1.5">Reason for Rejection</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 border border-rose-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                rows="2"
                placeholder="Briefly state why this claim was not verified..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onReject(_id, reason)}
                  className="bg-rose-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => { setRejecting(false); setReason(''); }}
                  className="bg-white text-slate-600 border border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Claimant Actions (Cancel) */}
      {!isFinderView && status === 'pending' && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel this claim?')) onCancel(_id);
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
          >
            Cancel Claim
          </button>
        </div>
      )}
    </div>
  );
};

export default ClaimCard;
