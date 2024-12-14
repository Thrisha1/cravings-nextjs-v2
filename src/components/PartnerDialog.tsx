import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';

export function PartnerDialog() {
  const navigate = useRouter();
  const { signUpAsPartner } = useAuthStore();
  const { locations } = useLocationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    hotelName: '',
    area: '',
    location: '',
    email: '',
    password: '',
    category: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUpAsPartner(
        formData.email,
        formData.password,
        formData.hotelName,
        formData.area,
        formData.location,
        formData.category,
        formData.phone
      );
      setIsOpen(false);
      navigate.push('/admin');
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const openGoogleMaps = () => {
    window.open('https://www.google.com/maps', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="text-white font-medium bg-orange-600 hover:bg-orange-50 hover:border-orange-600 hover:text-orange-600 px-5 text-[1rem] py-3 rounded-full transition-all duration-300 "
        >
          Partner with Us
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Register as Partner
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select your category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="supermarket">Supermarket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotelName" className="text-sm font-medium text-gray-700">
                Business Name
              </Label>
              <Input
                id="hotelName"
                placeholder="Enter your business name"
                value={formData.hotelName}
                onChange={(e) =>
                  setFormData({ ...formData, hotelName: e.target.value })
                }
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area" className="text-sm font-medium text-gray-700">
                Area
              </Label>
              <Select
                value={formData.area}
                onValueChange={(value : any) => setFormData({ ...formData, area: value })}
              >
                <SelectTrigger id="area" className="w-full">
                  <SelectValue placeholder="Select your area" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location : any) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                Google Map Location
              </Label>
              <div className="relative">
                <Textarea
                  id="location"
                  placeholder="Paste your gmap location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="min-h-[100px] pr-10"
                  required
                />
                <Button
                  type="button"
                  className="absolute right-2 top-2"
                  onClick={openGoogleMaps}
                >
                  <MapPin className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white mt-6"
            >
              Register
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}