import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import itemService from '../services/itemService';
import { AuthContext } from '../context/AuthContext';
import PotentialMatches from '../components/items/PotentialMatches';
import ClaimForm from '../components/claims/ClaimForm';
import chatService from '../services/chatService';
import { getPlaceholderImage } from '../utils/placeholders';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [claimsCount, setClaimsCount] = useState(0);
  const [conversationId, setConversationId] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await itemService.getItemById(id);
        if (response.success) {
          setItem(response.data.item);
          // Check if there are claims for finders
          if (response.data.item.type === 'found' && response.data.item.reportedBy?._id === currentUser?._id) {
            try {
              const claimsRes = await itemService.getItemClaims(id);
              if (claimsRes.success) setClaimsCount(claimsRes.data.claims.length);
            } catch {}
          }
          // Check if current user has already claimed
          if (currentUser && response.data.item.type === 'found' && response.data.item.reportedBy?._id !== currentUser._id) {
            try {
              const myClaims = await itemService.getMyClaims();
              if (myClaims.success) {
                const existing = myClaims.data.claims.find(c => c.item._id === id && ['pending', 'approved'].includes(c.status));
                if (existing) setHasClaimed(true);
              }
            } catch {}
          }
          if (currentUser && response.data.item.status === 'claimed') {
            try {
              const chatsRes = await chatService.getConversations();
              if (chatsRes.success) {
                const chat = chatsRes.data.conversations.find(c => c.item._id === id);
                if (chat) setConversationId(chat._id);
              }
            } catch {}
          }
        } else {
          setError('Failed to fetch item details');
        }
      } catch {
        setError('Item not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, currentUser]);

  const isOwner = currentUser && item && (currentUser.id === item.reportedBy?._id || currentUser._id === item.reportedBy?._id);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await itemService.deleteItem(id);
      if (response.success) {
        navigate('/my-items');
      }
    } catch {
      alert('Error deleting item');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const response = await itemService.updateItemStatus(id, newStatus);
      if (response.success) {
        setItem({ ...item, status: newStatus });
      }
    } catch {
      alert('Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkReturned = async () => {
    if (!window.confirm('Are you sure this item has been physically returned to the owner?')) return;
    setIsUpdatingStatus(true);
    try {
      const response = await itemService.markItemReturned(id);
      if (response.success) {
        setItem(response.data.item);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking item as returned');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleClaimSuccess = () => {
    setShowClaimForm(false);
    setHasClaimed(true);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="card-saas p-6 sm:p-10 space-y-6">
          <div className="h-6 bg-slate-200 rounded-md w-32 animate-shimmer" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-72 bg-slate-200 rounded-2xl animate-shimmer" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded-md w-3/4 animate-shimmer" />
              <div className="h-4 bg-slate-200 rounded-md w-1/2 animate-shimmer" />
              <div className="h-20 bg-slate-100 rounded-xl animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-3xl mx-auto mb-4">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">{error || 'Item not found'}</h2>
        <p className="text-sm text-slate-500 mb-6">The requested item report may have been removed or does not exist.</p>
        <Link to="/items" className="btn-primary text-sm">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isLost = item.type === 'lost';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/items" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
          <span>←</span> Back to Items
        </Link>
        <span>/</span>
        <span className="text-slate-800 truncate max-w-xs">{item.title}</span>
      </div>

      {/* Main SaaS Details Card */}
      <div className="card-saas overflow-hidden bg-white mb-10 shadow-xs">
        
        {/* Top Header Bar */}
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {isLost ? (
                <span className="badge-lost">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Lost Report
                </span>
              ) : (
                <span className="badge-found">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Found Item
                </span>
              )}

              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                item.status === 'active' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80' 
                  : item.status === 'claimed'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {item.status}
              </span>

              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                {item.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {item.title}
            </h1>

            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{item.reportedBy?.name || 'Campus Student'}</span>
              <span>•</span>
              <span>Reported on {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {isOwner ? (
              <>
                {item.type === 'found' && claimsCount > 0 && (
                  <Link 
                    to={`/items/${item._id}/claims`}
                    className="btn-primary text-xs"
                  >
                    Review Claims ({claimsCount})
                  </Link>
                )}
                {item.type === 'found' && item.status === 'claimed' && (
                  <>
                    {conversationId && (
                      <Link 
                        to={`/messages/${conversationId}`}
                        className="btn-primary text-xs"
                      >
                        Chat with Claimant
                      </Link>
                    )}
                    <button 
                      onClick={handleMarkReturned}
                      disabled={isUpdatingStatus}
                      className="px-3.5 py-2 rounded-xl border border-indigo-600 text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 transition-all cursor-pointer"
                    >
                      Mark as Returned
                    </button>
                  </>
                )}
                {item.type === 'lost' && item.status === 'active' && (
                  <button 
                    onClick={() => handleStatusChange('resolved')}
                    disabled={isUpdatingStatus}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
                  >
                    Mark Resolved
                  </button>
                )}
                {item.type === 'lost' && item.status === 'resolved' && (
                  <button 
                    onClick={() => handleStatusChange('active')}
                    disabled={isUpdatingStatus}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Reopen Report
                  </button>
                )}
                <Link
                  to={`/items/${item._id}/edit`}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-xs"
                >
                  Edit
                </Link>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition-all cursor-pointer"
                >
                  Delete
                </button>
              </>
            ) : (
              item.type === 'found' && currentUser && (
                <>
                  {item.status === 'active' && (
                    hasClaimed ? (
                      <span className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Claim Pending Approval
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowClaimForm(true)}
                        className="btn-primary text-xs"
                      >
                        Claim This Item →
                      </button>
                    )
                  )}
                  {item.status === 'claimed' && conversationId && (
                    <Link
                      to={`/messages/${conversationId}`}
                      className="btn-primary text-xs"
                    >
                      Open Private Chat
                    </Link>
                  )}
                </>
              )
            )}
          </div>
        </div>

        {/* Claim Form Dropdown Drawer */}
        {showClaimForm && (
          <div className="border-b border-slate-200 bg-indigo-50/40 p-6 sm:p-8 anim-scale-in">
            <ClaimForm 
              itemId={item._id} 
              onSuccess={handleClaimSuccess}
              onCancel={() => setShowClaimForm(false)}
            />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="bg-rose-50 border-b border-rose-200 p-6 sm:p-8 anim-scale-in">
            <h4 className="text-base font-bold text-rose-900 mb-1">Delete this report?</h4>
            <p className="text-xs text-rose-700 mb-4 max-w-xl">
              This action cannot be undone. All associated potential matches and claim histories will be permanently removed.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Report'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Two-Column Detail Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
          
          {/* Left: High-Res Image Card */}
          <div className="rounded-2xl bg-slate-100 overflow-hidden border border-slate-200/80 flex items-center justify-center min-h-[300px] max-h-[460px] relative">
            <img 
              src={item.image?.url?.trim() || getPlaceholderImage(item.category)} 
              alt={item.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getPlaceholderImage(item.category);
              }}
              className="w-full h-full object-contain max-h-[440px]"
              loading="lazy"
            />
          </div>

          {/* Right: Key Attributes Grid */}
          <div className="space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Item Overview</h3>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap bg-slate-50/80 p-4 rounded-2xl border border-slate-100 mb-6">
                {item.description || 'No detailed description provided.'}
              </p>

              {/* Metadata Attribute Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Location */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {isLost ? 'Last Seen Location' : 'Found Location'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                    <span className="text-base">📍</span>
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>

                {/* Date */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {isLost ? 'Date Lost' : 'Date Found'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                    <span className="text-base">📅</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Color */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Color
                  </span>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                    <span className="text-base">🎨</span>
                    <span>{item.color || 'Not specified'}</span>
                  </div>
                </div>

                {/* Brand */}
                <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Brand / Manufacturer
                  </span>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                    <span className="text-base">🏷️</span>
                    <span>{item.brand || 'Unbranded'}</span>
                  </div>
                </div>

              </div>

              {/* Identifying Details Box (only visible to owner or verified users) */}
              {item.identifyingDetails && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70">
                  <div className="flex items-center gap-2 mb-1 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <span>🔒</span> Confidential Identifying Features
                  </div>
                  <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                    {item.identifyingDetails}
                  </p>
                </div>
              )}
            </div>

            {/* Safety Notice Footer */}
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-800">
              <span className="text-lg">🛡️</span>
              <p>For your safety, coordinate all exchanges in public campus areas such as library lobbies or student union desks.</p>
            </div>

          </div>

        </div>

      </div>

      {/* AI Smart Matching Engine Section */}
      <div className="card-saas p-6 sm:p-8 bg-white shadow-xs">
        <PotentialMatches itemId={id} isOwner={isOwner} />
      </div>

    </div>
  );
};

export default ItemDetails;
