"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { useMenuStore } from "@/store/menuStore_hasura";
import React, { FormEvent, useEffect, useState } from "react";

const Page = () => {
  const { user, userData } = useAuthStore();
  const { addItem } = useMenuStore();

  const [formData, setFormData] = useState({
    name: "Chicken Biriyani",
    category_id: "787daa6f-d080-48f0-8298-6ae6c3f934e0",
    image_url:
      "https://image.pollinations.ai/prompt/burgers%20%20pizza%20%20biriyani%20frechfires?nologo=true&width=1920&height=1080&seed=402",
    image_source: "AI",
    partner_id: "397fd024-3044-40a7-be52-c82a03f07cbb",
    price: 200,
  });

  useEffect(() => {
    console.log("User: ", user);
    console.log("User Data: ", userData);
  }, [user, userData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await addItem(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
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
        <Label htmlFor="category_id" className="block mb-1">
          Category ID
        </Label>
        <Input
          type="text"
          id="category_id"
          name="category_id"
          value={formData.category_id}
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
        <Label htmlFor="partner_id" className="block mb-1">
          Partner ID
        </Label>
        <Input
          type="text"
          id="partner_id"
          name="partner_id"
          value={formData.partner_id}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
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
  );
};

export default Page;
