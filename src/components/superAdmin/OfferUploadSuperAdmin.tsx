// app/dashboard/items/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFileToS3 } from "@/app/actions/aws-s3";
import { processImage } from "@/lib/processImage";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { uploadCommonOffer } from "@/api/common_offers";

export interface CommonOffer {
  partner_name: string;
  item_name: string;
  price: number;
  location: string | null;
  description: string | null;
  insta_link: string | null;
  likes: number;
  image_url: string | null;
  id: string;
  district: string;
}

export default function OfferUploadSuperAdmin() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<CommonOffer>({
    partner_name: "",
    item_name: "",
    price: 0,
    location: "",
    description: "",
    insta_link: "",
    likes: 0,
    image_url: null,
    id: "",
    district: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setImagePreview(blobUrl);
      setFormData((prev) => ({
        ...prev,
        image_url: blobUrl,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let s3Url = null;

      // Upload image to S3 if exists
      if (formData.image_url) {
        const processedImage = await processImage(
          formData.image_url as string,
          `local`
        );

        s3Url = await uploadFileToS3(
          processedImage,
          `common_offers/${formData.item_name.replace(
            /\s+/g,
            "_"
          )}_${Date.now()}.webp`
        );
      }

      // Prepare item data for API
      const itemData = {
        ...formData,
        image_url: s3Url,
        location: formData.location || null,
        description: formData.description || null,
        insta_link: formData.insta_link || null,
      };

      const { id, ...payload } = itemData;

      await fetchFromHasura(uploadCommonOffer, {
        ...payload,
      });

      toast.success("Item created successfully!");
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Failed to create item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Partner Name */}
          <div>
            <Label
              htmlFor="partner_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Partner Name *
            </Label>
            <Input
              type="text"
              id="partner_name"
              name="partner_name"
              value={formData.partner_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus-visible:ring-orange-500"
            />
          </div>

          {/* Item Name */}
          <div>
            <Label
              htmlFor="item_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Item Name *
            </Label>
            <Input
              type="text"
              id="item_name"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus-visible:ring-orange-500"
            />
          </div>

          {/* Price */}
          <div>
            <Label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price *
            </Label>
            <Input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus-visible:ring-orange-500"
            />
          </div>

          {/* District */}
          <div>
            <Label
              htmlFor="district"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              District *
            </Label>
            <Input
              type="text"
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus-visible:ring-orange-500"
            />
          </div>

          {/* Location */}
          <div>
            <Label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location (optional)
            </Label>
            <Input
              type="text"
              id="location"
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus-visible:ring-orange-500"
            />
          </div>

          {/* Instagram Link */}
          <div>
            <Label
              htmlFor="insta_link"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Instagram Link (optional)
            </Label>
            <Input
              type="url"
              id="insta_link"
              name="insta_link"
              value={formData.insta_link || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus-visible:ring-orange-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <Label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (optional)
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus-visible:ring-orange-500"
          />
        </div>

        {/* Image Upload */}
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            Item Image (optional)
          </Label>
          <div className="mt-1 flex items-center">
            <Input
              id="image-upload"
              name="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="bg-white focus-visible:ring-orange-500"
            />
          </div>

          {imagePreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Image Preview:</p>
              <div className="w-64 h-64 border border-gray-200 rounded-md overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Item"}
          </Button>
        </div>
      </form>
    </div>
  );
}
