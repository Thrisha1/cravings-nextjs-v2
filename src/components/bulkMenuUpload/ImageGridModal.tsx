import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { getMenuItemImage } from "@/store/menuStore";
import Image from "next/image";
import { Loader2, Check, AlertCircle } from "lucide-react";

interface ImageGridModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  category: string;
  currentImage: string;
  onSelectImage: (url: string) => void;
}

export function ImageGridModal({
  isOpen,
  onOpenChange,
  itemName,
  category,
  currentImage,
  onSelectImage,
}: ImageGridModalProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (isOpen && itemName && category) {
        setIsLoading(true);
        setError(null);
        try {
          const urls = await getMenuItemImage(category, itemName);
          if (urls.length === 0) {
            setError(`No images found for "${itemName}" in category "${category}"`);
          }
          setImageUrls(urls);
        } catch (error) {
          console.error("Error fetching images:", error);
          setError("Failed to fetch images. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchImages();
  }, [isOpen, itemName, category]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-4xl rounded-xl">
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
            <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
            <p className="text-red-600 text-center">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto p-1">
            {imageUrls.map((url, index) => (
              <div
                key={index}
                className="relative aspect-square cursor-pointer group"
                onClick={() => onSelectImage(url)}
              >
                <Image
                  src={url}
                  alt={`Option ${index + 1}`}
                  fill
                  className="object-cover rounded-md"
                />
                {currentImage === url && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                    <div className="bg-white rounded-full p-2">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                )}
                <div 
                  className={`absolute inset-0 transition-colors rounded-md
                    ${currentImage === url 
                      ? 'ring-2 ring-orange-500' 
                      : 'hover:bg-black/20'
                    }`}
                />
                {isLoading && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-1 rounded-b-md">
                    <Loader2 className="w-4 h-4 inline-block animate-spin mr-2" />
                    Loading...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 