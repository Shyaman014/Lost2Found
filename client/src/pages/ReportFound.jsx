import React from 'react';
import ItemForm from '../components/ItemForm';

const ReportFound = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Report Found Item</h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Thank you for helping! Provide details about the item you found.
        </p>
      </div>
      <ItemForm type="found" />
    </div>
  );
};

export default ReportFound;
