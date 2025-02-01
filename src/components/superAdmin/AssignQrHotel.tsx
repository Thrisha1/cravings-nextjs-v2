"use client";
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  where,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer } from "lucide-react";
import { useQRStore } from "@/store/qrStore";
import { Checkbox } from "@/components/ui/checkbox";

interface QrCode {
  id: string;
  hotelId: string;
  hotelName: string;
  assignedAt: string;
  qrCodeNumber?: number;
  numberOfQrScans?: number;
}

interface Hotel {
  id: string;
  name: string;
}

const AssignQrHotel = () => {
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedQr, setSelectedQr] = useState<QrCode | null>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [qrCount, setQrCount] = useState(1);
  const [selectedQRs, setSelectedQRs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQrGenerating , setIsQrGenerating] = useState(false);
  const { createQR, assignQR } = useQRStore();

  // Fetch QR codes and hotels
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // First fetch QR codes
      const qrSnapshot = await getDocs(collection(db, "qrcodes"));
      const qrData = qrSnapshot.docs.map(
        (doc) =>
          ({
        id: doc.id,
        ...doc.data(),
          } as QrCode)
      ).sort((a, b) => (a.qrCodeNumber || 0) - (b.qrCodeNumber || 0));
      setQrCodes(qrData);

      // Get array of hotel IDs that are already assigned to QR codes
      const assignedHotelIds = qrData.map((qr) => qr.hotelId).filter(Boolean);

      // Fetch all hotels with role "hotel", not filtering assigned ones yet
      const hotelQuery = query(
        collection(db, "users"),
        where("role", "==", "hotel")
      );

      const hotelSnapshot = await getDocs(hotelQuery);
      const hotelData = hotelSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().hotelName
      }));
      
      // Filter out assigned hotels after fetching
      const unassignedHotels = hotelData.filter(
        hotel => !assignedHotelIds.includes(hotel.id)
      );
      
      setHotels(unassignedHotels);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter hotels based on search query
  const filteredHotels = hotels.filter((hotel) =>
    hotel.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Handle generating multiple QR codes
  const handleGenerateQRs = async () => {
    try {
      setIsQrGenerating(true);
      await createQR(qrCount);
      await fetchData();
      setIsGenerateOpen(false);
      setQrCount(1);
      setIsQrGenerating(false);
    } catch (error) {
      console.error("Error generating QRs:", error);
    }
  };

  // Handle QR reassignment
  const handleReassign = async () => {
    if (!selectedQr || !selectedHotel) return;

    try {
      await assignQR(selectedQr.id, selectedHotel.id, selectedHotel.name);
      await fetchData();
      setIsReassignOpen(false);
      setSelectedQr(null);
      setSelectedHotel(null);
      setSearchQuery("");
    } catch (error) {
      console.error("Error reassigning QR:", error);
    }
  };


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQRs(qrCodes.map(qr => qr.id));
    } else {
      setSelectedQRs([]);
    }
  };

  const handleSelectQR = (qrId: string, checked: boolean) => {
    if (checked) {
      setSelectedQRs(prev => [...prev, qrId]);
    } else {
      setSelectedQRs(prev => prev.filter(id => id !== qrId));
    }
  };

  // Handle printing selected QR codes
  const handlePrint = () => {
    if (selectedQRs.length === 0) {
      alert("Please select QR codes to print");
      return;
    }

    const qrsToPrint = qrCodes.filter(qr => selectedQRs.includes(qr.id));
    // Create printable content with table format
    const printContent = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th>QR Number</th>
            <th>QR ID</th>
            ${qrsToPrint.some(qr => qr.hotelId) ? `
              <th>Hotel ID</th>
              <th>Hotel Name</th>
              <th>Assigned At</th>
              <th>Number of Scans</th>
            ` : ''}
            <th>QR Link</th>
          </tr>
        </thead>
        <tbody>
          ${qrsToPrint.map(qr => `
            <tr>
              <td>${qr.qrCodeNumber}</td>
              <td>${qr.id}</td>
              ${qr.hotelId ? `
                <td>${qr.hotelId}</td>
                <td>${qr.hotelName}</td>
                <td>${new Date(qr.assignedAt!).toLocaleString()}</td>
                <td>${qr.numberOfQrScans || 0}</td>
              ` : ''}
              <td>https://www.cravings.live/qrScan/${qr.id}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Selected QR Codes Report</title>
            <style>
              body { margin: 20px; }
              table { font-family: Arial, sans-serif; }
              th { background-color: #f0f0f0; }
              td, th { padding: 8px; text-align: left; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <section className="p-4">
      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-4">
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogTrigger asChild>
            <Button>Generate QR Codes</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate QR Codes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="1"
                  value={qrCount}
                  onChange={(e) => setQrCount(parseInt(e.target.value))}
                  placeholder="Number of QR codes"
                />
              </div>
              <Button
                disabled={isQrGenerating}
                onClick={isQrGenerating ? ()=>{} : handleGenerateQRs}
                className="w-full"
              >
               { isQrGenerating ? 'Generating..' : ' Generate' }
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Selected QR Codes
        </Button>
      </div>

      <Table className="mt-10 sm:mt-0">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox 
                checked={selectedQRs.length === qrCodes.length}
                onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
              />
            </TableHead>
            <TableHead className="text-sm sm:text-base">QR Number</TableHead>
            <TableHead className="text-sm sm:text-base">QR ID</TableHead>
            <TableHead className="text-sm sm:text-base">Hotel ID</TableHead>
            <TableHead className="text-sm sm:text-base">Hotel Name</TableHead>
            <TableHead className="text-sm sm:text-base">Assigned At</TableHead>
            <TableHead className="text-sm sm:text-base">Number of Scans</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                Loading QR codes...
              </TableCell>
            </TableRow>
          ) : qrCodes.map((qr) => (
            <TableRow
              key={qr.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => {
                setSelectedQr(qr);
                setIsReassignOpen(true);
              }}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                  checked={selectedQRs.includes(qr.id)}
                  onCheckedChange={(checked: boolean) => handleSelectQR(qr.id, checked)}
                />
              </TableCell>
              <TableCell>{qr.qrCodeNumber}</TableCell>
              <TableCell>{qr.id}</TableCell>
              <TableCell>{qr.hotelId || "NULL"}</TableCell>
              <TableCell>{qr.hotelName || "NULL"}</TableCell>
              <TableCell>{qr.assignedAt ? new Date(qr.assignedAt).toLocaleString() : "NULL"}</TableCell>
              <TableCell>{qr.numberOfQrScans || 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedQr?.hotelId ? "Reassign QR Code" : "Assign QR Code"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search hotels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filteredHotels.length > 0 ? (
                filteredHotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${
                      selectedHotel?.id === hotel.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedHotel(hotel)}
                  >
                    {hotel.name}
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">No hotels found</div>
              )}
            </div>
            <Button
              onClick={handleReassign}
              disabled={!selectedHotel}
              className="w-full"
            >
              {selectedQr?.hotelId ? "Reassign" : "Assign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AssignQrHotel;
