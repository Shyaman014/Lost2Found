import React from 'react';

const ClaimStatusBadge = ({ status }) => {
  let styles = '';
  let label = '';

  switch (status) {
    case 'pending':
      styles = 'bg-yellow-100 text-yellow-800';
      label = 'Pending';
      break;
    case 'approved':
      styles = 'bg-green-100 text-green-800';
      label = 'Approved';
      break;
    case 'rejected':
      styles = 'bg-red-100 text-red-800';
      label = 'Rejected';
      break;
    case 'cancelled':
      styles = 'bg-gray-100 text-gray-800';
      label = 'Cancelled';
      break;
    default:
      styles = 'bg-gray-100 text-gray-800';
      label = status;
  }

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles}`}>
      {label}
    </span>
  );
};

export default ClaimStatusBadge;
