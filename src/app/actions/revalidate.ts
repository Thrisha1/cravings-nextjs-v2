"use server";

import { revalidatePath as nextRevalidatePath, revalidateTag as nextRevalidateTag } from "next/cache";

export async function revalidate(path: string) {
  try {
    nextRevalidatePath(path);
    return { success: true };
  } catch (error) {
    console.error('Revalidation error:', error);
    return { success: false, error };
  }
}

export async function revalidateTag(tag: string) {
  try {
    nextRevalidateTag(tag);
    return { success: true };
  } catch (error) {
    console.error('Tag revalidation error:', error);
    return { success: false, error };
  }
}
