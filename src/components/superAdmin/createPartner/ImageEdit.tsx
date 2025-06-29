import React from "react";

interface MenuItem {
  image?: string;
  category?: string;
  description?: string;
  name: string;
  price: number;
  variants?: { name: string; price: number }[];
}

const ImageEdit = ({
  item,
  editedItem,
  generatedImages,
}: {
  item: Partial<MenuItem>;
  generatedImages: Record<string, string>;
  editedItem: Partial<MenuItem>;
}) => {
  return (
    <>
        <div>
          <img
            src={item.name ? generatedImages[item.name] : editedItem.image}
            alt={item.name}
            className="w-full h-full object-cover rounded-md"
          />
        </div>
     
    </>
  );
};

export default ImageEdit;
