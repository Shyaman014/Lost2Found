import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import itemService from '../services/itemService';

const ItemForm = ({ type, initialData = null, isEdit = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    date: '',
    time: '',
    color: '',
    brand: '',
    identifyingDetails: '',
    contactPreference: 'in_app',
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || '',
        location: initialData.location || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        time: initialData.time || '',
        color: initialData.color || '',
        brand: initialData.brand || '',
        identifyingDetails: initialData.identifyingDetails || '',
        contactPreference: initialData.contactPreference || 'in_app',
      });
      if (initialData.image) {
        setExistingImage(initialData.image);
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image (JPG, PNG, WEBP).');
        return;
      }
      
      // Validate size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB.');
        return;
      }
      
      setError('');
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleRemoveExistingImage = async () => {
    if (!initialData?._id) return;
    setIsRemovingImage(true);
    try {
      const response = await itemService.removeImage(initialData._id);
      if (response.success) {
        setExistingImage(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove image');
    } finally {
      setIsRemovingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = { ...formData, type: type || initialData?.type };
      if (imageFile) {
        payload.image = imageFile;
      }
      
      let response;
      if (isEdit) {
        response = await itemService.updateItem(initialData._id, payload);
      } else {
        response = await itemService.createItem(payload);
      }

      if (response.success) {
        const itemId = isEdit ? initialData._id : response.data._id;
        navigate(`/items/${itemId}`);
      } else {
        setError(response.message || 'An error occurred');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    'electronics', 'documents', 'wallet', 'keys', 'bags',
    'clothing', 'books', 'stationery', 'jewelry', 'accessories', 'other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Image Upload Section */}
        <div className="md:col-span-2 p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
          
          {existingImage && !imagePreview ? (
            <div className="flex flex-col items-start gap-3">
              <div className="relative">
                <img src={existingImage.url} alt="Current item" className="h-40 w-auto rounded object-cover shadow-sm" />
              </div>
              <button
                type="button"
                onClick={handleRemoveExistingImage}
                disabled={isRemovingImage}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                {isRemovingImage ? 'Removing...' : 'Remove Image'}
              </button>
              <p className="text-xs text-gray-500 mt-2">To replace, select a new image below.</p>
            </div>
          ) : imagePreview ? (
            <div className="flex flex-col items-start gap-3">
              <img src={imagePreview} alt="Preview" className="h-40 w-auto rounded object-cover shadow-sm" />
              <button
                type="button"
                onClick={clearImageSelection}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel Selection
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-2">Optional. Upload a photo to help identify the item.</p>
            </div>
          )}
          
          <div className="mt-4">
            <input
              type="file"
              accept="image/jpeg, image/jpg, image/png, image/webp"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP. Max 5MB.</p>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={`E.g. Black Casio Calculator`}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description *</label>
          <textarea
            name="description"
            required
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Detailed description of the item"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category *</label>
          <select
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm capitalize"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Location *</label>
          <input
            type="text"
            name="location"
            required
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={type === 'lost' ? "Where did you lose it?" : "Where did you find it?"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date *</label>
          <input
            type="date"
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Time (Approximate)</label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Brand</label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Color</label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Identifying Details</label>
          <input
            type="text"
            name="identifyingDetails"
            value={formData.identifyingDetails}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="E.g. Scratches, stickers, serial numbers"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Contact Preference *</label>
          <select
            name="contactPreference"
            required
            value={formData.contactPreference}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="in_app">In App</option>
            <option value="email">Email</option>
          </select>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Saving...' : (isEdit ? 'Update Item' : 'Submit Report')}
        </button>
      </div>
    </form>
  );
};

export default ItemForm;
