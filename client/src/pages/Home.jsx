import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import itemService from '../services/itemService';
import ItemCard from '../components/ItemCard';

const POPULAR_SEARCHES = ['AirPods', 'Student ID', 'Car Keys', 'Backpack', 'Water Bottle', 'Calculator'];

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Live items state & filter
  const [itemTypeFilter, setItemTypeFilter] = useState('all'); // 'all' | 'lost' | 'found'
  const [recentItems, setRecentItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemError, setItemError] = useState(null);
  const [requiresAuthToView, setRequiresAuthToView] = useState(false);

  // Fetch real recently reported items (publicly accessible on homepage)
  const fetchRecentItems = useCallback(async (type) => {
    setLoadingItems(true);
    setItemError(null);
    setRequiresAuthToView(false);

    try {
      const params = {
        limit: 12,
        sort: 'newest',
        status: 'active',
      };
      if (type && type !== 'all') {
        params.type = type;
      }

      const res = await itemService.getItems(params);
      if (res.success && res.data) {
        setRecentItems(res.data.items || []);
      } else {
        setItemError(res.message || 'Unable to load items.');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setRequiresAuthToView(true);
      } else {
        setItemError('Unable to load recently reported items.');
      }
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentItems(itemTypeFilter);
  }, [fetchRecentItems, itemTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/items?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/items');
    }
  };

  const handleQuickSearch = (term) => {
    setSearchQuery(term);
    navigate(`/items?search=${encodeURIComponent(term)}`);
  };

  return (
    <div className="bg-slate-50/50 min-h-screen">

      {/* ══════════════════════════════════════════════════════════════
          1. HERO SECTION — Clean SaaS aesthetic with strong search
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-16 pb-20 lg:pt-24 lg:pb-28">
        {/* Subtle mesh background */}
        <div className="absolute inset-0 bg-saas-mesh pointer-events-none opacity-60" />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.25] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold mb-6 anim-fade-down shadow-xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Intelligent Campus Lost &amp; Found Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-5 anim-fade-up">
            Lost something on campus? <br className="hidden sm:inline" />
            <span className="text-indigo-600">
              Recover it with AI accuracy.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-lg text-slate-600 leading-relaxed mb-8 anim-fade-up delay-100">
            Lost2Found connects students, faculty, and campus staff. Report missing items or discoveries, and let Gemini AI automatically match them in real-time.
          </p>

          {/* Strong Search Bar */}
          <div className="max-w-2xl mx-auto mb-6 anim-fade-up delay-200">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center p-1.5 sm:p-2 bg-white rounded-2xl border-2 border-indigo-100 shadow-lg shadow-indigo-500/5 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all"
            >
              <div className="pl-2.5 sm:pl-3.5 pr-1.5 sm:pr-2 text-slate-400 shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lost & found items (e.g. blue Hydro Flask, student ID)..."
                className="w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 text-xs sm:text-base focus:outline-none py-1.5 sm:py-2"
              />

              <button
                type="submit"
                className="btn-primary shrink-0 py-2 sm:py-2.5 px-3.5 sm:px-5 text-xs sm:text-sm rounded-xl font-semibold shadow-xs"
              >
                Search
              </button>
            </form>

            {/* Popular quick-tags */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-600 mr-1">Popular:</span>
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleQuickSearch(term)}
                  className="px-2.5 py-1 rounded-md bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors cursor-pointer border border-slate-200/50"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              2. REPORT LOST & FOUND ACTION CARDS (DUAL ACTIONS)
          ══════════════════════════════════════════════════════════════ */}
          <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5 text-left anim-fade-up delay-300">
            
            {/* Card A: Report Lost */}
            <div className="card-saas p-6 border-slate-200/90 hover:border-rose-300 hover:shadow-md transition-all group bg-gradient-to-br from-white via-white to-rose-50/30">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="badge-lost text-[11px]">Action</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1.5 group-hover:text-rose-600 transition-colors">
                I Lost Something
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Post description, photos, and location. Our Gemini AI automatically scans campus found inventory for high-confidence matches.
              </p>
              <Link
                to={isAuthenticated ? '/report-lost' : '/login'}
                className="btn-lost w-full text-center"
              >
                <span>Report Lost Item</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* Card B: Report Found */}
            <div className="card-saas p-6 border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all group bg-gradient-to-br from-white via-white to-emerald-50/30">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-xs group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="badge-found text-[11px]">Action</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1.5 group-hover:text-emerald-600 transition-colors">
                I Found Something
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Be a campus hero. Upload details and handoff location so the rightful owner can verify ownership and reclaim their possession.
              </p>
              <Link
                to={isAuthenticated ? '/report-found' : '/login'}
                className="btn-found w-full text-center"
              >
                <span>Report Found Item</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. REAL RECENTLY REPORTED ITEMS & LOST/FOUND FILTERS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Lost / Found Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Live Campus Feed
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Recently Reported Items
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Real-time updates directly from campus buildings, classrooms, and libraries.
            </p>
          </div>

          {/* Lost / Found Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs shrink-0 max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setItemTypeFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                itemTypeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All Items
            </button>

            <button
              type="button"
              onClick={() => setItemTypeFilter('lost')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                itemTypeFilter === 'lost'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${itemTypeFilter === 'lost' ? 'bg-white' : 'bg-rose-500'}`} />
              Lost
            </button>

            <button
              type="button"
              onClick={() => setItemTypeFilter('found')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                itemTypeFilter === 'found'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${itemTypeFilter === 'found' ? 'bg-white' : 'bg-emerald-500'}`} />
              Found
            </button>
          </div>
        </div>

        {/* Real Content States */}
        {requiresAuthToView ? (
          /* When guest views the site, campus records are kept secure */
          <div className="card-saas p-10 sm:p-14 text-center max-w-2xl mx-auto border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center text-2xl mb-4 shadow-xs">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Campus Privacy Protected
            </h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Live reports, item images, and claim histories are restricted to verified campus members. Sign in with your student credentials to view the live feed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/login" className="btn-primary w-full sm:w-auto px-6 py-2.5">
                Sign In to View
              </Link>
              <Link to="/register" className="btn-secondary w-full sm:w-auto px-6 py-2.5">
                Register Student Account
              </Link>
            </div>
          </div>
        ) : loadingItems ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-saas overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-slate-200 rounded-md w-1/4" />
                  <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : itemError ? (
          /* Error state */
          <div className="card-saas p-10 text-center max-w-lg mx-auto">
            <p className="text-rose-600 font-semibold mb-3 text-sm">{itemError}</p>
            <button
              type="button"
              onClick={() => fetchRecentItems(itemTypeFilter)}
              className="btn-secondary text-xs"
            >
              Retry loading items
            </button>
          </div>
        ) : recentItems.length === 0 ? (
          /* Empty state */
          <div className="card-saas p-12 text-center max-w-lg mx-auto border-dashed">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              No {itemTypeFilter !== 'all' ? itemTypeFilter : ''} items reported yet
            </h3>
            <p className="text-slate-500 text-xs mb-5">
              Be the first to report an item in this category to help our campus community.
            </p>
            <Link
              to={itemTypeFilter === 'found' ? '/report-found' : '/report-lost'}
              className="btn-primary text-xs"
            >
              + File a Report
            </Link>
          </div>
        ) : (
          /* Real items grid */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentItems.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>

            {/* Bottom link to all items */}
            <div className="mt-10 text-center">
              <Link
                to={itemTypeFilter === 'all' ? '/items' : `/items?type=${itemTypeFilter}`}
                className="btn-secondary px-6 py-2.5 font-semibold text-sm shadow-xs hover:border-indigo-300"
              >
                <span>Browse all {itemTypeFilter !== 'all' ? itemTypeFilter : ''} campus items</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </>
        )}

      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. HOW IT WORKS — Streamlined SaaS 3-step workflow
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              Streamlined Flow
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              How Lost2Found Works
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              Three seamless steps from misplacing an item to returning it safely.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card-saas p-7 relative">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 font-extrabold text-sm flex items-center justify-center mb-5 border border-rose-100">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                1. Report the Item
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Fill in the item category, brand, color, last known campus location, and a photo in under two minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="card-saas p-7 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold text-sm flex items-center justify-center mb-5 border border-indigo-100">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                2. AI Matches in Background
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Gemini AI compares textual attributes and locations against live inventory to surface high-probability matches automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div className="card-saas p-7 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 font-extrabold text-sm flex items-center justify-center mb-5 border border-emerald-100">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                3. Secure Verification &amp; Return
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connect via in-app real-time chat, verify identifying details, and coordinate an on-campus exchange safely.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. CAMPUS SAFETY & TRUST PILLARS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="card-saas p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Gemini AI Matching</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Smart automated scoring compares keywords, dates, and locations.
              </p>
            </div>
          </div>

          <div className="card-saas p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">In-App Chat</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Direct student-to-student messaging without sharing phone numbers.
              </p>
            </div>
          </div>

          <div className="card-saas p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Live Notifications</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Instant alerts when a potential match or claim update occurs.
              </p>
            </div>
          </div>

          <div className="card-saas p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Verified Community</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Restricted to campus authentication to ensure integrity.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. BOTTOM CALL TO ACTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-saas p-8 sm:p-12 text-center bg-slate-900 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 tracking-tight">
              Help make our campus a safer place.
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-8 leading-relaxed">
              Every reported item brings someone closer to getting back their lost keys, laptops, or IDs. Start today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={isAuthenticated ? '/report-lost' : '/login'}
                className="btn-lost w-full sm:w-auto px-6 py-3 font-semibold"
              >
                Report Lost Item
              </Link>
              <Link
                to={isAuthenticated ? '/report-found' : '/login'}
                className="btn-found w-full sm:w-auto px-6 py-3 font-semibold"
              >
                Report Found Item
              </Link>
              <Link
                to="/items"
                className="btn-secondary w-full sm:w-auto px-6 py-3 font-semibold bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
              >
                Browse All Items
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
