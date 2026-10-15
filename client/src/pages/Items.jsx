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

  // Premium Shimmering Card Skeleton
  const CardSkeleton = () => (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
      <div className="h-48 sm:h-52 bg-slate-100 animate-shimmer" />
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-200/80 rounded-md w-20 animate-shimmer" />
          <div className="h-3 bg-slate-200/60 rounded-md w-16 animate-shimmer" />
        </div>
        <div className="h-5 bg-slate-200 rounded-md w-3/4 animate-shimmer" />
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="h-3 bg-slate-200/70 rounded-md w-1/2 animate-shimmer" />
          <div className="h-3 bg-slate-200/60 rounded-md w-2/5 animate-shimmer" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            Campus Catalog
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Browse All Items
          </h1>
          <p className="mt-1 text-slate-500 text-sm max-w-xl">
            Explore reported lost belongings or claimed found objects across the entire campus.
          </p>
        </div>

        {/* Quick Report CTAs */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/report-lost"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200/80 hover:bg-rose-100/80 transition-all shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Report Lost
          </Link>
          <Link
            to="/report-found"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100/80 transition-all shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Report Found
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <label htmlFor="items-search" className="sr-only">Search items</label>
        <div className="relative group">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            id="items-search"
            type="search"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by title, description, color, brand, or location..."
            className="block w-full rounded-2xl border border-slate-200/90 bg-white py-3.5 pl-11 pr-10 text-sm sm:text-base text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => handleFilterChange({ ...filters, search: '', page: 1 })}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-8 items-start">

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <ItemFilters
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">

          {/* Mobile Filter Trigger Bar */}
          <div className="lg:hidden mb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
            >
              <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              <span>Filter Results</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {pagination && !loading && (
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                {pagination.totalItems} item{pagination.totalItems !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {/* Desktop Result Summary Bar */}
          {pagination && !loading && (
            <div className="hidden lg:flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                {pagination.totalItems === 0
                  ? 'No items matched your criteria'
                  : `Showing ${Math.min((pagination.page - 1) * pagination.limit + 1, pagination.totalItems)}–${Math.min(pagination.page * pagination.limit, pagination.totalItems)} of ${pagination.totalItems} active reports`
                }
              </p>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Clear active filters ({activeFilterCount})
                </button>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16 bg-white rounded-2xl border border-rose-100 p-8 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 text-2xl">
                ⚠️
              </div>
              <p className="text-rose-700 font-bold mb-2">{error}</p>
              <button
                onClick={() => fetchItems(filters)}
                className="btn-primary text-xs"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && items.length === 0 && (
            <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4 text-3xl">
                🔍
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">No Matching Items Found</h3>
              <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto">
                We couldn't find any items matching your active search terms or filters. Try adjusting your parameters.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
                <Link
                  to="/report-lost"
                  className="btn-primary text-xs"
                >
                  Report a Lost Item
                </Link>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {!loading && !error && items.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {items.map(item => <ItemCard key={item._id} item={item} />)}
              </div>
              {pagination && (
                <div className="mt-8">
                  <Pagination pagination={pagination} onPageChange={handlePageChange} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMobileFilters(false)}
            aria-hidden="true"
          />
          <div className="relative ml-auto w-84 max-w-full bg-white h-full overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h2 className="font-black text-slate-900 text-base">Filter Catalog</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                aria-label="Close filters"
                className="text-slate-400 hover:text-slate-700 text-lg p-1"
              >
                ✕
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
