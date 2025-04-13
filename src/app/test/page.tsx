"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthUser, useAuthStore } from "@/store/authStore";
import { useCategoryStore } from "@/store/categoryStore_hasura";
import { MenuItem, useMenuStore } from "@/store/menuStore_hasura";
import React, { FormEvent, useEffect, useState } from "react";

const Page = () => {
  const { userData } = useAuthStore();
  const { addItem, items, fetchMenu } = useMenuStore();

  const [formData, setFormData] = useState({
    name: "Chicken Biriyani",
    category: "hello world",
    image_url:
      "https://image.pollinations.ai/prompt/burgers%20%20pizza%20%20biriyani%20frechfires?nologo=true&width=1920&height=1080&seed=402",
    image_source: "AI",
    price: 200,
  });

  useEffect(() => {
    fetchMenu(userData?.id);
  }, [userData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await addItem(formData as unknown as MenuItem);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
        <div>
          <Label htmlFor="name" className="block mb-1">
            Name
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <Label htmlFor="category" className="block mb-1">
            Category
          </Label>
          <Input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <Label htmlFor="image_url" className="block mb-1">
            Image URL
          </Label>
          <Input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <Label htmlFor="image_source" className="block mb-1">
            Image Source
          </Label>
          <Input
            type="text"
            id="image_source"
            name="image_source"
            value={formData.image_source}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <Label htmlFor="price" className="block mb-1">
            Price
          </Label>
          <Input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
            min="0"
            step="0.01"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Submit
        </button>
      </form>

      <div>
        {items.map((item) => (
          <div key={item.id} className="p-4 border-b">
            <h2 className="text-lg font-bold">{item.name}</h2>
            <p>Category: {item.category}</p>
            <p>Price: {item.price}</p>
            <img src={item.image_url} alt={item.name} className="w-32 h-32" />
            <p>Image Source: {item.image_source}</p>
            <p>Partner ID: {item.partner_id}</p>
            <p>Item ID: {item.id}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default Page;
