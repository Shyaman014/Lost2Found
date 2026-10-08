import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { currentUser, updateProfile } = useContext(AuthContext);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    college: currentUser?.college || '',
    studentId: currentUser?.studentId || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(currentUser?.profileImage || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Synchronize form and image preview when currentUser updates
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        college: currentUser.college || '',
        studentId: currentUser.studentId || '',
      });
      if (!isEditing) {
        setImagePreview(currentUser.profileImage || null);
      }
    }
  }, [currentUser, isEditing]);

  if (!currentUser) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('college', formData.college);
      data.append('studentId', formData.studentId);
      if (imageFile) {
        data.append('profileImage', imageFile);
      }

      const res = await updateProfile(data);
      if (res.success) {
        setSuccess(true);
        setIsEditing(false);
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during update');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: currentUser.name || '',
      college: currentUser.college || '',
      studentId: currentUser.studentId || '',
    });
    setImagePreview(currentUser.profileImage || null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
          {/* Cover Photo / Gradient Background */}
          <div className="h-32 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="px-8 pb-8 relative">
            {/* Avatar */}
            <div className="flex justify-between items-end -mt-12 mb-6">
              <div className="relative group">
                <div className="h-24 w-24 rounded-2xl bg-white p-1.5 shadow-lg border border-slate-100 relative">
                  {/* View mode: read directly from currentUser */}
                  {/* Edit mode: show preview if available */}
                  {isEditing ? (
                    imagePreview ? (
                      <img src={imagePreview} alt={currentUser.name} className="h-full w-full object-cover rounded-xl" />
                    ) : currentUser.profileImage ? (
                      <img src={currentUser.profileImage} alt={currentUser.name} className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      <div className="h-full w-full rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-4xl uppercase">
                        {currentUser.name.charAt(0)}
                      </div>
                    )
                  ) : currentUser.profileImage ? (
                    <img src={currentUser.profileImage} alt={currentUser.name} className="h-full w-full object-cover rounded-xl" />
                  ) : (
                    <div className="h-full w-full rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-4xl uppercase">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-1.5 bg-black/45 hover:bg-black/60 rounded-xl flex flex-col items-center justify-center text-white transition-opacity cursor-pointer backdrop-blur-[2px]"
                      title="Upload new profile picture"
                    >
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span className="text-xs font-semibold">Change</span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                {isEditing && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      {imageFile ? 'Change photo' : 'Upload photo'}
                    </button>
                    {imageFile && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5 truncate max-w-[180px]">
                        ✓ Selected: {imageFile.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit Profile
                </button>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Profile updated successfully!
              </div>
            )}

            {!isEditing ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{currentUser.name}</h1>
                  <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {currentUser.email}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">College</h3>
                    </div>
                    <p className="text-slate-900 font-medium">{currentUser.college || 'Not specified'}</p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center gap-3 text-slate-400 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Student ID</h3>
                    </div>
                    <p className="text-slate-900 font-medium">{currentUser.studentId || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Account Role: <span className="capitalize font-bold">{currentUser.role}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="college" className="block text-sm font-semibold text-slate-700 mb-1">College/University</label>
                    <input
                      type="text"
                      id="college"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="studentId" className="block text-sm font-semibold text-slate-700 mb-1">Student ID</label>
                    <input
                      type="text"
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all shadow-md shadow-indigo-200 disabled:opacity-70 flex items-center justify-center min-w-[120px]"
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={loading}
                    className="px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-70"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
