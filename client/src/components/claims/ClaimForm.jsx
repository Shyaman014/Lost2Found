import React, { useState } from 'react';
import itemService from '../../services/itemService';

const ClaimForm = ({ itemId, onSuccess, onCancel }) => {
  const [message, setMessage] = useState('');
  const [specificDetails, setSpecificDetails] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddDetail = () => {
    if (specificDetails.length < 10) {
      setSpecificDetails([...specificDetails, '']);
    }
  };

  const handleRemoveDetail = (index) => {
    const newDetails = specificDetails.filter((_, i) => i !== index);
    if (newDetails.length === 0) newDetails.push('');
    setSpecificDetails(newDetails);
  };

  const handleDetailChange = (index, value) => {
    const newDetails = [...specificDetails];
    newDetails[index] = value;
    setSpecificDetails(newDetails);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const filteredDetails = specificDetails.filter(d => d.trim() !== '');
    if (filteredDetails.length === 0) {
      setError('Please provide at least one specific identifying detail.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Please provide a message of at least 10 characters explaining why you are claiming this item.');
      return;
    }

    setLoading(true);
    try {
      const res = await itemService.createClaim(itemId, {
        message: message.trim(),
        specificDetails: filteredDetails,
      });
      if (res.success) {
        onSuccess(res.data.claim);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit claim.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Claim This Item</h3>
      <p className="text-sm text-gray-500 mb-6">
        Only submit a claim if you genuinely believe this item belongs to you. The finder will review your evidence.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Why do you believe this item is yours?
          </label>
          <textarea
            required
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="I lost my calculator in the library yesterday..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specific Identifying Details (Evidence)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Mention things like scratches, unique marks, serial numbers, or items inside a bag.
          </p>
          <div className="space-y-2">
            {specificDetails.map((detail, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  required={index === 0}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. Scratch near the right display edge"
                  value={detail}
                  onChange={(e) => handleDetailChange(index, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDetail(index)}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {specificDetails.length < 10 && (
            <button
              type="button"
              onClick={handleAddDetail}
              className="mt-2 text-sm text-indigo-600 font-medium hover:text-indigo-800"
            >
              + Add another detail
            </button>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClaimForm;
