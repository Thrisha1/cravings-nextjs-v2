import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Category } from "@/store/categoryStore_hasura";
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
  Trash,
  Search,
  Trash2,
} from "lucide-react";
import { DialogClose } from "@radix-ui/react-dialog";

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
  const { updateCategoriesAsBatch , deleteCategoryAndItems } = useMenuStore();

  useEffect(() => {
    if (open) {
      setLocalCategories([...initialCategories]);
      setSearchTerm("");
    }
  }, [open, initialCategories]);

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

  const moveToTop = (id: string) => moveToPosition(id, 0);
  const moveToBottom = (id: string) =>
    moveToPosition(id, localCategories.length - 1);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    moveToPosition(result.draggableId, result.destination.index);
  };

  const handleNameChange = (id: string, newName: string) => {
    setLocalCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, name: newName } : cat))
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await updateCategoriesAsBatch(localCategories);
      setIsLoading(false);
      onOpenChange(false);
    } catch (err) {
      setIsLoading(false);
      console.error("Error updating categories:", err);
    }
  };

  const handleReset = () => {
    setLocalCategories([...initialCategories]);
    toast("Changes discarded");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full lg:max-w-4xl h-full lg:h-[90vh] flex flex-col z-[60]">
        <DialogHeader>
          <div className="flex justify-end">
            <DialogClose>X Close</DialogClose>
          </div>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Reorder categories by dragging or using the controls. Use actions
            arrows to move category to top or bottom.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
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
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Clear
            </Button>
          </div>

          <div className="border rounded-lg overflow-y-scroll max-h-[400px] flex-1">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Table className="h-full">
                <TableHeader className="bg-gray-50 sticky top-0">
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    {/* <TableHead className="w-[50px] text-center">
                      Priority
                    </TableHead> */}
                    <TableHead className="w-[100px] text-center">
                      Actions
                    </TableHead>
                    <TableHead className="w-[40px]">Move</TableHead>
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
                                    value={category.name}
                                    onChange={(e) =>
                                      handleNameChange(
                                        category.id,
                                        e.target.value
                                      )
                                    }
                                    className="w-full"
                                  />
                                </TableCell>
                                {/* <TableCell className="text-center font-medium">
                                  {originalIndex + 1}
                                </TableCell> */}
                                <TableCell>
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
                                <TableCell>
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
                                          `Are you sure you want to permanently delete "${category.name}" and all its items?`
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

        <DialogFooter className="flex flex-col gap-3 w-full">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
            className="w-full"
          >
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
