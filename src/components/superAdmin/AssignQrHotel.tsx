"use client";
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  where,
  query,
  doc,
  updateDoc,
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
import { Search, Printer, QrCodeIcon, Trash, HotelIcon } from "lucide-react";
import { useQRStore } from "@/store/qrStore";
import { Checkbox } from "@/components/ui/checkbox";
import { Scanner } from '@yudiel/react-qr-scanner';
import { toast } from "sonner";

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
  area: string;
}

const AssignQrHotel = () => {
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedQrs, setSelectedQrs] = useState<QrCode[]>([]);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [qrCount, setQrCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isQrGenerating , setIsQrGenerating] = useState(false);
  const { createQR, assignQR } = useQRStore();
  const [showScanner, setShowScanner] = useState(false);
  const [lastScannedQr, setLastScannedQr] = useState<QrCode | null>(null);

  // State for modal search
  const [modalSearchQuery, setModalSearchQuery] = useState("");

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

      // // Get array of hotel IDs that are already assigned to QR codes
      // const assignedHotelIds = qrData.map((qr) => qr.hotelId).filter(Boolean);

      // Fetch all hotels with role "hotel", not filtering assigned ones yet
      const hotelQuery = query(
        collection(db, "users"),
        where("role", "==", "hotel")
      );

      const hotelSnapshot = await getDocs(hotelQuery);
      const hotelData = hotelSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().hotelName,
        area: doc.data().area
      }));
      
      setHotels(hotelData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter QR codes based on search query
  const filteredQRCodes = qrCodes.filter((qr) => {
    const hotelMatch = qr.hotelName?.toLowerCase().includes(searchQuery.toLowerCase());
    const qrMatch = qr.qrCodeNumber?.toString().includes(searchQuery);
    return hotelMatch || qrMatch;
  });

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
    if (!selectedHotel || selectedQrs.length === 0) return;

    try {
      for (const qr of selectedQrs) {
        await assignQR(
          qr.id, 
          selectedHotel.id, 
          selectedHotel.name,
          selectedHotel.area
        );
      }
      await fetchData();
      setIsReassignOpen(false);
      setSelectedQrs([]);
      setSelectedHotel(null);
      setSearchQuery("");
    } catch (error) {
      console.error("Error reassigning QR:", error);
    }
  };

  // Handle removing hotel assignment
  const handleRemoveAssignment = async (qrId: string) => {
    try {
      const qrDocRef = doc(db, "qrcodes", qrId);
      await updateDoc(qrDocRef, {
        hotelId: null,
        hotelName: null,
        assignedAt: null,
      });
      await fetchData();
    } catch (error) {
      console.error("Error removing hotel assignment:", error);
    }
  };

  // Filter hotels based on modal search query
  const filteredHotels = hotels.filter((hotel) =>
    hotel.name.toLowerCase().includes(modalSearchQuery.toLowerCase())
  );


   // Handle printing selected QR codes
   const handlePrint = () => {
    if (selectedQrs.length === 0) {
      alert("Please select QR codes to print");
      return;
    }

      const qrsToPrint = qrCodes.filter(qr => {
        const isSelected = selectedQrs.some(selectedQr => selectedQr.id === qr.id);
        return isSelected;
      });
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
      printWindow.document.write('<pre>' + printContent + '</pre>');
      printWindow.document.close();
      printWindow.print();
    } else {
      console.error("Failed to open print window");
    }
  }

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

        <div className="grid  sm:flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Selected QR Codes
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2"
          >
            <QrCodeIcon className="h-4 w-4" />
            Scan QR
          </Button>
        </div>
      </div>

      {lastScannedQr && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Last Scanned QR Code</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">QR Number</p>
              <p className="font-medium">{lastScannedQr.qrCodeNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">QR ID</p>
              <p className="font-medium">{lastScannedQr.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hotel Name</p>
              <p className="font-medium">{lastScannedQr.hotelName || "Not assigned"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Number of Scans</p>
              <p className="font-medium">{lastScannedQr.numberOfQrScans || 0}</p>
            </div>
            {lastScannedQr.assignedAt && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Assigned At</p>
                <p className="font-medium">
                  {new Date(lastScannedQr.assignedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center mb-4 bg-white rounded-lg p-1 focus-within:ring-1 ring-black">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search QR by hotel name or QR number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border-none shadow-none focus-visible:ring-0"
        />
      </div>

      <Table className="mt-10 sm:mt-0">
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox 
                checked={selectedQrs.length === qrCodes.length}
                onCheckedChange={(checked: boolean) => {
                  if (checked) {
                    setSelectedQrs(qrCodes);
                  } else {
                    setSelectedQrs([]);
                  }
                }}
              />
            </TableHead>
            <TableHead className="text-sm sm:text-base">QR Number</TableHead>
            <TableHead className="text-sm sm:text-base">QR ID</TableHead>
            <TableHead className="text-sm sm:text-base">Hotel Name</TableHead>
            <TableHead className="text-sm sm:text-base">Assigned At</TableHead>
            <TableHead className="text-sm sm:text-base">Number of Scans</TableHead>
            <TableHead className="text-sm sm:text-base">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                Loading QR codes...
              </TableCell>
            </TableRow>
          ) : filteredQRCodes.map((qr) => (
            <TableRow
              key={qr.id}
              className="cursor-pointer hover:bg-gray-50"
            >
              <TableCell>
                <Checkbox 
                  checked={selectedQrs.includes(qr)}
                  onCheckedChange={(checked: boolean) => {
                    if (checked) {
                      setSelectedQrs(prev => [...prev, qr]);
                    } else {
                      setSelectedQrs(prev => prev.filter(q => q.id !== qr.id));
                    }
                  }}
                />
              </TableCell>
              <TableCell>{qr.qrCodeNumber}</TableCell>
              <TableCell>{qr.id}</TableCell>
              <TableCell>{qr.hotelName || "Not assigned"}</TableCell>
              <TableCell>{qr.assignedAt ? new Date(qr.assignedAt).toLocaleString() : "Not assigned"}</TableCell>
              <TableCell>{qr.numberOfQrScans || 0}</TableCell>
              <TableCell>
                <Button
                  onClick={() => handleRemoveAssignment(qr.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => {
                    setSelectedQrs([qr]);
                    setIsReassignOpen(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 ml-2"
                >
                  <HotelIcon className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Reassign Dialog */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign QR Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search hotels..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filteredHotels.length > 0 ? (
                filteredHotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${
                      selectedHotel?.id === hotel.id ? "bg-orange-600/50" : ""
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
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsReassignOpen(false);
                  setSelectedHotel(null);
                  setModalSearchQuery(""); // Reset modal search query
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReassign}
                disabled={!selectedHotel}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scanner Dialog */}
      <Dialog 
        open={showScanner} 
        onOpenChange={setShowScanner}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="relative w-full h-[300px] bg-black rounded-lg overflow-hidden">
              <Scanner
                onScan={(result) => {
                  if (result && result.length > 0) {
                    const scannedUrl = result[0].rawValue;
                    const qrId = scannedUrl.includes('cravings.live/qrScan/') 
                      ? scannedUrl.split('cravings.live/qrScan/')[1]
                      : scannedUrl;

                    const foundQr = qrCodes.find(qr => qr.id === qrId);
                    if (foundQr) {
                      setLastScannedQr(foundQr);
                      setSelectedQrs([foundQr]);
                      setShowScanner(false);
                      setIsReassignOpen(true);
                    } else {
                      toast.error("QR Code not found");
                    }
                  }
                }}
                onError={(error) => {
                  console.error('Scanner error:', error);
                  toast.error("Failed to start camera. Please check permissions.");
                }}
                constraints={{
                  facingMode: 'environment'
                }}
                formats={['qr_code']}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AssignQrHotel;
