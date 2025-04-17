import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
// import { getMenuItemImage } from "@/store/menuStore";
import Image from "next/image";
import { Loader2, Check, AlertCircle, Upload } from "lucide-react";
import AIImageGenerateModal from "@/components/AIImageGenerateModal";
// import ImageUploadModal from "../ImageUploadModal";
import { useMenuStore } from "@/store/menuStore_hasura";
import { DialogTitle } from "@radix-ui/react-dialog";

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
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [isAIImageModalOpen, setAIImageModalOpen] = useState(false);
  const { fetchCategorieImages } = useMenuStore();

  const fetchImages = async () => {

    
    if (isOpen && itemName && category) {
      setError(null);
      try {

        const menus = await fetchCategorieImages(category);
        const urls = menus.map((menu) => menu.image_url);
        setImageUrls(urls);
        setLoadingStates(
          urls.reduce((acc, url) => ({ ...acc, [url]: true }), {})
        );
      } catch (error) {
        console.error("Error fetching images:", error);
        setError("Failed to fetch images. Please try again.");
      }
    }
  };

  const addNewImage = (url: string) => {
    setImageUrls((prev: string[]) => [url, ...prev]);
    setLoadingStates((prev) => ({ ...prev, [url]: true }));
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);    
    addNewImage(blobUrl);

    return () => URL.revokeObjectURL(blobUrl);
  };

  const handleAiImageUpload = (url: string) => {
    addNewImage(url);
    setAIImageModalOpen(false);
  }

  useEffect(() => {
    fetchImages();
  }, [isOpen, itemName, category]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-4xl rounded-xl">
        <DialogTitle className="text-lg font-bold">Select Image</DialogTitle>
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
            <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
            <p className="text-red-600 text-center">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto p-1">
            <label
              htmlFor="image-upload"
              className="aspect-square cursor-pointer group bg-gray-100 rounded-md relative"
            >
              <div className="z-10 absolute grid place-items-center top-1/2 left-1/2 text-center -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
                <Upload className="w-8 h-8 " />
                Upload
              </div>
              <input
                type="file"
                id="image-upload"
                name="image-upload"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageUpload}
              />
            </label>

            <div
              className="aspect-square cursor-pointer group bg-gray-100 rounded-md relative"
              onClick={() => setAIImageModalOpen(true)}
            >
              <div className="z-10 absolute top-1/2 left-1/2 text-center -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
                AI Generate
              </div>
            </div>

            {imageUrls.map((url, index) => (
              <div
                key={url + index}
                className="relative aspect-square cursor-pointer group"
                onClick={() => onSelectImage(url)}
              >
                {loadingStates[url] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  </div>
                )}
                <Image
                  src={url}
                  alt={`Option ${index + 1}`}
                  fill
                  className="object-cover rounded-md"
                  onLoad={() =>
                    setLoadingStates((prev) => ({ ...prev, [url]: false }))
                  }
                  onError={() =>
                    setLoadingStates((prev) => ({ ...prev, [url]: false }))
                  }
                />
                {currentImage === url && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                    <div className="bg-white rounded-full p-2">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                )}
                <div
                  className={`absolute inset-0 transition-colors rounded-md ${
                    currentImage === url
                      ? "ring-2 ring-orange-500"
                      : "hover:bg-black/20"
                  }`}
                />
              </div>
            ))}
          </div>
        )}
      </DialogContent>

      <AIImageGenerateModal
        addNewImage={handleAiImageUpload}
        category={category}
        itemName={itemName}
        isOpen={isAIImageModalOpen}
        onOpenChange={setAIImageModalOpen}
      />

      {/* <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onOpenChange={setImageUploadModalOpen}
        addNewImage={addNewImage}
        category={category}
        itemName={itemName}
      /> */}
    </Dialog>
  );
}
