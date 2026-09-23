import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { ReportStatusBadge } from '../../components/admin/Badges';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const AdminReportDetail = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review Form State
  const [status, setStatus] = useState('reviewed');
  const [adminNote, setAdminNote] = useState('');
  const [action, setAction] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAdminReportById(id);
      setReport(res.data);
      setStatus(res.data.status === 'pending' ? 'reviewed' : res.data.status);
      setAdminNote(res.data.adminNote || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleSubmitReview = async () => {
    try {
      setSubmitting(true);
      setActionError(null);
      const payload = {
        status,
        adminNote,
      };
      if (status === 'action_taken' && action) {
        payload.action = action;
      }
      await adminService.reviewReport(id, payload);
      setConfirmOpen(false);
      fetchReport();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-32" />
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-64 bg-white rounded-xl border border-gray-100" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 sm:p-8 text-center py-16">
        <p className="text-red-600 font-medium mb-4">{error || 'Report not found'}</p>
        <Link to="/admin/reports" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          ← Back to Reports
        </Link>
      </div>
    );
  }

  const { target } = report;

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link to="/admin/reports" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to Reports
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900">Review Report</h1>
          <ReportStatusBadge status={report.status} />
        </div>
        <p className="text-gray-400 text-xs mt-1">Submitted on {new Date(report.createdAt).toLocaleString()}</p>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {actionError}
        </div>
      )}

      {/* Grid: Reporter & Target */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reporter Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Reporter</h2>
          {report.reporter ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{report.reporter.name}</p>
              <p className="text-gray-500">{report.reporter.email}</p>
              {report.reporter.studentId && (
                <p className="text-gray-500 text-xs">Student ID: {report.reporter.studentId}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Anonymous / User deleted</p>
          )}
        </div>

        {/* Target Entity Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">
            Target ({report.targetType})
          </h2>
          {target ? (
            <div className="space-y-2 text-sm">
              {report.targetType === 'item' ? (
                <>
                  <p className="font-medium text-gray-900">{target.title}</p>
                  <p className="text-gray-500 capitalize">Category: {target.category}</p>
                  <p className="text-gray-500 capitalize">Moderation: {target.moderationStatus}</p>
                  <div className="pt-2">
                    <Link
                      to={`/admin/items/${target._id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View Item Details →
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-gray-900">{target.name}</p>
                  <p className="text-gray-500">{target.email}</p>
                  <p className="text-gray-500">Status: {target.isActive ? 'Active' : 'Inactive'}</p>
                  <div className="pt-2">
                    <Link
                      to={`/admin/users/${target._id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View User Profile →
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Target entity deleted or unavailable.</p>
          )}
        </div>
      </div>

      {/* Report Reason & Description */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Violation Claim</h2>
        <div>
          <span className="text-xs uppercase text-gray-400 font-semibold block mb-1">Reason</span>
          <span className="inline-block bg-amber-50 text-amber-800 font-medium text-sm px-3 py-1 rounded-md border border-amber-200">
            {report.reason}
          </span>
        </div>
        <div>
          <span className="text-xs uppercase text-gray-400 font-semibold block mb-1">Reporter Notes</span>
          <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg leading-relaxed whitespace-pre-wrap">
            {report.description || 'No additional details provided.'}
          </p>
        </div>
      </div>

      {/* Admin Action Form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Admin Resolution</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Update Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                if (e.target.value !== 'action_taken') setAction('');
              }}
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="reviewed">Reviewed (No further action)</option>
              <option value="dismissed">Dismiss (False report)</option>
              <option value="action_taken">Action Taken</option>
            </select>
          </div>

          {status === 'action_taken' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Enforce Action</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose an action...</option>
                {report.targetType === 'item' ? (
                  <option value="remove_item">Remove Target Item</option>
                ) : (
                  <option value="deactivate_user">Deactivate Target User</option>
                )}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Admin Internal Note</label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Add explanation for this moderation decision..."
            className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
            rows={3}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            Save Decision
          </button>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          isOpen={confirmOpen}
          title="Confirm Report Review"
          message={`Are you sure you want to mark this report as "${status}"${action ? ` and execute "${action}"` : ''}?`}
          confirmLabel="Confirm Decision"
          confirmVariant={status === 'action_taken' ? 'danger' : 'primary'}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleSubmitReview}
        />
      )}
    </div>
  );
};

export default AdminReportDetail;
