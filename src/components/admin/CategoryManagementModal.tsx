import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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

interface CategoryManagementModalProps {
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Custom drag handle component
const DragHandle = () => (
  <span className="mr-2 cursor-grab active:cursor-grabbing">☰</span>
);

export function CategoryManagementModal({
  categories: initialCategories,
  open,
  onOpenChange,
}: CategoryManagementModalProps) {
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { updateCategoriesAsBatch } = useMenuStore();

  useEffect(() => {
    if (open) {
      setLocalCategories([...initialCategories]);
    }
  }, [open, initialCategories]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localCategories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      priority: index + 1,
    }));

    setLocalCategories(updatedItems);
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
      <DialogContent className="max-w-[90%] rounded-xl max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription className="px-4">
            Drag and Drop each categories by click and hold on priority to change its priority order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead className="w-20">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <Droppable droppableId="categories">
                {(provided) => (
                  <TableBody
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {localCategories.map((category, index) => (
                      <Draggable
                        key={category.id}
                        draggableId={category.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`hover:bg-gray-50 ${
                              snapshot.isDragging ? "bg-gray-100" : ""
                            }`}
                          >
                            <TableCell>
                              <Input
                                value={category.name}
                                onChange={(e) =>
                                  handleNameChange(category.id, e.target.value)
                                }
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <div {...provided.dragHandleProps}>
                                  <DragHandle />
                                </div>
                                {index + 1}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableBody>
                )}
              </Droppable>
            </Table>
          </DragDropContext>
        </div>

        <DialogFooter className="flex flex-col gap-3 w-full">
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
