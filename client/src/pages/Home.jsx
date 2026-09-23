import React from 'react';

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl mb-6">
          Lost2Found
        </h1>
        <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
          Smart Lost & Found Platform for Colleges
        </p>
        
        <div className="mt-10 flex justify-center gap-4">
          <button className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 shadow-sm transition">
            Report Lost Item
          </button>
          <button className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10 transition">
            Report Found Item
          </button>
        </div>
      </div>

      <div className="mt-20">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
            <h3 className="text-xl font-semibold mb-2">Report</h3>
            <p className="text-gray-500">Easily log any item you have lost or found on campus with our intuitive form.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
            <h3 className="text-xl font-semibold mb-2">Match</h3>
            <p className="text-gray-500">Our system helps match reported lost items with found items efficiently.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
            <h3 className="text-xl font-semibold mb-2">Return</h3>
            <p className="text-gray-500">Connect securely and coordinate the return of the item.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
