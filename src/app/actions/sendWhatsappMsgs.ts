"use server";

export const sendOfferWhatsAppMsg = async (offer_id: string) => {
  try {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/offerAlert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        offer_id,
      }),
    })
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
};

export const sendRegistrationWhatsAppMsg = async (
  user_id: string,
  partner_id?: string
) => {
    console.log("Sending registration WhatsApp message");
  console.log("User ID:", user_id);
  console.log("Partner ID:", partner_id);
    
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/registrationAlert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id,
        partner_id,
      }),
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
};
