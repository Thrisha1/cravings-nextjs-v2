"use client";

import React, { useEffect } from 'react';
import { useMenuStore } from '@/store/menuStore_hasura'; // Assuming this is your store path

const MenuDisplay = () => {
  // 1. Get the state and the fetch function from your Zustand store
  const { groupedItems, fetchMenu } = useMenuStore();

  // 2. Use useEffect to fetch data when the component mounts
  useEffect(() => {
    // This function will be called once after the initial render
    fetchMenu();
  }, [fetchMenu]); // Dependency array ensures this runs only when fetchMenu changes (typically only once)

  // 3. Add a loading state for when data is not yet available
  if (!groupedItems) {
    return (
        <div className="text-center p-10">
            <p className="text-gray-500">Loading menu...</p>
        </div>
    );
  }

  // 4. Once data is loaded, use Object.entries to map and render it
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Menu Categories</h1>
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-2xl font-semibold capitalize text-blue-600">{category}</h2>
            <ul className="mt-2 list-disc list-inside">
              {items.map(item => (
                <li key={item.id} className="text-gray-700">
                  {item.name} - ${item.price}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuDisplay;