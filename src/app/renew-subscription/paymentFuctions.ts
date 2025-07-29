"use server";

import { cookies } from "next/headers";

export type OrderPayload = {
  client_id: string;
  amount: string;
  order_id: string;
  callback_url: string;
  customer_details: {
    email: string;
    mobile: string;
    name: string;
  };
};

export const paymentAuth = async () => {
  try {
    const response = await fetch(`https://apps.typof.in/api/external/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      }),
    });

    const data = await response.json();

    if (!data || !data.access_token) {
      throw new Error(
        data.error || "Invalid response from the payment gateway."
      );
    }

    //set cookie
    (await cookies()).set("payment_access_token", data.access_token, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 1, // 1 days
    });

    console.log("Payment access token set successfully.");
  } catch (err: any) {
    console.error("Payment authentication failed:", err);
    throw new Error("Payment authentication failed. Please try again later.");
  }
};

export const createPayment = async (
  orderPayload: Omit<OrderPayload, "client_id">
) => {
  try {
    const accessToken = (await cookies()).get("payment_access_token")?.value;

    if (!accessToken) {
      throw new Error(
        "Payment access token is not set. Please authenticate first."
      );
    }

    const response = await fetch(
      `https://apps.typof.in/api/external/create-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...orderPayload,
          client_id: process.env.CLIENT_ID,
        }),
      }
    );

    const data = await response.json();

    if (!data || !data.status || !data.order_slug) {
      throw new Error(
        data.error || "Invalid response from the payment gateway."
      );
    }

    (await cookies()).set("order_slug", data.order_slug, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 1, // 1 day
    });

    (await cookies()).set("order_id", data.order_id, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 1, // 1    day
    });

    
    const qrdata = await createQr(data.order_slug);
    
    if (!qrdata) {
        throw new Error("Failed to create QR code for the payment order.");
    }

    (await cookies()).set("order_ref_id", qrdata.ref_id, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 1, // 1 day
    });
    
    return qrdata;
  } catch (err: any) {
    console.error("Payment creation failed:", err);
    throw new Error("Payment creation failed. Please try again later.");
  }
};

export const createQr = async (slug: string) => {
  try {
    if (!slug) {
      throw new Error("Slug is required to create a QR code.");
    }

    const accessToken = (await cookies()).get("payment_access_token")?.value;

    if (!accessToken) {
      throw new Error(
        "Payment access token is not set. Please authenticate first."
      );
    }

    const response = await fetch(
      `https://apps.typof.com/api/external/generate-qr`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          client_id: process.env.CLIENT_ID,
          slug: slug,
        }),
      }
    );

    const data = await response.json();

    if (!data || !data.qrcode) {
      throw new Error(
        data.error || "Invalid response from the QR code generation endpoint."
      );
    }

    return data;
  } catch (err: any) {
    console.error("QR creation failed:", err);
    throw new Error("QR creation failed. Please try again later.");
  }
};

export const checkPaymentStatus = async () => {
  try {
    const accessToken = (await cookies()).get("payment_access_token")?.value;

    if (!accessToken) {
      throw new Error(
        "Payment access token is not set. Please authenticate first."
      );
    }

    const order_slug = (await cookies()).get("order_slug")?.value;

    if (!order_slug) {
      throw new Error(
        "Order slug is not set. Please create a payment order first."
      );
    }

    const refId = (await cookies()).get("order_ref_id")?.value;

    if (!refId) {
      throw new Error(
        "Order reference ID is not set. Please create a payment order first."
      );
    }

    const response = await fetch(
      `https://apps.typof.com/api/external/check-qr-status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          client_id: process.env.CLIENT_ID,
          slug: order_slug,
          ref_id: refId,
        }),
      }
    );

    const data = await response.json();

    if (!data || !data.status) {
      throw new Error(
        data.error || "Invalid response from the payment status check."
      );
    }

    return data;
  } catch (err: any) {
    console.error("Payment status check failed:", err);
    throw new Error("Payment status check failed. Please try again later.");
  }
};
