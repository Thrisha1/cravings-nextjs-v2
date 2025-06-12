import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MenuStyleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (style: string) => void;
}

const menuStyles = [
  { id: "default", name: "Default Style" },
  { id: "compact", name: "Compact View" },
  { id: "grid", name: "Grid Layout" },
  { id: "detailed", name: "Detailed View" }
];

const MenuStyleModal = ({ open, onOpenChange, onSave }: MenuStyleModalProps) => {
  const [selectedStyle, setSelectedStyle] = React.useState<string>("default");

  const handleCancel = () => {
    setSelectedStyle("default");
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
            Menu Style Customization
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {menuStyles.map((style) => (
              <Button
                key={style.id}
                variant={selectedStyle === style.id ? "default" : "outline"}
                onClick={() => setSelectedStyle(style.id)}
                className="h-12 sm:h-16 text-sm sm:text-base"
              >
                {style.name}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                onSave(selectedStyle);
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuStyleModal;