import React, { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "./input";
import { Button } from "./button";
import { Label } from "./label";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { Category, formatDisplayName, useCategoryStore } from "@/store/categoryStore_hasura";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft } from "lucide-react";

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export const CategoryDropdown = ({
  value,
  onChange,
}: CategoryDropdownProps) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useAuthStore();
  const { categories, fetchCategories, addCategory } = useCategoryStore();

  useEffect(() => {
    if (userData) {
      fetchCategories(userData.id);
    }
  }, [userData, fetchCategories]);

  const handleSelectChange = (value: string) => {
    if (value === "new-cat") {
      setIsAddingNew(true);
    } else {
      onChange(value);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    
    setIsLoading(true);
    try {
      const createdCategory = await addCategory(newCategory.trim());
      
      if (createdCategory) {
        onChange(formatDisplayName(createdCategory.name));
        toast.success("Category created successfully!");
      }
      
      setIsAddingNew(false);
      setNewCategory("");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Error adding category");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewCategory("");
    setIsAddingNew(false);
  };

  if (isAddingNew) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-category">New Category Name</Label>
          <div className="flex items-center gap-2">
            <Input
              id="new-category"
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter new category name"
              autoFocus
              className="h-12 text-base"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            type="button" 
            onClick={handleCancel}
            className="flex items-center gap-1 h-12 px-4"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            type="button"
            disabled={!newCategory.trim() || isLoading}
            onClick={handleCreateCategory}
            className="h-12 px-4"
          >
            {isLoading ? "Creating..." : "Create Category"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleSelectChange}>
      <SelectTrigger className="capitalize h-12 text-base">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent className="max-w-[95vw]">
        <ScrollArea className="h-64 md:h-48">
          <SelectItem
            value="new-cat"
            className="bg-green-100 font-semibold cursor-pointer py-3 px-3"
          >
            Create New Category
          </SelectItem>
          {categories.length > 0
            ? categories?.map((category) => (
              <SelectItem
                className="capitalize py-3 px-3"
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
  );
};

export default CategoryDropdown;