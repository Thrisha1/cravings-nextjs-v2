export function formatDate(input: string): string {
  const date = new Date(input);

  // Convert to IST manually
  const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
  const istDate = new Date(date.getTime() + IST_OFFSET);

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  };

  return istDate.toLocaleString("en-US", options).replace(",", "");
}
