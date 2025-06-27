"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, Loader2, Trash2, X } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Log type definition
interface ImageGenerationLog {
  id: string;
  timestamp: string;
  endpoint: string;
  requestData: any;
  responseData?: any;
  status: 'pending' | 'success' | 'error';
  itemName?: string;
  duration?: number;
}

const BulkUploadPage = () => {
  const router = useRouter();
  const { userData } = useAuthStore();
  const { items: menuItems, fetchMenu } = useMenuStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingMenu, setIsDeletingMenu] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const [logs, setLogs] = useState<ImageGenerationLog[]>([]);

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
    BATCH_SIZE,
  } = useBulkUpload();

  // Modified image generation functions that log information
  const handleGenerateImagesWithLogs = async () => {
    // Add initial log
    const logId = Date.now().toString();
    const newLog: ImageGenerationLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      endpoint: 'https://finally-enjoyed-oryx.ngrok-free.app/api/generate-image',
      requestData: { 
        items: bulkMenuItems.map(item => ({ 
          name: item.name, 
          description: item.description 
        }))
      },
      status: 'pending',
    };
    
    setLogs(prevLogs => [newLog, ...prevLogs]);
    
    const startTime = performance.now();
    
    try {
      // Call the original function
      await handleGenerateImages();
      
      // Update log with success
      const endTime = performance.now();
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === logId 
            ? {
                ...log, 
                status: 'success',
                duration: Math.round(endTime - startTime),
                responseData: { message: 'Images generated successfully' }
              } 
            : log
        )
      );
    } catch (error) {
      // Update log with error
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === logId 
            ? {
                ...log, 
                status: 'error',
                responseData: { error: error instanceof Error ? error.message : 'Unknown error' }
              } 
            : log
        )
      );
    }
  };

  const handlePartialImageGenerationWithLogs = async () => {
    const logId = Date.now().toString();
    const newLog: ImageGenerationLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      endpoint: 'https://finally-enjoyed-oryx.ngrok-free.app/api/generate-partial-images',
      requestData: { 
        batch: BATCH_SIZE,
        items: bulkMenuItems.map(item => ({ 
          name: item.name, 
          description: item.description 
        }))
      },
      status: 'pending',
    };
    
    setLogs(prevLogs => [newLog, ...prevLogs]);
    
    const startTime = performance.now();
    
    try {
      await handlePartialImageGeneration();
      
      const endTime = performance.now();
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === logId 
            ? {
                ...log, 
                status: 'success',
                duration: Math.round(endTime - startTime),
                responseData: { message: 'Partial images generated successfully' }
              } 
            : log
        )
      );
    } catch (error) {
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === logId 
            ? {
                ...log, 
                status: 'error',
                responseData: { error: error instanceof Error ? error.message : 'Unknown error' }
              } 
            : log
        )
      );
    }
  };

  const handleGenerateAIImagesWithLogs = async () => {
    const logId = Date.now().toString();
    const newLog: ImageGenerationLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      endpoint: 'https://finally-enjoyed-oryx.ngrok-free.app/api/generate-ai-images',
      requestData: { 
        items: bulkMenuItems.map(item => ({ 
          name: item.name, 
          description: item.description,
          imagePrompt: item.description
        }))
      },
      status: 'pending',
    };
    
    setLogs(prevLogs => [newLog, ...prevLogs]);
    
    const startTime = performance.now();
    
    try {
      await handleGenerateAIImages();
      
      const endTime = performance.now();
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === logId 
            ? {
                ...log, 
                status: 'success',
                duration: Math.round(endTime - startTime),
                responseData: { message: 'AI images generated successfully' }
              } 
            : log
        )
      );
    } catch (error) {
      setLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === logId 
            ? {
                ...log, 
                status: 'error',
                responseData: { error: error instanceof Error ? error.message : 'Unknown error' }
              } 
            : log
        )
      );
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const isAIGenerateEnabled = Array.isArray(bulkMenuItems) && bulkMenuItems.length > 0 && 'image_prompt' in bulkMenuItems[0];

  const handleDeleteAllMenu = async () => {
    if (!userData?.id) {
      toast.error("User data not found");
      return;
    }

    setIsDeletingMenu(true);
    try {
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

      if (result?.update_menu?.affected_rows > 0) {
        toast.success(`Successfully deleted ${result.update_menu.affected_rows} menu items`);
        // Refresh the menu to reflect changes
        await fetchMenu(userData.id, true);
      } else {
        toast.info("No menu items found to delete");
      }
    } catch (error) {
      console.error("Error deleting menu:", error);
      toast.error("Failed to delete menu items");
    } finally {
      setIsDeletingMenu(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="p-2 sm:p-3">
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Bulk Menu Upload</h1>
          </div>
          
          {/* Delete Menu Button - moved to top right */}
          <Button
            className="text-[13px] h-10 bg-red-600 hover:bg-red-700 text-white"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
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

        {/* Image Generation Logs */}
        <Card className="mb-6 bg-white/90 border-gray-200">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>Image Generation Logs</span>
                <Badge variant={logs.length > 0 ? "default" : "outline"} className="ml-2">
                  {logs.length}
                </Badge>
              </h2>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowLogs(!showLogs)}
                >
                  {showLogs ? "Hide" : "Show"}
                </Button>
                {logs.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={clearLogs}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            {showLogs && logs.length > 0 ? (
              <ScrollArea className="h-[200px] rounded-md border">
                <div className="p-4 space-y-3">
                  {logs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-md text-sm ${
                        log.status === 'success' 
                          ? 'bg-green-50 border border-green-200' 
                          : log.status === 'error'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-yellow-50 border border-yellow-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium">
                          <span className="mr-2">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <Badge variant={
                            log.status === 'success' 
                              ? "default"  
                              : log.status === 'error' 
                                ? "destructive" 
                                : "outline"
                          }>
                            {log.status}
                          </Badge>
                        </div>
                        {log.duration && (
                          <span className="text-xs text-gray-500">
                            {log.duration}ms
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1">
                        <p><strong>Endpoint:</strong> {log.endpoint}</p>
                        <p className="mt-1"><strong>Request:</strong></p>
                        <pre className="text-xs bg-gray-50 p-1 rounded overflow-auto max-h-20">
                          {JSON.stringify(log.requestData, null, 2)}
                        </pre>
                        
                        {log.responseData && (
                          <>
                            <p className="mt-1"><strong>Response:</strong></p>
                            <pre className="text-xs bg-gray-50 p-1 rounded overflow-auto max-h-20">
                              {JSON.stringify(log.responseData, null, 2)}
                            </pre>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : showLogs ? (
              <div className="h-[60px] flex items-center justify-center text-gray-500 text-sm border rounded-md">
                No logs yet. Generate images to see logs here.
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-4">
          <KimiAiLink />
          <Textarea
            placeholder="Paste your JSON here..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="min-h-[200px] text-base p-4"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 my-4">
          <Button
            className="text-[13px] w-full h-12"
            onClick={handleJsonSubmit}
            disabled={!jsonInput.trim()}
          >
            {bulkMenuItems.length > 0 ? "Update JSON" : "Convert JSON"}
          </Button>

          {bulkMenuItems.length > 0 && (
            <>
              <Button
                className="text-[13px] w-full h-12"
                variant="destructive"
                onClick={handleClear}
              >
                Clear All
              </Button>

              <Button
                className="text-[13px] w-full h-12"
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

        {bulkMenuItems.length > 0 && (
          <div className="mb-4 mt-5 flex items-center">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
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
              onClick={handleGenerateImagesWithLogs}
              className="bg-green-600 hover:bg-green-700 text-white h-12 text-sm sm:text-base flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                  Loading Images...
                </>
              ) : "Generate Images One by One"}
            </Button>
            <Button
              onClick={handlePartialImageGenerationWithLogs}
              className="bg-yellow-600 hover:bg-yellow-700 text-white h-12 text-sm sm:text-base flex-1"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate Images (Alt)"}
            </Button>
            <Button
              onClick={handleGenerateAIImagesWithLogs}
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
        )}

        {isEditModalOpen && editingItem && (
          <div className="w-full max-w-2xl mx-auto">
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
        )}

        {/* Delete Menu Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Entire Menu</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all menu items for this restaurant? This action cannot be undone and will permanently remove all menu items from your restaurant.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAllMenu}
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
