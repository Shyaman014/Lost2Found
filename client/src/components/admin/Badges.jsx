import React from 'react';

export const UserStatusBadge = ({ isActive }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
    isActive
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-600'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
    {isActive ? 'Active' : 'Inactive'}
  </span>
);

export const RoleBadge = ({ role }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    role === 'admin'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-gray-100 text-gray-600'
  }`}>
    {role === 'admin' ? '👑 Admin' : 'Student'}
  </span>
);

export const ItemModerationBadge = ({ moderationStatus }) => {
  const map = {
    active: { cls: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Active' },
    flagged: { cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'Flagged' },
    removed: { cls: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'Removed' },
  };
  const cfg = map[moderationStatus] || map['active'];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

export const ItemStatusBadge = ({ status }) => {
  const map = {
    active: 'bg-blue-100 text-blue-700',
    resolved: 'bg-gray-100 text-gray-600',
    claimed: 'bg-amber-100 text-amber-700',
    returned: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

export const ClaimStatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

export const ReportStatusBadge = ({ status }) => {
  const map = {
    pending: { cls: 'bg-amber-100 text-amber-700', label: 'Pending' },
    reviewed: { cls: 'bg-blue-100 text-blue-700', label: 'Reviewed' },
    dismissed: { cls: 'bg-gray-100 text-gray-500', label: 'Dismissed' },
    action_taken: { cls: 'bg-red-100 text-red-700', label: 'Action Taken' },
  };
  const cfg = map[status] || { cls: 'bg-gray-100 text-gray-600', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};
