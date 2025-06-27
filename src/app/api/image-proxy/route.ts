import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Extract the dish parameter from the URL
    const searchParams = request.nextUrl.searchParams;
    const dish = searchParams.get('dish');
    
    if (!dish) {
      return NextResponse.json({ error: 'Missing dish parameter' }, { status: 400 });
    }
    
    // Forward the request to the local server
    const targetUrl = `http://localhost:5000/search?dish=${encodeURIComponent(dish)}`;  
    console.log('Proxying request to:', targetUrl);
    
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Return the response from the target server
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: `Failed to fetch images: ${error.message}` }, 
      { status: 500 }
    );
  }
} 