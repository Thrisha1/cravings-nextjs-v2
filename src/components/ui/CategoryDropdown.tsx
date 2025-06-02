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
import {
  FullModal,
  FullModalContent,
  FullModalHeader,
  FullModalTitle,
  FullModalBody,
  FullModalFooter,
} from "./full_modal";
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
  const [keyboardOpen, setKeyboardOpen] = useState(false);
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

  const handleCancel = () => {
    // Blur any focused inputs to dismiss keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Reset form and close modal
    setNewCategory("");
    setModalOpen(false);
  };

  const handleInputFocus = () => {
    setKeyboardOpen(true);
  };

  const handleInputBlur = () => {
    setKeyboardOpen(false);
  };

  // Effect to handle visual viewport changes (keyboard)
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        
        // Detect if keyboard is open
        if (windowHeight - currentHeight > 150) {
          setKeyboardOpen(true);
        } else {
          setKeyboardOpen(false);
        }
      }
    };

    // Add listener for viewport changes
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

      <FullModal open={isModalOpen} onOpenChange={setModalOpen}>
        <FullModalContent>
          <FullModalHeader>
            <FullModalTitle>Add New Category</FullModalTitle>
          </FullModalHeader>
          <FullModalBody>
            <div className="space-y-4">
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
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                autoFocus
              />
            </div>
          </FullModalBody>
          <FullModalFooter
            style={{
              bottom: keyboardOpen ? `${window.visualViewport?.offsetTop || 0}px` : '0',
              position: 'fixed',
              width: '100%',
            }}
          >
            <Button
              variant="outline"
              onClick={handleCancel}
              type="button"
            >
              Cancel
            </Button>
            <Button
              disabled={!newCategory.trim() || isLoading}
              onClick={handleCreateCategory}
            >
              {isLoading ? "Creating..." : "Create Category"}
            </Button>
          </FullModalFooter>
        </FullModalContent>
      </FullModal>
    </>
  );
};

export default CategoryDropdown;