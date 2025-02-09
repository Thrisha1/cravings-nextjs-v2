"use client";
import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collection, getDocs, getFirestore, updateDoc, doc } from 'firebase/firestore';
import { toast } from "sonner";
import { Search } from "lucide-react";

interface Hotel {
  id: string;
  hotelName: string;
  upiId?: string;
}

const UpdateHotelUpiId = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [newUpiId, setNewUpiId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const db = getFirestore();

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const hotelCollection = collection(db, 'users');
        const hotelSnapshot = await getDocs(hotelCollection);
        const hotelList = hotelSnapshot.docs
          .filter(doc => doc.data().role === 'hotel')
          .map(doc => ({
            id: doc.id,
            hotelName: doc.data().hotelName || '',
            upiId: doc.data().upiId || ''
          }));

        // Sort hotels - those without UPI ID first
        const sortedHotels = hotelList.sort((a, b) => {
          if (!a.upiId && b.upiId) return -1;
          if (a.upiId && !b.upiId) return 1;
          return a.hotelName.localeCompare(b.hotelName);
        });

        setHotels(sortedHotels);
        setFilteredHotels(sortedHotels);
      } catch (error) {
        console.error("Error fetching hotels:", error);
        toast.error("Failed to fetch hotels");
      }
    };

    fetchHotels();
  }, []);

  useEffect(() => {
    const filtered = hotels.filter(hotel =>
      hotel.hotelName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredHotels(filtered);
  }, [searchQuery, hotels]);

  const handleUpdateUpiId = async () => {
    if (!selectedHotel || !newUpiId) return;

    setIsUpdating(true);
    try {
      const hotelRef = doc(db, 'users', selectedHotel.id);
      await updateDoc(hotelRef, { upiId: newUpiId });
      
      // Update local state
      const updatedHotels = hotels.map(hotel => 
        hotel.id === selectedHotel.id 
          ? { ...hotel, upiId: newUpiId }
          : hotel
      );
      setHotels(updatedHotels);
      setFilteredHotels(updatedHotels);

      toast.success("UPI ID updated successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating UPI ID:", error);
      toast.error("Failed to update UPI ID");
    } finally {
      setIsUpdating(false);
    }
  };

  const openModal = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setNewUpiId(hotel.upiId || '');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-white rounded-md">
        <Search className="absolute bg-white rounded-l-md left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search hotels by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hotel Name</TableHead>
            <TableHead>UPI ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredHotels.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4">
                No hotels found
              </TableCell>
            </TableRow>
          ) : (
            filteredHotels.map((hotel) => (
              <TableRow 
                key={hotel.id}
                className="cursor-pointer hover:bg-orange-400"
                onClick={() => openModal(hotel)}
              >
                <TableCell>{hotel.hotelName}</TableCell>
                <TableCell>{hotel.upiId || 'Not Set'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update UPI ID for {selectedHotel?.hotelName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Enter new UPI ID"
              value={newUpiId}
              onChange={(e) => setNewUpiId(e.target.value)}
            />
            <Button 
              onClick={handleUpdateUpiId}
              disabled={isUpdating || !newUpiId}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isUpdating ? 'Updating...' : 'Update UPI ID'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdateHotelUpiId;