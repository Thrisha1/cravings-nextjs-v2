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
import { Category, formatDisplayName, formatStorageName } from "@/store/categoryStore_hasura";
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
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [inputRefs, setInputRefs] = useState<{[key: string]: React.RefObject<HTMLInputElement | null>}>({});
  const { updateCategoriesAsBatch, deleteCategoryAndItems } = useMenuStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Initialize input refs for categories
  useEffect(() => {
    if (open && initialCategories.length > 0) {
      const refs: {[key: string]: React.RefObject<HTMLInputElement | null>} = {};
      initialCategories.forEach(cat => {
        refs[cat.id] = createRef<HTMLInputElement | null>();
      });
      setInputRefs(refs);
      
      setLocalCategories(initialCategories.map(cat => ({
        ...cat,
        name: formatDisplayName(cat.name)
      })));
      setSearchTerm("");
    }
  }, [open, initialCategories]);

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
    setLocalCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, name: (newName) } : cat))
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    // Blur any focused inputs to dismiss keyboard
    if (document.activeElement instanceof HTMLInputElement) {
      document.activeElement.blur();
    }

    const updatedCategories = localCategories.map((cat) => ({
      ...cat,
      name: formatStorageName(cat.name)
    }));

    try {
      await updateCategoriesAsBatch(updatedCategories);
      setIsLoading(false);
      onOpenChange(false);
      toast.success("Categories updated successfully");
    } catch (err) {
      setIsLoading(false);
      console.error("Error updating categories:", err);
      toast.error("Failed to update categories");
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

  const handleCancel = () => {
    // Blur any focused inputs to dismiss keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Close modal without saving changes
    onOpenChange(false);
  };

  // Determine if content is scrollable
  const [isTableScrollable, setIsTableScrollable] = useState(false);
  
  useEffect(() => {
    if (contentRef.current && filteredCategories.length > 5) {
      setIsTableScrollable(true);
    } else {
      setIsTableScrollable(false);
    }
  }, [filteredCategories.length]);

  return (
    <FullModal open={open} onOpenChange={onOpenChange}>
      <FullModalContent className="h-[calc(100vh-56px)] mt-14 flex flex-col" showCloseButton={false}>
        <FullModalHeader>
          <FullModalTitle>Manage Categories</FullModalTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isTableScrollable 
              ? "Drag categories or use arrows to reorder. Long-press to drag on mobile." 
              : "Use arrows to reorder categories or change their order."}
          </p>
        </FullModalHeader>

        <FullModalBody className="flex-1 overflow-hidden flex flex-col pb-44">
          <div className="space-y-4 flex flex-col h-full">
            <div className="flex gap-2 items-center sticky top-0 z-10 bg-background pt-1 pb-2">
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
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)', paddingBottom: '80px' }}>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Table className="min-w-full">
                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead>Category Name</TableHead>
                        <TableHead className="w-[100px] text-center hidden sm:table-cell">
                          Actions
                        </TableHead>
                        <TableHead className="w-[80px] text-center sm:hidden">
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
                                    {/* Mobile Actions */}
                                    <TableCell className="sm:hidden">
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
        </FullModalBody>

        <FullModalFooter
          style={{
            bottom: keyboardOpen ? `${window.visualViewport?.offsetTop || 0}px` : '0',
            position: 'fixed',
            width: '100%',
            zIndex: 30,
          }}
          className="border-t bg-background"
        >
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            Reset
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 sm:flex-initial"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </FullModalFooter>
      </FullModalContent>
    </FullModal>
  );
}
