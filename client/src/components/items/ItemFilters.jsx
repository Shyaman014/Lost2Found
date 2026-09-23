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
  { value: 'date-newest', label: 'Date Lost/Found (Newest)' },
  { value: 'date-oldest', label: 'Date Lost/Found (Oldest)' },
];

const Field = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
      {label}
    </label>
    {children}
  </div>
);

const inputCls = 'w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white';

const ItemFilters = ({ filters, onChange, onClear }) => {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  return (
    <aside className="w-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Filters</h2>
        <button
          onClick={onClear}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          type="button"
        >
          Clear all
        </button>
      </div>

      {/* Type */}
      <Field label="Item Type">
        <div className="flex gap-2 flex-wrap">
          {['', 'lost', 'found'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => handleChange('type', t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                filters.type === t
                  ? t === 'lost'
                    ? 'bg-red-600 text-white border-red-600'
                    : t === 'found'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {t === '' ? 'All' : t === 'lost' ? 'Lost' : 'Found'}
            </button>
          ))}
        </div>
      </Field>

      {/* Category */}
      <Field label="Category">
        <select
          value={filters.category}
          onChange={e => handleChange('category', e.target.value)}
          className={inputCls}
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </Field>

      {/* Status */}
      <Field label="Status">
        <select
          value={filters.status}
          onChange={e => handleChange('status', e.target.value)}
          className={inputCls}
        >
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </select>
      </Field>

      {/* Sort */}
      <Field label="Sort By">
        <select
          value={filters.sort}
          onChange={e => handleChange('sort', e.target.value)}
          className={inputCls}
        >
          {SORT_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </Field>

      {/* Location */}
      <Field label="Location">
        <input
          type="text"
          value={filters.location}
          onChange={e => handleChange('location', e.target.value)}
          placeholder="e.g. Library"
          className={inputCls}
        />
      </Field>

      {/* Date From */}
      <Field label="Date From">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={e => handleChange('dateFrom', e.target.value)}
          className={inputCls}
        />
      </Field>

      {/* Date To */}
      <Field label="Date To">
        <input
          type="date"
          value={filters.dateTo}
          onChange={e => handleChange('dateTo', e.target.value)}
          className={inputCls}
        />
      </Field>

      {/* Color */}
      <Field label="Color">
        <input
          type="text"
          value={filters.color}
          onChange={e => handleChange('color', e.target.value)}
          placeholder="e.g. Black"
          className={inputCls}
        />
      </Field>

      {/* Brand */}
      <Field label="Brand">
        <input
          type="text"
          value={filters.brand}
          onChange={e => handleChange('brand', e.target.value)}
          placeholder="e.g. Casio"
          className={inputCls}
        />
      </Field>
    </aside>
  );
};

export default ItemFilters;
