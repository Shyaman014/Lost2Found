import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import itemService from '../services/itemService';
import ItemCard from '../components/ItemCard';

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await itemService.getItems();
        if (response.success) {
          setItems(response.data.items);
        } else {
          setError('Failed to fetch items');
        }
      } catch (err) {
        setError('Error fetching items. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  if (loading) return <div className="text-center py-20">Loading items...</div>;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recent Items</h1>
          <p className="mt-2 text-sm text-gray-500">Currently active lost and found reports on campus.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active items</h3>
          <p className="mt-1 text-sm text-gray-500">No lost or found items have been reported yet.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/report-lost" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Report Lost Item
            </Link>
            <Link to="/report-found" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Report Found Item
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Items;
