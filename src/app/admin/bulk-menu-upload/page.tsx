"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MenuItemCard } from "@/components/bulkMenuUpload/MenuItemCard";
import { EditItemModal } from "@/components/bulkMenuUpload/EditItemModal";
import Link from "next/link";
import { useBulkUpload } from "@/hooks/useBulkUpload";
import { useAuthStore } from "@/store/authStore";

const BulkUploadPage = () => {
  const router = useRouter();
  const { user } = useAuthStore();
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
  } = useBulkUpload();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Menu Upload</h1>
        </div>

        <div className="mb-8">
          <Link
            target="_blank"
            onClick={() => {
              navigator.clipboard.writeText(
                `extract the menuitems as json { name : string, price : number, description : string (create a short description), category : string (select the most appropriate category from the list ["Appetizers", "Main Course", "Desserts", "Beverages", "Snacks", "Breakfast", "Lunch", "Dinner", "Specials"])}`
              );
            }}
            className="underline text-sm py-2 text-blue-500 hover:text-blue-600 block text-right"
            href={"https://kimi.moonshot.cn/chat"}
          >
            Go to KIMI.ai {"(prompt is copied to clipboard)"} {"->"}
          </Link>

          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON menu items here..."
            className="min-h-[200px] mb-4"
          />
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
                  onClick={() => handleUploadSelected(user?.uid as string)}
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
        </div>

        {menuItems.length > 0 && (
          <div className="mb-4 flex items-center">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <MenuItemCard
              key={index}
              item={item}
              index={index}
              isUploading={isUploading[index]}
              onSelect={() => handleSelectItem(index)}
              onAddToMenu={() =>
                handleAddToMenu(item, index, user?.uid as string)
              }
              onEdit={() => handleEdit(index, item)}
              onDelete={() => handleDelete(index)}
              onImageClick={() => handleImageClick(index)}
              onCategoryChange={(category) =>
                handleCategoryChange(index, category)
              }
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
