"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MenuItemCard } from "@/components/bulkMenuUpload/MenuItemCard";
import { EditItemModal } from "@/components/bulkMenuUpload/EditItemModal";
import { useBulkUpload } from "@/hooks/useBulkUpload";
import { useAuthStore } from "@/store/authStore";
import { KimiAiLink } from "@/components/ui/KimiAiLink";


const BulkUploadPage = () => {
  const router = useRouter();
  const { userData } = useAuthStore();
  const {
    jsonInput,
    menuItems,
    selectAll,
    isEditModalOpen,
    isUploading,
    isBulkUploading,
    editingItem,
    setJsonInput,
    handleJsonSubmit,
    handleClear,
    handleAddToMenu,
    handleDelete,
    handleSelectAll,
    handleSelectItem,
    handleUploadSelected,
    handleEdit,
    handleSaveEdit,
    handleImageClick,
    setIsEditModalOpen,
    setEditingItem,
    handleCategoryChange,
    handleGenerateImages,
    handlePartialImageGeneration,
    handleGenerateAIImages,
  } = useBulkUpload();

  const isAIGenerateEnabled = Array.isArray(menuItems) && menuItems.length > 0 && 'image_prompt' in menuItems[0];

  useEffect(() => {
    // console.log("Menu Items:", menuItems);
    
  },[menuItems]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Menu Upload</h1>
        </div>

        <div className="space-y-4">
          <KimiAiLink />
          <Textarea
            placeholder="Paste your JSON here..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="min-h-[200px]"
          />
        </div>

        <div className="flex gap-2">
          <Button
            className="text-[13px] w-full"
            onClick={handleJsonSubmit}
            disabled={!jsonInput.trim()}
          >
            {menuItems.length > 0 ? "Update JSON" : "Convert JSON"}
          </Button>

          {menuItems.length > 0 && (
            <>
              <Button
                className="text-[13px] w-full"
                variant="destructive"
                onClick={handleClear}
              >
                Clear All
              </Button>

              <Button
                className="text-[13px] w-full"
                onClick={() => handleUploadSelected(userData?.id as string)}
                disabled={isBulkUploading}
              >
                {isBulkUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Selected"
                )}
              </Button>
            </>
          )}
        </div>

        {menuItems.length > 0 && (
          <div className="mb-4 mt-5 flex items-center">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              id="selectAll"
            />
            <label htmlFor="selectAll" className="ml-2">
              Select All
            </label>
          </div>
        )}

        {menuItems.length > 0 && (
          <div className="flex space-x-4 py-4">
            <Button
              onClick={handleGenerateImages}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Generate Full Images
            </Button>
            <Button
              onClick={handlePartialImageGeneration}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Generate Partial Images
            </Button>
            <Button
              onClick={handleGenerateAIImages}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!isAIGenerateEnabled}
            >
              {isAIGenerateEnabled ? "Generate AI Images" : "No AI prompt found"}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => (
            <MenuItemCard
              key={index}
              item={item}
              index={index}
              isUploading={isUploading[index]}
              onSelect={() => handleSelectItem(index)}
              onAddToMenu={() =>
                handleAddToMenu(item, index, userData?.id as string)
              }
              onEdit={() => handleEdit(index, item)}
              onDelete={() => handleDelete(index)}
              onImageClick={(index, url) => handleImageClick(index, url)}
              onCategoryChange={(category) => handleCategoryChange(index, { name: category, priority: 0, id: item.category.id })}
            />
          ))}
        </div>
      </div>

      <EditItemModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        editingItem={editingItem}
        onSave={handleSaveEdit}
        onEdit={(field, value) =>
          setEditingItem(
            editingItem
              ? {
                  ...editingItem,
                  item: { ...editingItem.item, [field]: value },
                }
              : null
          )
        }
      />
    </div>
  );
};

export default BulkUploadPage;
