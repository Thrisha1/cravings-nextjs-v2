import { fetchFromHasura } from "@/lib/hasuraClient";
import { Order } from "@/store/orderStore";
import { getAuthCookie } from "../auth/actions";

const BASE_URL = "https://notification-server-khaki.vercel.app";

const getMessage = (title: string, body: string , tokens: string[], data?: any) => {
  return {
    tokens: tokens,
    notification: {
      title: title || "New Notification",
      body: body || "You have a new message",
    },
    android: {
      notification: {
        icon: "ic_stat_logo",
        sound: "custom_sound",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "custom_sound.aiff",
        },
      },
    },
    data: data || {},
  }
}

class Token {
  async save() {
    const tokenId = window.localStorage.getItem("tokenId");
    if (tokenId) {
      return;
    }

    const token = window.localStorage.getItem("fcmToken");
    const user = await getAuthCookie();

    if (!token || !user) {
      return;
    }

    const { insert_device_tokens } = await fetchFromHasura(`
        mutation {
          insert_device_tokens(objects: {token: $token, user_id: $userId}) {
            returning {
              id
            }
          }
        }
      `,
      {
        token,
        userId: user.id,
      }
    )

    if (insert_device_tokens?.id === null) {
      console.error("Failed to save token");
      return;
    }else{
      window.localStorage.setItem("tokenId", insert_device_tokens.id);
    }
  }

  async remove() {
    const tokenId = window.localStorage.getItem("tokenId");
    if (!tokenId) {
      return;
    }

    const { delete_device_tokens } = await fetchFromHasura(`
      mutation {
        delete_device_tokens(where: {id: {_eq: $tokenId}}) {
          affected_rows
        }
      }
    `,
    {
      tokenId,
    }
    )

    if (delete_device_tokens?.affected_rows === 0) {
      console.error("Failed to remove token");
    }
  }
}

class PartnerNotification {

  async sendOrderNotification(order: Order) {
    
    const partnerId = order.partnerId;

    const { device_tokens } = await fetchFromHasura(`
      query {
        device_tokens(where: {partner_id: {_eq: $partnerId}}) {
          token
        }
      }
    `,
    {
      partnerId,
    }
    )

    const tokens = device_tokens?.map((token: { token: string }) => token.token);

    const message = getMessage("New Order", "You have a new order" , tokens);

    const response = await fetch(`${BASE_URL}/api/notifications/send`, {
      method: "POST",
      body: JSON.stringify({
        message: message,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to send order notification");
    }

  }
}

export const Notification = {
  partner: new PartnerNotification(),
  token: new Token()
};
