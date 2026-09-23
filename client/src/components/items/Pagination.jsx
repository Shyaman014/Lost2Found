import React from 'react';

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasNextPage, hasPreviousPage, totalItems } = pagination;

  if (totalPages <= 1) return null;

  // Build the list of page numbers to show (max 7 buttons)
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const btnBase = 'px-3 py-1.5 text-sm rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const activeCls = 'bg-indigo-600 text-white border-indigo-600';
  const normalCls = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
  const disabledCls = 'bg-white text-gray-300 border-gray-200 cursor-not-allowed';

  return (
    <div className="flex flex-col items-center gap-3 mt-8">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages} &mdash; {totalItems} item{totalItems !== 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-1 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          aria-label="Previous page"
          className={`${btnBase} ${!hasPreviousPage ? disabledCls : normalCls}`}
        >
          ← Prev
        </button>

        {getPageNumbers().map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
              className={`${btnBase} ${p === page ? activeCls : normalCls}`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          aria-label="Next page"
          className={`${btnBase} ${!hasNextPage ? disabledCls : normalCls}`}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Pagination;
