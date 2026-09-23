import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import itemService from '../services/itemService';
import ItemCard from '../components/ItemCard';
import ItemFilters from '../components/items/ItemFilters';
import Pagination from '../components/items/Pagination';

const DEFAULT_FILTERS = {
  search: '',
  type: '',
  category: '',
  location: '',
  dateFrom: '',
  dateTo: '',
  color: '',
  brand: '',
  status: 'active',
  sort: 'newest',
  page: 1,
};

// Read filters from URL search params (fallback to defaults)
const parseFiltersFromParams = (searchParams) => ({
  search: searchParams.get('search') || '',
  type: searchParams.get('type') || '',
  category: searchParams.get('category') || '',
  location: searchParams.get('location') || '',
  dateFrom: searchParams.get('dateFrom') || '',
  dateTo: searchParams.get('dateTo') || '',
  color: searchParams.get('color') || '',
  brand: searchParams.get('brand') || '',
  status: searchParams.get('status') || 'active',
  sort: searchParams.get('sort') || 'newest',
  page: parseInt(searchParams.get('page') || '1', 10),
});

// Build URLSearchParams from filters (omit defaults to keep URL clean)
const buildSearchParams = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    const def = DEFAULT_FILTERS[k];
    if (v !== '' && v !== undefined && String(v) !== String(def)) {
      params.set(k, String(v));
    }
  });
  return params;
};

// Simple debounce hook
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

const Items = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => parseFiltersFromParams(searchParams));

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounce only the search string; other filters apply immediately
  const debouncedSearch = useDebounce(filters.search, 450);

  // Sync URL → state when browser back/forward is used
  useEffect(() => {
    setFilters(parseFiltersFromParams(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Fetch items whenever debounced search or any other filter changes
  const abortRef = useRef(null);
  const fetchItems = useCallback(async (currentFilters) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const params = { ...currentFilters, search: debouncedSearch };
      const response = await itemService.getItems(params);
      if (response.success) {
        setItems(response.data.items);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Failed to load items.');
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError('Unable to load items. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  // Trigger fetch when filters (with debounced search applied) change
  useEffect(() => {
    const merged = { ...filters, search: debouncedSearch };
    fetchItems(merged);
    // Also sync URL
    setSearchParams(buildSearchParams(merged), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    filters.type, filters.category, filters.location,
    filters.dateFrom, filters.dateTo, filters.color, filters.brand,
    filters.status, filters.sort, filters.page,
  ]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handlePageChange = (newPage) => {
    setFilters(f => ({ ...f, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setFilters(f => ({ ...f, search: e.target.value, page: 1 }));
  };

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'page' || k === 'sort') return false;
    return String(v) !== String(DEFAULT_FILTERS[k]);
  }).length;

  const CardSkeleton = () => (
    <div className="rounded-xl border border-gray-100 bg-white animate-pulse overflow-hidden">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/5" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Browse Items</h1>
        <p className="mt-1 text-gray-500 text-sm">Discover lost and found reports from your campus.</p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <label htmlFor="items-search" className="sr-only">Search items</label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            id="items-search"
            type="search"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by title, description, brand, color, location…"
            className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="flex gap-8">

        {/* Desktop sidebar */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <ItemFilters
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Mobile filter button */}
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold">{activeFilterCount}</span>
              )}
            </button>
            {pagination && !loading && (
              <p className="text-sm text-gray-500">{pagination.totalItems} item{pagination.totalItems !== 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Desktop result count */}
          {pagination && !loading && (
            <div className="hidden lg:flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {pagination.totalItems === 0
                  ? 'No items found'
                  : `Showing ${Math.min((pagination.page - 1) * pagination.limit + 1, pagination.totalItems)}–${Math.min(pagination.page * pagination.limit, pagination.totalItems)} of ${pagination.totalItems} item${pagination.totalItems !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-16 bg-white rounded-lg border border-red-100">
              <p className="text-red-600 font-medium mb-3">{error}</p>
              <button
                onClick={() => fetchItems(filters)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && items.length === 0 && (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-100">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-sm font-semibold text-gray-900">No matching items found</h3>
              <p className="mt-1 text-sm text-gray-500">Try removing some filters or changing your search terms.</p>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={handleClearFilters}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Clear all filters
                </button>
                <Link to="/report-lost" className="text-sm font-medium text-gray-600 hover:text-gray-800">
                  Report Lost Item
                </Link>
              </div>
            </div>
          )}

          {/* Results grid */}
          {!loading && !error && items.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {items.map(item => <ItemCard key={item._id} item={item} />)}
              </div>
              {pagination && (
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setShowMobileFilters(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="relative ml-auto w-80 max-w-full bg-white h-full overflow-y-auto shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
                className="text-gray-500 hover:text-gray-800"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ItemFilters
              filters={filters}
              onChange={(f) => { handleFilterChange(f); setShowMobileFilters(false); }}
              onClear={() => { handleClearFilters(); setShowMobileFilters(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
