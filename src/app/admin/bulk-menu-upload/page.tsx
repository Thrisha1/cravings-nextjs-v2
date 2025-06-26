"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MenuItemCard } from "@/components/bulkMenuUpload/MenuItemCard";
import { EditItemModal } from "@/components/bulkMenuUpload/EditItemModal";
import { useBulkUpload } from "@/hooks/useBulkUpload";
import { useAuthStore } from "@/store/authStore";
import { KimiAiLink } from "@/components/ui/KimiAiLink";
import { useMenuStore } from "@/store/menuStore_hasura";
import { toast } from "sonner";
import { fetchFromHasura } from "@/lib/hasuraClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Debug logging function
const debugLog = (context: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[BulkUploadPage][${timestamp}][${context}] ${message}`);
  if (data !== undefined) {
    console.log(`[BulkUploadPage][${timestamp}][${context}] Data:`, data);
  }
};

const BulkUploadPage = () => {
  debugLog("Component", "BulkUploadPage component rendering");
  
  const router = useRouter();
  const { userData } = useAuthStore();
  const { items: menuItems, fetchMenu } = useMenuStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingMenu, setIsDeletingMenu] = useState(false);
  
  debugLog("AuthData", "User authentication data", { 
    userId: userData?.id,
    userRole: userData?.role 
  });

  const {
    loading,
    jsonInput,
    menuItems: bulkMenuItems,
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

  const isAIGenerateEnabled = Array.isArray(bulkMenuItems) && bulkMenuItems.length > 0 && 'image_prompt' in bulkMenuItems[0];

  debugLog("InitialState", "Initial component state", {
    bulkMenuItemsCount: bulkMenuItems.length,
    isAIGenerateEnabled,
    jsonInputLength: jsonInput.length,
    hasEditingItem: !!editingItem,
    isEditModalOpen,
    isBulkUploading,
    loading
  });

  useEffect(() => {
    debugLog("useEffect[bulkMenuItems]", "Bulk menu items changed", {
      itemCount: bulkMenuItems.length,
      isAIGenerateEnabled
    });
  },[bulkMenuItems]);

  const handleDeleteAllMenu = async () => {
    debugLog("handleDeleteAllMenu", "Delete all menu items initiated");
    
    if (!userData?.id) {
      debugLog("handleDeleteAllMenu", "Error: User data not found");
      toast.error("User data not found");
      return;
    }

    setIsDeletingMenu(true);
    debugLog("handleDeleteAllMenu", "Set deleting menu state to true");
    
    try {
      debugLog("handleDeleteAllMenu", "Preparing to delete menu items", { partnerId: userData.id });
      
      // Delete all menu items for the partner
      const deleteAllMenuMutation = `
        mutation DeleteAllMenu($partnerId: uuid!) {
          update_menu(
            where: {
              partner_id: {_eq: $partnerId},
              deletion_status: {_neq: 1}
            },
            _set: { deletion_status: 1 }
          ) {
            affected_rows
          }
        }
      `;

      const result = await fetchFromHasura(deleteAllMenuMutation, {
        partnerId: userData.id,
      });

      debugLog("handleDeleteAllMenu", "Delete menu result", { result });

      if (result?.update_menu?.affected_rows > 0) {
        debugLog("handleDeleteAllMenu", "Menu items deleted successfully", { 
          affectedRows: result.update_menu.affected_rows 
        });
        
        toast.success(`Successfully deleted ${result.update_menu.affected_rows} menu items`);
        // Refresh the menu to reflect changes
        await fetchMenu(userData.id, true);
        debugLog("handleDeleteAllMenu", "Menu refreshed after deletion");
      } else {
        debugLog("handleDeleteAllMenu", "No menu items found to delete");
        toast.info("No menu items found to delete");
      }
    } catch (error) {
      debugLog("handleDeleteAllMenu", "Error deleting menu", { error });
      console.error("Error deleting menu:", error);
      toast.error("Failed to delete menu items");
    } finally {
      setIsDeletingMenu(false);
      setShowDeleteDialog(false);
      debugLog("handleDeleteAllMenu", "Reset deletion states");
    }
  };

  debugLog("Render", "Rendering BulkUploadPage component");

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            onClick={() => {
              debugLog("Navigation", "User clicked back button");
              router.back();
            }} 
            className="p-2 sm:p-3"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bulk Menu Upload</h1>
        </div>

        <div className="space-y-4">
          <KimiAiLink />
          <Textarea
            placeholder="Paste your JSON here..."
            value={jsonInput}
            onChange={(e) => {
              debugLog("Input", "JSON input changed", { length: e.target.value.length });
              setJsonInput(e.target.value);
            }}
            className="min-h-[200px] text-base p-4"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 my-4">
          <Button
            className="text-[13px] w-full h-12"
            onClick={() => {
              debugLog("Button", "Convert/Update JSON button clicked", { 
                inputLength: jsonInput.length,
                hasExistingItems: bulkMenuItems.length > 0 
              });
              handleJsonSubmit();
            }}
            disabled={!jsonInput.trim()}
          >
            {bulkMenuItems.length > 0 ? "Update JSON" : "Convert JSON"}
          </Button>

          {bulkMenuItems.length > 0 && (
            <>
              <Button
                className="text-[13px] w-full h-12"
                variant="destructive"
                onClick={() => {
                  debugLog("Button", "Clear All button clicked");
                  handleClear();
                }}
              >
                Clear All
              </Button>

              <Button
                className="text-[13px] w-full h-12"
                onClick={() => {
                  debugLog("Button", "Upload Selected button clicked", { 
                    userId: userData?.id,
                    isBulkUploading 
                  });
                  handleUploadSelected(userData?.id as string);
                }}
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

          {/* Delete Menu Button */}
          <Button
            className="text-[13px] w-full h-12 bg-red-600 hover:bg-red-700 text-white"
            variant="destructive"
            onClick={() => {
              debugLog("Button", "Delete Menu button clicked");
              setShowDeleteDialog(true);
            }}
            disabled={isDeletingMenu}
          >
            {isDeletingMenu ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Menu
              </>
            )}
          </Button>
        </div>

        {bulkMenuItems.length > 0 && (
          <div className="mb-4 mt-5 flex items-center">
            <Checkbox
              checked={selectAll}
              onCheckedChange={() => {
                debugLog("Checkbox", "Select All checkbox toggled", { currentValue: selectAll });
                handleSelectAll();
              }}
              id="selectAll"
              className="h-5 w-5"
            />
            <label htmlFor="selectAll" className="ml-2 text-base">
              Select All
            </label>
          </div>
        )}

        {bulkMenuItems.length > 0 && (
          <div className="flex flex-wrap gap-2 py-4">
            <Button
              onClick={() => {
                debugLog("Button", "Generate Full Images button clicked", { loading });
                handleGenerateImages();
              }}
              className="bg-green-600 hover:bg-green-700 text-white h-12 text-sm sm:text-base flex-1"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate Full Images"}
            </Button>
            <Button
              onClick={() => {
                debugLog("Button", "Generate Partial Images button clicked", { loading });
                handlePartialImageGeneration();
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white h-12 text-sm sm:text-base flex-1"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate Partial Images"}
            </Button>
            <Button
              onClick={() => {
                debugLog("Button", "Generate AI Images button clicked", { 
                  loading, 
                  isAIGenerateEnabled 
                });
                handleGenerateAIImages();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white h-12 text-sm sm:text-base flex-1"
              disabled={loading || !isAIGenerateEnabled}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate AI Images"}
            </Button>
          </div>
        )}

        {bulkMenuItems.length > 0 && !isEditModalOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {bulkMenuItems.map((item, index) => (
              <MenuItemCard
                key={index}
                item={item}
                index={index}
                isUploading={isUploading[index]}
                onSelect={() => {
                  debugLog("MenuItemCard", `Item ${index} select toggled`, { 
                    itemName: item.name,
                    currentlySelected: item.isSelected
                  });
                  handleSelectItem(index);
                }}
                onAddToMenu={() => {
                  debugLog("MenuItemCard", `Add to menu for item ${index}`, { 
                    itemName: item.name,
                    userId: userData?.id
                  });
                  handleAddToMenu(item, index, userData?.id as string);
                }}
                onEdit={() => {
                  debugLog("MenuItemCard", `Edit item ${index}`, { itemName: item.name });
                  handleEdit(index, item);
                }}
                onDelete={() => {
                  debugLog("MenuItemCard", `Delete item ${index}`, { itemName: item.name });
                  handleDelete(index);
                }}
                onImageClick={(index, url) => {
                  debugLog("MenuItemCard", `Image clicked for item ${index}`, { 
                    itemName: item.name,
                    newImageUrl: url
                  });
                  handleImageClick(index, url);
                }}
                onCategoryChange={(category) => {
                  debugLog("MenuItemCard", `Category changed for item ${index}`, { 
                    itemName: item.name,
                    oldCategory: item.category?.name,
                    newCategory: category
                  });
                  handleCategoryChange(index, { name: category, priority: 0, id: item.category.id });
                }}
              />
            ))}
          </div>
        )}

        {isEditModalOpen && editingItem && (
          <div className="w-full max-w-2xl mx-auto">
            <EditItemModal
              isOpen={isEditModalOpen}
              onOpenChange={(isOpen) => {
                debugLog("EditItemModal", "Edit modal visibility changed", { isOpen });
                setIsEditModalOpen(isOpen);
              }}
              editingItem={editingItem}
              onSave={() => {
                debugLog("EditItemModal", "Save edit clicked", { 
                  itemIndex: editingItem.index,
                  itemName: editingItem.item.name
                });
                handleSaveEdit();
              }}
              onEdit={(field, value) => {
                debugLog("EditItemModal", `Field ${field} edited`, { 
                  itemIndex: editingItem.index,
                  field,
                  oldValue: editingItem.item[field],
                  newValue: value
                });
                setEditingItem(
                  editingItem
                    ? {
                        ...editingItem,
                        item: { ...editingItem.item, [field]: value },
                      }
                    : null
                );
              }}
            />
          </div>
        )}

        {/* Delete Menu Confirmation Dialog */}
        <AlertDialog 
          open={showDeleteDialog} 
          onOpenChange={(isOpen) => {
            debugLog("AlertDialog", "Delete confirmation dialog visibility changed", { isOpen });
            setShowDeleteDialog(isOpen);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Entire Menu</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all menu items for this restaurant? This action cannot be undone and will permanently remove all menu items from your restaurant.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                debugLog("AlertDialog", "Delete confirmation canceled");
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  debugLog("AlertDialog", "Delete confirmation confirmed");
                  handleDeleteAllMenu();
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Menu
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default BulkUploadPage;
