"use server";

import puppeteer from "puppeteer";

interface Coordinates {
  lat: number;
  lon: number;
}

export async function resolveShortUrl(shortUrl: string): Promise<string> {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(shortUrl, { waitUntil: "networkidle2" });

    const finalUrl = page.url();
    await browser.close();

    return finalUrl;
  } catch (e) {
    return shortUrl;
  }
}

export async function extractLatLonFromGoogleMapsUrl(url: string): Promise<Coordinates | null> {
  const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;

  const match = url.match(regex);

  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    return { lat, lon };
  }

  return null
}
