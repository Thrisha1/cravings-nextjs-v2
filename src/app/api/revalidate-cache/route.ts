import { unstable_cache } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Missing hotel ID' },
        { status: 400 }
      );
    }

    // Create a new cache key to force revalidation
    const timestamp = Date.now();
    await unstable_cache(
      async () => ({ timestamp }),
      [id],
      { tags: [id] }
    )();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error revalidating cache:', err);
    return NextResponse.json(
      { message: 'Error revalidating cache' },
      { status: 500 }
    );
  }
} 