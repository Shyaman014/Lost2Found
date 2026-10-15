import React from 'react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'documents', label: 'Documents' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'keys', label: 'Keys' },
  { value: 'bags', label: 'Bags' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'books', label: 'Books' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'date-newest', label: 'Date Reported (Newest)' },
  { value: 'date-oldest', label: 'Date Reported (Oldest)' },
];

const Field = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full border border-slate-200/90 rounded-xl py-2 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/10 bg-slate-50/50 hover:bg-white transition-all';

const ItemFilters = ({ filters, onChange, onClear }) => {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Refine Search</h2>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
          type="button"
        >
          Reset
        </button>
      </div>

      {/* Type */}
      <Field label="Item Type">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
          {[
            { value: '', label: 'All' },
            { value: 'lost', label: 'Lost' },
            { value: 'found', label: 'Found' },
          ].map((t) => {
            const isSelected = filters.type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => handleChange('type', t.value)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? t.value === 'lost'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : t.value === 'found'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {t.value === 'lost' && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-500'}`} />}
                {t.value === 'found' && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />}
                {t.label}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Category */}
      <Field label="Category">
        <select
          value={filters.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className={inputCls}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Status */}
      <Field label="Status">
        <select
          value={filters.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className={inputCls}
        >
          <option value="active">Active Reports</option>
          <option value="resolved">Resolved / Reunited</option>
        </select>
      </Field>

      {/* Sort */}
      <Field label="Sort By">
        <select
          value={filters.sort}
          onChange={(e) => handleChange('sort', e.target.value)}
          className={inputCls}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Location */}
      <Field label="Campus Location">
        <div className="relative">
          <input
            type="text"
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="e.g. Science Library, Hall A"
            className={inputCls}
          />
        </div>
      </Field>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="From Date">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="To Date">
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      {/* Color & Brand */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Color">
          <input
            type="text"
            value={filters.color}
            onChange={(e) => handleChange('color', e.target.value)}
            placeholder="e.g. Blue"
            className={inputCls}
          />
        </Field>
        <Field label="Brand">
          <input
            type="text"
            value={filters.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            placeholder="e.g. Apple"
            className={inputCls}
          />
        </Field>
      </div>
    </aside>
  );
};

export default ItemFilters;
