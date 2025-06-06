import { fetchFromHasura } from "@/lib/hasuraClient";

export async function sendOrderNotification(
  orderId: string,
  PartnerId: string
): Promise<void> {
  try {
    const { device_tokens } = await fetchFromHasura(
      `
            query GetDeviceTokens($PartnerId: String!) {
                device_tokens(where: { user_id: { _eq: $PartnerId } }) {
                    device_token
                }
            }
            `,
      { PartnerId }
    );

    if (!device_tokens || device_tokens.length === 0) {
      console.warn(`No device tokens found for PartnerId: ${PartnerId}`);
      return;
    }

    const token = device_tokens[0].device_token;

    const data = {
      token,
      title: "New Order Notification",
      body: `New order has been placed with ID: ${orderId}`,
    };    

    const response = await fetch(
      "https://notification-server-khaki.vercel.app/api/notifications/send-to-device",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log(
      `Notification sent successfully for order ${orderId}:`,
      responseData
    );
  } catch (error) {
    console.error(`Failed to send notification for order ${orderId}:`, error);
  }
}
