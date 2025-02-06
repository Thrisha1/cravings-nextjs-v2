import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const count = searchParams.get('count') || '9';
  const offset = searchParams.get('offset') || '0';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    console.error('Brave API key is missing');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const braveResponse = await fetch(
      `https://api.search.brave.com/v1/images/search?q=${encodeURIComponent(query)}&count=${count}&offset=${offset}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (compatible; BraveSearch/1.0)',
        },
        cache: 'no-store',
      }
    );

    if (!braveResponse.ok) {
      const errorText = await braveResponse.text();
      console.error('Brave API error:', {
        status: braveResponse.status,
        statusText: braveResponse.statusText,
        error: errorText,
        query,
      });
      
      if (braveResponse.status === 403) {
        return NextResponse.json(
          { error: 'Invalid API key or authentication error. Please check your Brave API key configuration.' }, 
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: `Image search failed: ${braveResponse.statusText}` }, 
        { status: braveResponse.status }
      );
    }

    const data = await braveResponse.json();
    
    const transformedData = {
      images: data.images?.map((img: any) => ({
        url: img.url || img.source,
        thumbnail: img.thumbnail || img.url,
        title: img.title,
        source_url: img.source_url || img.url,
      })) || [],
      total: data.total || 0,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Brave API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch images' }, 
      { status: 500 }
    );
  }
}