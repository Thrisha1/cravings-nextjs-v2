import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"; // Adjust import as necessary

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const categories = [
  "Juices",
  "Desserts",
  "Main Course",
  "Appetizers",
  "Salads",
  "Beverages",
  "Snacks",
  "Others"
];

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={onChange} required>
      <SelectTrigger>
        <SelectValue placeholder="Select Category" />
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