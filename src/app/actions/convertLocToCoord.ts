export default async function convertLocToCoord(url: string) {
  const response = await fetch(
    process.env.NEXT_PUBLIC_SERVER_URL + "/api/convert-coordinate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    }
  );

    const data = await response.json();

    if (!data.coordinates) {
      throw new Error("No coordinates found in response");
    }

    return data.coordinates;
}
