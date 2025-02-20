import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface MenuItem {
    category: string;
    id?: string;
    name: string;
    price: number;
    image: string;
    description: string;
    isAdded?: boolean;
    isSelected?: boolean;
  }

interface EditItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: { index: number; item: MenuItem } | null;
  onSave: () => void;
  onEdit: (field: keyof MenuItem, value: string | number) => void;
}

export const EditItemModal = ({
  isOpen,
  onOpenChange,
  editingItem,
  onSave,
  onEdit,
}: EditItemModalProps) => {
  if (!editingItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] sm:max-w-4xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={editingItem.item.name}
              onChange={(e) => onEdit('name', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={editingItem.item.description}
              onChange={(e) => onEdit('description', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Image URL</label>
            <Input
              value={editingItem.item.image}
              onChange={(e) => onEdit('image', e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};