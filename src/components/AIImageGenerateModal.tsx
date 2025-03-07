"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { toast } from "sonner";
import { uploadFileToS3 } from "@/app/actions/aws-s3";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useMenuStore } from "@/store/menuStore";

interface AIImageGenerateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  category: string;
  addNewImage: (url: string) => void;
}

const AIImageGenerateModal: React.FC<AIImageGenerateModalProps> = ({
  isOpen,
  onOpenChange,
  itemName,
  category,
  addNewImage,
}) => {
  const [prompt, setPrompt] = useState(itemName);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving , setSaving] = useState(false);
  const { clearDishCache } = useMenuStore();

  const handleGenerateImage = async () => {
    setLoading(true);
    try {
      if (!prompt) {
        toast.error("Please enter a prompt!");
        setLoading(false);
        return;
      }
  
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setImageUrl(objectUrl);
      
      setGeneratedImage(imageUrl);
      toast.success("Image generated successfully!");
    } catch (error) {
      toast.error("Failed to generate image!");
      console.error("Error generating image:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveImage = async () => {
    if (!generatedImage) {
      toast.error("No image to save!");
      return;
    }
  
    setSaving(true);
    try {
      const sanitizedCategory = category.replace(/\s/g, "_").replace(/&/g, "_");
      const sanitizedItemName = itemName.replace(/\s/g, "_") + "_" + Date.now();
  
      const imgUrl = await uploadFileToS3(
        generatedImage,
        `dishes/${sanitizedCategory}/${sanitizedItemName}.jpg`
      );
  
      if (!imgUrl) {
        throw new Error("Failed to upload image to S3");
      }
  
      const dishesRef = collection(db, "dishes");
      await addDoc(dishesRef, {
        name: itemName,
        category: category,
        url: imgUrl,
        createdAt: new Date(),
      });
  
      clearDishCache();
      addNewImage(imgUrl);
      toast.success("Image saved successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving image:", error);
      toast.error("Failed to save image!");
    } finally {
      setSaving(false);
    }
  };
  
  

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate AI Image</DialogTitle>
        </DialogHeader>
        {imageUrl && (
          <div className="mb-4 flex justify-center">
            <Image
              src={imageUrl}
              alt="Generated AI"
              width={300}
              height={300}
              className="object-cover rounded-md"
            />
          </div>
        )}
        <input
          type="text"
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="border rounded p-2 w-full mb-4 bg-white"
        />
        <Button onClick={handleGenerateImage} disabled={loading || saving}>
          {loading ? "Generating..." : "Generate Image"}
        </Button>
        {generatedImage && (
          <Button disabled={saving || loading} onClick={handleSaveImage}>
            {saving ? "Saving..." : "Save Image"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIImageGenerateModal;
