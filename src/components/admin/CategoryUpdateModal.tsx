import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Category, useCategoryStore } from "@/store/categoryStore_hasura";
import { useMenuStore } from "@/store/menuStore_hasura";

interface CategoryUpdateModalProps {
  catId: string;
  cat: string;
  priority: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  catUpdated: boolean;
  setCatUpdated: (updated: boolean) => void;
}

export function CategoryUpdateModal({
    catId,
    cat,
    priority: initialPriority,
    isOpen,
    onOpenChange,
    catUpdated,
    setCatUpdated,
  }: CategoryUpdateModalProps) {
    const [categoryName, setCategoryName] = useState(cat);
    const [priority, setPriority] = useState(initialPriority);
    const [isLoading, setIsLoading] = useState(false);
    const { updateCategory } = useCategoryStore();

    const handleSubmit = async () => {  
      try {
        setIsLoading(true);
        await updateCategory({
          id: catId,
          name: categoryName,
          priority,
        } as Category);
        setCatUpdated(!catUpdated);
        onOpenChange(false);
        toast.success("Category updated successfully");
      } catch (error) {
        console.error("Error updating category:", error);
        toast.error("Failed to update category");
      } finally {
        setIsLoading(false);
      }
    };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="categoryName">Category Name</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority (lower numbers show first)</Label>
            <Input
              id="priority"
              type="text"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}