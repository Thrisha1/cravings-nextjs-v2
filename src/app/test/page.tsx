"use client";
// import { useCategoryStore } from "@/store/categoryStore";
// import { menuCatagories } from "@/store/menuStore";
import React from "react";

const TestPage = () => {
  // const { categories, addCategory, fetchCategories } = useCategoryStore();

  // const addCategories = async () => {
  //   try {
  //     menuCatagories.forEach(async (category) => {
  //       await addCategory(category);
  //     });
  //   } catch (error) {
  //     console.error("Error adding categories:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchCategories();
  // }, []);

  return (
    <div>
      {/* <button onClick={addCategories}>add categories</button>
      <ul>
        {categories.map((category) => (
          <li key={category.id}>{category.name}</li>
        ))}
      </ul> */}
    </div>
  );
};

export default TestPage;
