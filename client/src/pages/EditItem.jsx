import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import itemService from '../services/itemService';
import ItemForm from '../components/ItemForm';

const EditItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await itemService.getItemById(id);
        if (response.success) {
          setItem(response.data.item);
        } else {
          setError('Failed to fetch item');
        }
      } catch (err) {
        setError('Item not found or you do not have permission.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading item...</div>;
  if (error) return <div className="text-center py-20 text-red-600">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Edit Item</h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Update the details of your {item.type} report.
        </p>
      </div>
      <ItemForm initialData={item} isEdit={true} />
    </div>
  );
};

export default EditItem;
