'use server'

import { doc, getDoc } from "firebase/firestore";
import { unstable_cache } from 'next/cache';
import { UpiData } from "@/store/authStore";
import { db } from "@/lib/firebase";

export const getCachedUpiData = async (userId: string): Promise<UpiData | null> => {
  return unstable_cache(
    async () => {
      try {
        const docRef = doc(db, "upi_ids", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as UpiData;
        }
        return null;
      } catch (error) {
        console.error('Error fetching UPI data:', error);
        return null;
      }
    },
    [`upi-${userId}`],
    {
      tags: [`user-${userId}`],
      revalidate: 3600,
    }
  )();
}; 