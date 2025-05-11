// app/api/submit-sitemap/route.ts
export async function GET() {
    const sitemapUrl = `https://www.cravings.live/sitemap/0.xml`;
    const googleUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  
    try {
      await fetch(googleUrl);
      return Response.json({ success: true });
    } catch (error) {
      return Response.json({ error: "Submission failed" }, { status: 500 });
    }
  }