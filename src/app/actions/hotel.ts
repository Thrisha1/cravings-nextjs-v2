'use server'

import { unstable_cache } from 'next/cache';
import { getFirestore } from 'firebase-admin/firestore';

export async function updateHotelUpiId(hotelId: string, newUpiId: string) {
  const db = getFirestore();
  
  try {
    await db.collection('users').doc(hotelId).update({ upiId: newUpiId });
    
    // Invalidate cache
    await unstable_cache(
      async () => ({ timestamp: Date.now() }),
      [hotelId],
      { 
        tags: ['hotels', hotelId],
        revalidate: 0
      }
    )();
    
    return { success: true };
  } catch (error) {
    console.error('Error updating UPI ID:', error);
    throw error;
  }
} 