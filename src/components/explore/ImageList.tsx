"use client";
// src/components/ImageList.tsx
import React, { useState } from "react";
import ImageReel from "./ImageReel";

const ImageList = ({ images }: { images: string[] }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  const openReel = (index: number) => {
    setSelectedImageIndex(index);
    document.body.style.overflow = "hidden"; // Prevent background scroll
  };

  const closeReel = () => {
    setSelectedImageIndex(null);
    document.body.style.overflow = "auto"; // Restore background scroll
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-2">
        {images.map((image, index) => (
          <div
            key={index}
            onClick={() => openReel(index)}
            className="relative cursor-pointer aspect-[4/5] overflow-hidden rounded-lg group"
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
          </div>
        ))}
      </div>

      {selectedImageIndex !== null && (
        <ImageReel
          images={images}
          selectedIndex={selectedImageIndex}
          onClose={closeReel}
        />
      )}
    </div>
  );
};

export default ImageList;