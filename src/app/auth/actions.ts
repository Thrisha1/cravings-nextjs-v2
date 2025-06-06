'use server';

import { cookies } from 'next/headers';
import { encryptText, decryptText } from '@/lib/encrtption';

export const getAuthCookie = async () => {
  const cookie = (await cookies()).get('auth_token')?.value;
  return cookie ? decryptText(cookie) as { id: string; role: string , feature_flags: string , status : string } : null;
};

export const setAuthCookie = async (data: { id: string; role: string , feature_flags : string , status : string }) => {
  const encrypted = encryptText(data);
  (await cookies()).set('auth_token', encrypted, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'none',
  });
};

export const removeAuthCookie = async () => {
  (await cookies()).delete('auth_token');
};

export const updateAuthCookie = async (updates: Partial<{ id: string; role: string, feature_flags: string, status: string }>) => {
  const currentCookie = await getAuthCookie();
  
  if (!currentCookie) {
    throw new Error('No auth cookie found to update');
  }

  const updatedData = {
    ...currentCookie,
    ...updates
  };

  await setAuthCookie(updatedData);
  return updatedData;
};

export const setLocationCookie = async (lat : number , lng : number) => {

  const locationData = { lat, lng };
  const stringified = JSON.stringify(locationData);

  (await cookies()).set('location', stringified, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export const getLocationCookie = async () => {
  const cookie = (await cookies()).get('location')?.value;
  return cookie ? JSON.parse(cookie) as { lat: number; lng: number } : null;
};

export const removeLocationCookie = async () => {
  (await cookies()).delete('location');
};


export const setQrScanCookie = async (qrId: string) => {

  (await cookies()).set(`block_scan_${qrId}`, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
  });
};

export const getQrScanCookie = async (qrId: string) => {
  const cookie = (await cookies()).get(`block_scan_${qrId}`)?.value;
  return cookie === 'true';
};

export const removeQrScanCookie = async (qrId: string) => {
  (await cookies()).delete(`block_scan_${qrId}`);
};


export const clearAllCookies = async () => {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  for (const cookie of allCookies) {
    cookieStore.delete(cookie.name);
  }
}