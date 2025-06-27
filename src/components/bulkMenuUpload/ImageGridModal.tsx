import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Loader2, Check, AlertCircle, Upload, ClipboardPaste, Image as ImageIcon } from "lucide-react";
import AIImageGenerateModal from "@/components/AIImageGenerateModal";
import { useMenuStore } from "@/store/menuStore_hasura";
import { DialogTitle } from "@radix-ui/react-dialog";
import Img from "../Img";
import axios from "axios";
import { toast } from "sonner";

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
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isAIImageModalOpen, setAIImageModalOpen] = useState(false);
  const [isImageGenerateModalOpen, setImageGenerateModalOpen] = useState(false);
  const [pasteStatus, setPasteStatus] = useState<"idle" | "loading" | "error">("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const { fetchCategorieImages } = useMenuStore();
  const dialogRef = useRef<HTMLDivElement>(null);

  const fetchImages = async () => {
    if (isOpen && itemName && category) {
      setError(null);
      try {
        const menus = await fetchCategorieImages(category);
        const urls = menus.map((menu) => menu.image_url);
        setImageUrls(urls);
        setLoadingStates(urls.reduce((acc, url) => ({ ...acc, [url]: true }), {}));
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const blobUrl = URL.createObjectURL(file);
    addNewImage(blobUrl);
  };

  const handlePaste = async (e: ClipboardEvent) => {
    if (!isOpen) return;
    
    setPasteStatus("loading");
    try {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            addNewImage(blobUrl);
            setPasteStatus("idle");
            return;
          }
        }
      }
      setPasteStatus("error");
      setTimeout(() => setPasteStatus("idle"), 2000);
    } catch (error) {
      console.error("Paste error:", error);
      setPasteStatus("error");
      setTimeout(() => setPasteStatus("idle"), 2000);
    }
  };

  const handleAiImageUpload = (url: string) => {
    addNewImage(url);
    setAIImageModalOpen(false);
  };

  const handleImageGenerate = async () => {
    if (!category || !itemName) {
      toast.error("Category and item name are required");
      return;
    }
    
    setIsGenerating(true);
    try {
      // Create a single item object with the current item data
      const item = {
        name: itemName,
        category: category,
      };
      
      // Make API call to generate image
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/image-gen/fullImages`,
        [item],
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const generatedItem = response.data[0];
        if (generatedItem.image) {
          // Add the generated image to the grid
          addNewImage(generatedItem.image);
          toast.success("Image generated successfully!");
        } else {
          toast.error("No image was generated");
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [isOpen, itemName, category]);

  useEffect(() => {
    if (!isOpen) return;

    const dialogElement = dialogRef.current;
    if (!dialogElement) return;

    // Add paste event listener when modal is open
    dialogElement.addEventListener("paste", handlePaste as unknown as EventListener);
    
    return () => {
      // Clean up event listener when modal closes or unmounts
      dialogElement.removeEventListener("paste", handlePaste as unknown as EventListener);
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[90%] sm:max-w-4xl rounded-xl"
        ref={dialogRef}
      >
        <DialogTitle className="text-lg font-bold">Select Images</DialogTitle>
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
            <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
            <p className="text-red-600 text-center">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto p-1">
            {/* Upload Button */}
            <label
              htmlFor="image-upload"
              className="aspect-square cursor-pointer group bg-gray-100 rounded-md relative"
            >
              <div className="z-10 absolute grid place-items-center top-1/2 left-1/2 text-center -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
                <Upload className="w-8 h-8" />
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

            {/* AI Generate Button */}
            <div
              className="aspect-square cursor-pointer group bg-gray-100 rounded-md relative"
              onClick={() => setAIImageModalOpen(true)}
            >
              <div className="z-10 absolute grid place-items-center top-1/2 left-1/2 text-center -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
                AI Generate
              </div>
            </div>

            {/* Paste Button */}
            <div
              className="aspect-square cursor-pointer group bg-gray-100 rounded-md relative"
              onClick={() => {
                navigator.clipboard.read().then((clipboardItems) => {
                  setPasteStatus("loading");
                  let foundImage = false;
                  
                  for (const clipboardItem of clipboardItems) {
                    for (const type of clipboardItem.types) {
                      if (type.startsWith("image/")) {
                        clipboardItem.getType(type).then((blob) => {
                          const blobUrl = URL.createObjectURL(blob);
                          addNewImage(blobUrl);
                          setPasteStatus("idle");
                          foundImage = true;
                        });
                        return;
                      }
                    }
                  }
                  
                  if (!foundImage) {
                    setPasteStatus("error");
                    setTimeout(() => setPasteStatus("idle"), 2000);
                  }
                }).catch(() => {
                  setPasteStatus("error");
                  setTimeout(() => setPasteStatus("idle"), 2000);
                });
              }}
            >
              <div className="z-10 absolute grid place-items-center top-1/2 left-1/2 text-center -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
                {pasteStatus === "loading" ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : pasteStatus === "error" ? (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                ) : (
                  <>
                    <ClipboardPaste className="w-8 h-8" />
                    Paste
                  </>
                )}
              </div>
            </div>

            {/* Image Generate Button */}
            <div
              className="aspect-square cursor-pointer group bg-gray-100 rounded-md relative"
              onClick={handleImageGenerate}
            >
              <div className="z-10 absolute grid place-items-center top-1/2 left-1/2 text-center -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
                {isGenerating ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8" />
                    Image Generate
                  </>
                )}
              </div>
            </div>

            {/* Image Grid */}
            {imageUrls.map((url, index) => (
              <div
                key={url + index}
                className="relative aspect-square cursor-pointer group overflow-hidden"
                onClick={() => onSelectImage(url)}
              >
                {loadingStates[url] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  </div>
                )}
                <Img
                  src={url}
                  alt={`Option ${index + 1}`}
                  className="object-cover rounded-md w-full h-full"
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
      
      <AIImageGenerateModal 
        addNewImage={handleAiImageUpload}
        category={category}
        itemName={itemName}
        isOpen={isImageGenerateModalOpen}
        onOpenChange={setImageGenerateModalOpen}
      />
    </Dialog>
  );
}