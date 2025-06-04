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
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
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