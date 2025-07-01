import React, { useState, useEffect, useCallback, useRef, createRef } from "react";
import { Button } from "@/components/ui/button";
import {
  FullModal,
  FullModalContent,
  FullModalHeader,
  FullModalTitle,
  FullModalBody,
  FullModalFooter,
} from "@/components/ui/full_modal";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Category, formatDisplayName, formatStorageName, useCategoryStore } from "@/store/categoryStore_hasura";
import { useAuthStore } from "@/store/authStore";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useMenuStore } from "@/store/menuStore_hasura";
import {
  ChevronsUp,
  ChevronsDown,
  MoveVertical,
  X,
  Search,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CategoryManagementFormProps {
  categories: Category[];
  onSubmit: (categories: Category[]) => Promise<void>;
  onCancel: () => void;
}

export function CategoryManagementForm({
  categories: initialCategories,
  onSubmit,
  onCancel,
}: CategoryManagementFormProps) {
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [inputRefs, setInputRefs] = useState<{[key: string]: React.RefObject<HTMLInputElement | null>}>({});
  const { deleteCategoryAndItems } = useMenuStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get the authenticated user
  const user = useAuthStore(state => state.userData);
  
  // Initialize input refs for categories and refresh categories when modal opens
  useEffect(() => {
    const refreshCategories = async () => {
      try {
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Fetch the latest categories from the store
        const { fetchCategories } = useCategoryStore.getState();
        
        // Use the authenticated user's ID as the partner ID
        const partnerId = user.id;
        if (!partnerId) {
          throw new Error('No partner ID found for the authenticated user');
        }
        
        console.log('[CategoryManagement] Fetching categories for partner ID:', partnerId);
        
        // Fetch and ensure we have categories
        const latestCategories = await fetchCategories(partnerId);
        console.log('[CategoryManagement] Fetched categories:', latestCategories);
        
        if (!latestCategories || !Array.isArray(latestCategories)) {
          throw new Error('Failed to fetch categories');
        }
        
        // Create refs for each category
        const refs: {[key: string]: React.RefObject<HTMLInputElement | null>} = {};
        latestCategories.forEach((cat: Category) => {
          refs[cat.id] = createRef<HTMLInputElement | null>();
        });
        
        // Update local state with the latest categories
        setInputRefs(refs);
        const formattedCategories = latestCategories.map((cat: Category) => ({
          ...cat,
          name: formatDisplayName(cat.name),
          is_active: cat.is_active !== false // Ensure boolean value
        }));
        console.log('[CategoryManagement] Formatted categories for display:', formattedCategories);
        setLocalCategories(formattedCategories);
        setSearchTerm("");
      } catch (error) {
        console.error('[CategoryManagement] Error refreshing categories:', error);
        
        // Fallback to initialCategories if there's an error
        if (initialCategories.length > 0) {
          const refs: {[key: string]: React.RefObject<HTMLInputElement | null>} = {};
          initialCategories.forEach((cat: Category) => {
            refs[cat.id] = createRef<HTMLInputElement | null>();
          });
          setInputRefs(refs);
          
          const formattedInitialCategories = initialCategories.map((cat: Category) => ({
            ...cat,
            name: formatDisplayName(cat.name),
            is_active: cat.is_active !== false // Ensure boolean value
          }));
          console.log('[CategoryManagement] Using initialCategories as fallback:', formattedInitialCategories);
          setLocalCategories(formattedInitialCategories);
          setSearchTerm("");
        }
      }
    };

    refreshCategories();
  }, [initialCategories]);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setKeyboardOpen(true);
    // Scroll to ensure the input is visible when focused
    setTimeout(() => {
      if (contentRef.current) {
        const rect = e.target.getBoundingClientRect();
        const containerRect = contentRef.current.getBoundingClientRect();
        
        if (rect.bottom > containerRect.bottom) {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 300);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      // Check if any category input or search input is focused
      const anyInputFocused = 
        document.activeElement === searchInputRef.current || 
        Object.values(inputRefs).some(ref => document.activeElement === ref.current);
      
      if (!anyInputFocused) {
        setKeyboardOpen(false);
      }
    }, 100);
  };

  // Effect to handle visual viewport changes (keyboard)
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        
        // If visual viewport is significantly smaller than window height, keyboard is probably open
        if (windowHeight - currentHeight > 150) {
          setKeyboardOpen(true);
        } else {
          setKeyboardOpen(false);
        }
      }
    };

    // Add the event listener
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    // Clean up
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const filteredCategories = localCategories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log('[CategoryManagement] Filtered categories:', { 
    searchTerm, 
    filteredCount: filteredCategories.length,
    totalCount: localCategories.length 
  });

  const moveToPosition = useCallback(
    (id: string, newIndex: number) => {
      const currentIndex = localCategories.findIndex((cat) => cat.id === id);
      if (
        currentIndex === -1 ||
        newIndex < 0 ||
        newIndex >= localCategories.length
      )
        return;

      const newCategories = [...localCategories];
      const [movedItem] = newCategories.splice(currentIndex, 1);
      newCategories.splice(newIndex, 0, movedItem);

      const updatedCategories = newCategories.map((cat, idx) => ({
        ...cat,
        priority: idx + 1,
      }));

      setLocalCategories(updatedCategories);
    },
    [localCategories]
  );

  const moveCategory = useCallback((id: string, direction: 'up' | 'down') => {
    const currentIndex = localCategories.findIndex((cat) => cat.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' 
      ? Math.max(0, currentIndex - 1) 
      : Math.min(localCategories.length - 1, currentIndex + 1);
      
    if (newIndex !== currentIndex) {
      moveToPosition(id, newIndex);
    }
  }, [localCategories, moveToPosition]);

  const moveToTop = (id: string) => moveToPosition(id, 0);
  const moveToBottom = (id: string) =>
    moveToPosition(id, localCategories.length - 1);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    moveToPosition(result.draggableId, result.destination.index);
  };

  const handleNameChange = (id: string, newName: string) => {
    console.log('[CategoryManagement] Category name change:', { id, newName });
    setLocalCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, name: (newName) } : cat))
    );
  };

  const handleStatusChange = async (id: string, newIsActive: boolean) => {
    try {
      console.log('[CategoryManagement] Category status change:', { id, newIsActive });
      
      const currentCategories = [...localCategories];
      const categoryToUpdate = currentCategories.find(cat => cat.id === id);
      if (!categoryToUpdate) return;
      
      // Update local state optimistically
      const updatedCategories = currentCategories.map(cat => 
        cat.id === id ? { ...cat, is_active: newIsActive } : cat
      );
      setLocalCategories(updatedCategories);
      
      // Prepare the update object with all required fields
      const updateData = {
        ...categoryToUpdate,
        is_active: newIsActive,
        name: formatStorageName(categoryToUpdate.name), // Ensure name is in storage format
        priority: categoryToUpdate.priority || 0 // Ensure priority is always a number
      };
      console.log('[CategoryManagement] Updating category with data:', updateData);
      
      // Update in the store
      const { updateCategory } = useCategoryStore.getState();
      await updateCategory(updateData);
      
      // Refresh categories from the store to ensure we have the latest data
      const { categories } = useCategoryStore.getState();
      console.log('[CategoryManagement] Categories after status update:', categories);
      setLocalCategories([...categories]);
      
      toast.success(`Category ${newIsActive ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('[CategoryManagement] Error toggling category status:', error);
      toast.error('Failed to update category status');
      
      // Revert local state on error
      const { categories: currentStoreCategories } = useCategoryStore.getState();
      setLocalCategories(prev => 
        prev.map(cat => {
          const currentCat = currentStoreCategories.find(c => c.id === cat.id);
          return currentCat 
            ? { 
                ...currentCat, 
                name: formatDisplayName(currentCat.name),
                is_active: currentCat.is_active !== false,
                priority: currentCat.priority || 0
              } 
            : cat;
        })
      );
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    // Blur any focused inputs to dismiss keyboard
    if (document.activeElement instanceof HTMLInputElement) {
      document.activeElement.blur();
    }

    const updatedCategories = localCategories.map((cat: Category) => ({
      ...cat,
      name: formatStorageName(cat.name)
    }));
    
    console.log('[CategoryManagement] Submitting categories for update:', updatedCategories);

    try {
      await onSubmit(updatedCategories);
      console.log('[CategoryManagement] Categories updated successfully');
      toast.success("Categories updated successfully");
    } catch (err) {
      console.error("[CategoryManagement] Error updating categories:", err);
      toast.error("Failed to update categories");
      throw err; // Re-throw to allow parent component to handle the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    // Blur any focused inputs to dismiss keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    setLocalCategories(initialCategories.map(cat => ({
      ...cat,
      name: formatDisplayName(cat.name)
    })));
    toast("Changes discarded");
  };

  return (
    <div className="container px-2 sm:px-0 pb-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Manage Categories</h2>
      </div>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Drag categories or use arrows to reorder. Long-press to drag on mobile.
      </p>

      <div className="space-y-4 flex flex-col">
        <div className="flex gap-0 items-center sticky top-0 z-10 bg-background pt-0 pb-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1 h-7 w-7"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={() => setSearchTerm("")} className="shrink-0">
            Clear
          </Button>
        </div>

        <div 
          ref={contentRef}
          className="border rounded-lg flex-1 overflow-hidden flex flex-col"
        >
          <div className="overflow-visible">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                    <TableHead className="w-[80px] text-center">
                      Move
                    </TableHead>
                    <TableHead className="w-[40px] hidden sm:table-cell">
                      Drag
                    </TableHead>
                    <TableHead className="w-[40px] text-center">
                      Delete
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <Droppable droppableId="categories">
                  {(provided) => (
                    <TableBody
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="divide-y"
                    >
                      {filteredCategories.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No categories found
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredCategories.map((category, index) => {
                        const originalIndex = localCategories.findIndex(
                          (c) => c.id === category.id
                        );
                        return (
                          <Draggable
                            key={category.id}
                            draggableId={category.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`${
                                  snapshot.isDragging
                                    ? "bg-primary/10 shadow-md"
                                    : "bg-background"
                                }`}
                              >
                                <TableCell>
                                  <Input
                                    ref={inputRefs[category.id]}
                                    value={(category.name)}
                                    onChange={(e) =>
                                      handleNameChange(
                                        category.id,
                                        e.target.value
                                      )
                                    }
                                    className="w-full"
                                    onFocus={handleInputFocus}
                                    onBlur={handleInputBlur}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id={`status-${category.id}`}
                                      checked={Boolean(category.is_active)}
                                      onCheckedChange={(checked) => {
                                        handleStatusChange(category.id, checked);
                                      }}
                                      className="data-[state=checked]:bg-green-500"
                                    />
                                    <Label htmlFor={`status-${category.id}`} className="text-sm">
                                      {category.is_active ? 'Active' : 'Inactive'}
                                    </Label>
                                  </div>
                                </TableCell>
                                {/* Desktop Actions */}
                                <TableCell className="hidden sm:table-cell">
                                  <div className="flex justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => moveToTop(category.id)}
                                      disabled={originalIndex === 0}
                                      title="Move to top"
                                    >
                                      <ChevronsUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => moveToBottom(category.id)}
                                      disabled={
                                        originalIndex ===
                                        localCategories.length - 1
                                      }
                                      title="Move to bottom"
                                    >
                                      <ChevronsDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                                {/* Up/Down Arrows - Visible on All Devices */}
                                <TableCell>
                                  <div className="flex justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => moveCategory(category.id, 'up')}
                                      disabled={originalIndex === 0}
                                      title="Move up"
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => moveCategory(category.id, 'down')}
                                      disabled={
                                        originalIndex ===
                                        localCategories.length - 1
                                      }
                                      title="Move down"
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                                {/* Drag Handle - desktop only */}
                                <TableCell className="hidden sm:table-cell">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="flex items-center justify-center"
                                  >
                                    <MoveVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-800"
                                    onClick={async () => {
                                      if (
                                        confirm(
                                          `Delete "${category.name}" and all its items?`
                                        )
                                      ) {
                                        try {
                                          await deleteCategoryAndItems(
                                            category.id
                                          );
                                          // Remove from local state immediately
                                          setLocalCategories((prev) =>
                                            prev.filter(
                                              (cat) => cat.id !== category.id
                                            )
                                          );
                                          toast.success(
                                            `Deleted "${category.name}" successfully`
                                          );
                                        } catch (error) {
                                          toast.error(
                                            `Failed to delete "${category.name}"`
                                          );
                                          console.error("Delete error:", error);
                                        }
                                      }
                                    }}
                                    title="Delete category"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </TableBody>
                  )}
                </Droppable>
              </Table>
            </DragDropContext>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

interface CategoryManagementModalProps {
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManagementModal({
  categories: initialCategories,
  open,
  onOpenChange,
}: CategoryManagementModalProps) {
  const { updateCategoriesAsBatch } = useMenuStore();

  const handleSubmit = async (updatedCategories: Category[]) => {
    console.log('[CategoryManagementModal] Submitting batch update for categories:', updatedCategories);
    await updateCategoriesAsBatch(updatedCategories);
    onOpenChange(false);
  };

  return (
    <FullModal open={open} onOpenChange={onOpenChange}>
      <FullModalContent className="h-[calc(100vh-56px)] mt-14 flex flex-col" showCloseButton={false}>
        <FullModalHeader>
          <FullModalTitle>Manage Categories</FullModalTitle>
        </FullModalHeader>
        <FullModalBody className="overflow-auto">
          <CategoryManagementForm 
            categories={initialCategories}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        </FullModalBody>
      </FullModalContent>
    </FullModal>
  );
}
