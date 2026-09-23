import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import itemService from '../services/itemService';
import { AuthContext } from '../context/AuthContext';
import PotentialMatches from '../components/items/PotentialMatches';
import ClaimForm from '../components/claims/ClaimForm';
import chatService from '../services/chatService';

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
            } catch (e) {}
          }
          // Check if current user has already claimed
          if (currentUser && response.data.item.type === 'found' && response.data.item.reportedBy?._id !== currentUser._id) {
            try {
              const myClaims = await itemService.getMyClaims();
              if (myClaims.success) {
                const existing = myClaims.data.claims.find(c => c.item._id === id && ['pending', 'approved'].includes(c.status));
                if (existing) setHasClaimed(true);
              }
            } catch (e) {}
          }
          if (currentUser && response.data.item.status === 'claimed') {
            try {
              const chatsRes = await chatService.getConversations();
              if (chatsRes.success) {
                const chat = chatsRes.data.conversations.find(c => c.item._id === id);
                if (chat) setConversationId(chat._id);
              }
            } catch (e) {}
          }
        } else {
          setError('Failed to fetch item details');
        }
      } catch (err) {
        setError('Item not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const isOwner = currentUser && item && currentUser.id === item.reportedBy?._id;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await itemService.deleteItem(id);
      if (response.success) {
        navigate('/my-items');
      }
    } catch (err) {
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
    } catch (err) {
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

  if (loading) return <div className="text-center py-20">Loading item...</div>;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;
  if (!item) return <div className="text-center py-20">Item not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white shadow-sm overflow-hidden sm:rounded-lg border border-gray-200">
        
        {item.image && (
          <div className="w-full h-64 sm:h-96 bg-gray-100 overflow-hidden relative">
            <img 
              src={item.image.url} 
              alt={`${item.title} reported as ${item.type}`}
              className="w-full h-full object-contain bg-black/5"
            />
          </div>
        )}

        <div className="px-4 py-5 sm:px-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${item.type === 'lost' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {item.type}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${item.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-800 text-white'}`}>
                {item.status}
              </span>
            </div>
            <h3 className="text-2xl leading-6 font-bold text-gray-900">{item.title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Reported by {item.reportedBy?.name || 'Unknown'} on {new Date(item.createdAt).toLocaleDateString()}</p>
          </div>
          
          {isOwner && (
            <div className="flex gap-2 flex-wrap">
              {item.type === 'found' && claimsCount > 0 && (
                <Link 
                  to={`/items/${item._id}/claims`}
                  className="px-3 py-1.5 border border-transparent text-sm font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
                >
                  View Claims ({claimsCount})
                </Link>
              )}
              {item.type === 'found' && item.status === 'claimed' && (
                <>
                  {conversationId && (
                    <Link 
                      to={`/messages/${conversationId}`}
                      className="px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                      Chat with Claimant
                    </Link>
                  )}
                  <button 
                    onClick={handleMarkReturned}
                    disabled={isUpdatingStatus}
                    className="px-3 py-1.5 border border-indigo-600 text-sm font-medium rounded text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none"
                  >
                    Mark as Returned
                  </button>
                </>
              )}
              {item.type === 'lost' && item.status === 'active' && (
                <button 
                  onClick={() => handleStatusChange('resolved')}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                >
                  Mark Resolved
                </button>
              )}
              {item.type === 'lost' && item.status === 'resolved' && (
                <button 
                  onClick={() => handleStatusChange('active')}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Mark Active
                </button>
              )}
              <Link to={`/items/${item._id}/edit`} className="px-3 py-1.5 border border-indigo-600 text-sm font-medium rounded text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none">
                Edit
              </Link>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none"
              >
                Delete
              </button>
            </div>
          )}

          {!isOwner && item.type === 'found' && currentUser && (
            <div>
              {item.status === 'active' && (
                hasClaimed ? (
                  <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">
                    Claim Pending
                  </span>
                ) : (
                  <button
                    onClick={() => setShowClaimForm(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                  >
                    Claim This Item
                  </button>
                )
              )}
              {item.status === 'claimed' && conversationId && (
                <Link
                  to={`/messages/${conversationId}`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 inline-block"
                >
                  Open Chat
                </Link>
              )}
            </div>
          )}
        </div>
        
        {showClaimForm && (
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <ClaimForm 
              itemId={item._id} 
              onSuccess={handleClaimSuccess}
              onCancel={() => setShowClaimForm(false)}
            />
          </div>
        )}
        
        {showDeleteConfirm && (
          <div className="bg-red-50 p-4 border-t border-b border-red-200">
            <p className="text-red-800 text-sm font-medium mb-3">Are you sure you want to delete this report? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={isDeleting} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{item.description}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">{item.category}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">{item.type === 'lost' ? 'Lost Location' : 'Found Location'}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{item.location}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">{item.type === 'lost' ? 'Date Lost' : 'Date Found'}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(item.date).toLocaleDateString()} {item.time && `at ${item.time}`}
              </dd>
            </div>
            
            {(item.color || item.brand) && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Item Details</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {item.color && (
                      <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <span className="w-0 flex-1 flex items-center">Color: {item.color}</span>
                      </li>
                    )}
                    {item.brand && (
                      <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <span className="w-0 flex-1 flex items-center">Brand: {item.brand}</span>
                      </li>
                    )}
                  </ul>
                </dd>
              </div>
            )}
            
            {item.identifyingDetails && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Identifying Features</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{item.identifyingDetails}</dd>
              </div>
            )}

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Contact Preference</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {item.contactPreference === 'in_app' ? 'In-App Messaging' : 'Email'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* AI Matching Section */}
      <PotentialMatches itemId={id} isOwner={isOwner} />
    </div>
  );
};

export default ItemDetails;
