import React, { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"; // Adjust import as necessary
import { Input } from "./input";
import { Button } from "./button";
import { Dialog, DialogContent } from "./dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { Category, formatDisplayName, useCategoryStore } from "@/store/categoryStore_hasura";
import { ScrollArea } from "@radix-ui/react-scroll-area";

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export const CategoryDropdown = ({
  value,
  onChange,
}: CategoryDropdownProps) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useAuthStore();
  const { categories, fetchCategories, addCategory } = useCategoryStore();

  useEffect(() => {
    if (userData) {
      fetchCategories(userData.id);
    }
  }, [userData]);

  const handleOnChange = async (value: string) => {
    if (value === "new-cat") {
      setModalOpen(true);
    } else {
      console.log("Selected category:", value);
      onChange(value);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    
    setIsLoading(true);
    try {
      const createdCategory = await addCategory(newCategory.trim());
      
      if (createdCategory) {
        // Select the newly created category
        onChange(formatDisplayName(createdCategory.name));
        toast.success("Category created successfully!");
      }
      
      // Close modal and reset form
      setModalOpen(false);
      setNewCategory("");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Error adding category");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Select value={value} onValueChange={handleOnChange}>
        <SelectTrigger className="capitalize">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-48">
            <SelectItem
              value="new-cat"
              className="bg-green-100 font-semibold cursor-pointer"
            >
              Create New Category
            </SelectItem>
            {categories.length > 0
              ? categories?.map((category) => (
                <SelectItem
                  className="capitalize"
                  key={`${category.id}`}
                  value={category.name}
                >
                  {formatDisplayName(category.name)}
                </SelectItem>
              ))
              : null}
          </ScrollArea>
        </SelectContent>
      </Select>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <h2>Add New Category</h2>
          <Input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter new category name"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCategory.trim() && !isLoading) {
                handleCreateCategory();
              }
            }}
          />
          <Button
            disabled={!newCategory.trim() || isLoading}
            onClick={handleCreateCategory}
          >
            {isLoading ? "Creating..." : "Create Category"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategoryDropdown;