import { useState, useMemo } from 'react';
import { Plus, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMenuStore } from '@/store/menuStore';

export function MenuTab() {
  const { items, addItem, updateItem, deleteItem } = useMenuStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    image: '',
    description: '',
  });
  const [editingItem, setEditingItem] = useState<{
    id: string;
    name: string;
    price: string;
    image: string;
    description: string;
  } | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addItem({
      name: newItem.name,
      price: parseFloat(newItem.price),
      image: newItem.image,
      description: newItem.description,
    });
    setNewItem({ name: '', price: '', image: '', description: '' });
    setIsOpen(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateItem(editingItem.id, {
        name: editingItem.name,
        price: parseFloat(editingItem.price),
        image: editingItem.image,
        description: editingItem.description,
      });
      setEditingItem(null);
      setIsEditOpen(false);
    }
  };

  const openEditModal = (item: { id: string; name: string; price: number; image: string; description: string }) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      price: item.price.toString(),
      image: item.image,
      description: item.description || '',
    });
    setIsEditOpen(true);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Menu Items</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Product Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Price in ₹"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              />
              <Input
                placeholder="Image URL"
                value={newItem.image}
                onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
              />
              <Textarea
                placeholder="Product Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
              <Button type="submit" className="w-full">Add Item</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleEdit} className="space-y-4">
              <Input
                placeholder="Product Name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Price in ₹"
                value={editingItem.price}
                onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
              />
              <Input
                placeholder="Image URL"
                value={editingItem.image}
                onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
              />
              <Textarea
                placeholder="Product Description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              />
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id}>
            <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{item.price.toFixed(2)}</p>
              {item.description && (
                <p className="text-gray-600 mt-2">{item.description}</p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => openEditModal({ ...item, description: item.description || '' })}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteItem(item.id)}
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}