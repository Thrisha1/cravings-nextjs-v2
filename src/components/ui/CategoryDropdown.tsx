import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"; // Adjust import as necessary

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export const CategoryDropdown = ({ value, onChange }: CategoryDropdownProps) => {
  const categories = [
    "Appetizers",
    "Main Course",
    "Desserts",
    "Beverages",
    "Snacks",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Specials"
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category} value={category}>
            {category}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CategoryDropdown; 