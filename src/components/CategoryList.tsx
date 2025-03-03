"use client";

import React from "react";
import CATEGORIES from "@/data/CATEGORIES.json";
import { useRouter } from "next/navigation";

const CategoryList = ({ hotelId }: { hotelId: string }) => {
  const router = useRouter();
  const handleCategoryClick = (categoryId: number) => {
    router.push(`/hotels/${hotelId}/categories/${categoryId}`);
  };

  return (
    <div className="mt-10">
      <h1 className="text-3xl font-bold text-center">Menu Categories</h1>
      <div className="grid grid-cols-2 mt-5 lg:grid-cols-4 gap-4 justify-items-center">
        {CATEGORIES.map(category => (
          <div
            key={category.id}
            className="p-4 group rounded-full cursor-pointer flex flex-col items-center justify-center"
            onClick={() => handleCategoryClick(category.id)}
          >
            <img src={category.image} alt={category.name} className="w-32 h-32 drop-shadow-lg drop-shadow-black object-cover group-hover:scale-110 transition-all duration-300" />
            <h2 className="font-semibold text-center">{category.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;