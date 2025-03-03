"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import CATEGORIES from "@/data/CATEGORIES.json";
import { MenuItem } from "@/store/menuStore"; // Adjust the import based on your structure
// import OfferCardMin from "@/components/OfferCardMin";
import MenuItemCard from "@/components/MenuItemCard";
import CategoryList from "@/components/CategoryList";

interface Category {
  id: string;
  name: string;
  image: string;
}

const CategoryPage = () => {
  const params = useParams();
  const { id, categoryId } = params as { id: string; categoryId: string };
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      try {
        const menuQuery = query(
          collection(db, "menuItems"),
          where("hotelId", "==", id),
          where("category", "==", categoryId)
        );
        const menuSnapshot = await getDocs(menuQuery);
        const items = menuSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MenuItem[];
        setMenuItems(items);
      } catch (error) {
        console.error("Error fetching menu items:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      await fetchMenuItems();
      const selectedCategory = CATEGORIES.find(cat => cat.id.toString() === categoryId);
      setCategory(selectedCategory as unknown as Category);
    };
    fetchData();
  }, [id, categoryId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      

      <h1 className="text-2xl font-bold text-center mb-4">{category?.name}</h1>
      <div className={menuItems.length > 0 ? "grid grid-cols-2 lg:grid-cols-4 gap-4" : "flex justify-center items-center"}>
        {menuItems.length > 0 ? (
          menuItems.map(item => (
            <MenuItemCard key={item.id} menuItem={{ ...item, description: item.description || '' }} hotelId={id} />
          ))
        ) : (
          <p className="text-center text-sm text-gray-500">No menu items found for this category.</p>
        )}
      </div>


      <CategoryList hotelId={id} />

    </div>
  );
};

export default CategoryPage; 