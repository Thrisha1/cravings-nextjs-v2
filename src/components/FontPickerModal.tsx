"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { FontSelect } from "./FontSelect";
import { ThemeConfig } from "./hotelDetail/ThemeChangeButton";
import { X } from "lucide-react";

interface FontPickerModalProps {
  theme: ThemeConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (font: string) => void;
}

export const fontOptions = [
  { value: "sans-serif", label: "Sans Serif", className: "font-sans" },
  { value: "serif", label: "Serif", className: "font-serif" },
  { value: "monospace", label: "Monospace", className: "font-mono" },
  { value: "inter", label: "Inter", className: "font-inter" },
  { value: "poppins", label: "Poppins", className: "font-poppins" },
  { value: "roboto", label: "Roboto", className: "font-roboto" },
];

export function FontPickerModal({
  theme,
  open,
  onOpenChange,
  onSave,
}: FontPickerModalProps) {
  const [selectedFont, setSelectedFont] = useState(
    String(theme?.fontFamily || "sans-serif")
  );

  const handleSave = () => {
    onSave(selectedFont);
    onOpenChange(false);
    toast.success("Font updated successfully");
  };

  const handleCancel = () => {
    setSelectedFont(String(theme?.fontFamily || "sans-serif"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isOpen) {
        onOpenChange(true);
      }
    }}>
      <DialogContent className="w-[95vw] max-w-[425px] rounded-xl mx-auto fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <DialogHeader className="relative">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-center">
            Change Font
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="absolute right-0 top-0 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <FontSelect
            options={fontOptions}
            value={selectedFont}
            onChange={setSelectedFont}
          />

          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
