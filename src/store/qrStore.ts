// useQRStore.ts
import { create } from 'zustand';
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Define the shape of the QR code state
interface QRState {
  qrCodes: { hotelId?: string; hotelName?: string; assignedAt?: string; createdAt: string; qrCodeNumber?: number; numberOfQrScans?: number }[];
  loading: boolean;
  error: string | null;
  createQR: (count: number) => Promise<string[]>;
  assignQR: (docId: string, hotelId: string, hotelName: string) => Promise<void>;
  fetchQR: (docId: string) => Promise<DocumentData | null>;
  reassignQR: (docId: string, newHotelId: string) => Promise<void>;
  removeQR: (docId: string) => Promise<void>;
}

// Create the Zustand store
export const useQRStore = create<QRState>((set) => ({
  qrCodes: [], // Local state for QR codes
  loading: false,
  error: null,

  // Function to create multiple QR codes
  createQR: async (count: number) => {
    set({ loading: true, error: null });
    try {
      const createdIds: string[] = [];
      
      // Get current count of QR codes
      const qrSnapshot = await getDocs(collection(db, 'qrcodes'));
      let currentCount = qrSnapshot.size;

      for(let i = 0; i < count; i++) {
        currentCount++;
        const qrData = {
          createdAt: new Date().toISOString(),
          qrCodeNumber: currentCount,
          numberOfQrScans: 0
        };

        // Add the QR code data to Firestore
        const docRef = await addDoc(collection(db, 'qrcodes'), qrData);
        createdIds.push(docRef.id);

        // Update local state
        set((state) => ({ qrCodes: [...state.qrCodes, qrData] }));
      }

      set({ loading: false });
      return createdIds; // Return array of generated document IDs
    } catch (err) {
      set({ error: 'Failed to create QR codes', loading: false });
      throw err;
    }
  },

  // Function to assign a QR code to a hotel
  assignQR: async (docId: string, hotelId: string, hotelName: string) => {
    set({ loading: true, error: null });
    try {
      const qrData = {
        hotelId,
        hotelName,
        assignedAt: new Date().toISOString(),
      };

      const qrDocRef = doc(db, 'qrcodes', docId);
      await updateDoc(qrDocRef, qrData);

      // Update local state
      set((state) => ({
        qrCodes: state.qrCodes.map((qr) => 
          qr.hotelId === docId ? { ...qr, ...qrData } : qr
        ),
        loading: false
      }));
    } catch (err) {
      set({ error: 'Failed to assign QR code', loading: false });
      throw err;
    }
  },

  // Function to fetch a QR code by its ID
  fetchQR: async (docId: string) => {
    set({ loading: true, error: null });
    try {
      const qrDocRef = doc(db, 'qrcodes', docId);
      const qrDoc = await getDoc(qrDocRef);

      if (qrDoc.exists()) {
        set({ loading: false });
        return qrDoc.data(); // Return the QR code data
      } else {
        set({ error: 'QR code not found', loading: false });
        return null;
      }
    } catch (err) {
      set({ error: 'Failed to fetch QR code', loading: false });
      throw err;
    }
  },

  // Function to reassign a QR code to a different hotel
  reassignQR: async (docId: string, newHotelId: string) => {
    set({ loading: true, error: null });
    try {
      const qrDocRef = doc(db, 'qrcodes', docId);
      await updateDoc(qrDocRef, { 
        hotelId: newHotelId,
        assignedAt: new Date().toISOString()
      });

      // Update local state
      set((state) => ({
        qrCodes: state.qrCodes.map((qr) =>
          qr.hotelId === newHotelId ? { ...qr, assignedAt: new Date().toISOString() } : qr
        ),
        loading: false,
      }));
    } catch (err) {
      set({ error: 'Failed to reassign QR code', loading: false });
      throw err;
    }
  },

  // Function to remove a QR code
  removeQR: async (docId: string) => {
    set({ loading: true, error: null });
    try {
      const qrDocRef = doc(db, 'qrcodes', docId);
      await deleteDoc(qrDocRef);

      // Update local state
      set((state) => ({
        qrCodes: state.qrCodes.filter((qr) => qr.hotelId !== docId),
        loading: false,
      }));
    } catch (err) {
      set({ error: 'Failed to remove QR code', loading: false });
      throw err;
    }
  },


}));