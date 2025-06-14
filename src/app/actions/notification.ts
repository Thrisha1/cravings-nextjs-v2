import { fetchFromHasura } from "@/lib/hasuraClient";
import { Order } from "@/store/orderStore";
import { getAuthCookie } from "../auth/actions";
import { OrderStatusHistoryTypes } from "@/lib/statusHistory";

const BASE_URL = "https://notification-server-khaki.vercel.app";

const getMessage = (
  title: string,
  body: string,
  tokens: string[],
  data?: any,
  soundAndroid?: string,
  soundIOS?: string
) => {
  return {
    tokens: tokens,
    notification: {
      title: title || "New Notification",
      body: body || "You have a new message",
    },
    android: {
      notification: {
        icon: "ic_stat_logo",
        sound: soundAndroid || "custom_sound",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: soundIOS || "custom_sound.aiff",
        },
      },
    },
    data: data || {},
  };
};

const findPlatform = () => {
  if (window.navigator.userAgent.includes("Android")) {
    return "android";
  }
  if (window.navigator.userAgent.includes("iPhone") || window.navigator.userAgent.includes("iPad")) {
    return "ios";
  }
  return "unknown";
};

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

    const { insert_device_tokens_one } = await fetchFromHasura(
      `
          mutation InsertOrUpdateDeviceToken($object: device_tokens_insert_input!) {
            insert_device_tokens_one(
              object: $object,
              on_conflict: {
                constraint: device_tokens_user_id_device_token_key,
                update_columns: [platform, updated_at] 
              }
            ) {
              id
            }
          }
      `,
      {
        object: {
          device_token: token,
          user_id: user.id,
          platform: findPlatform(),
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      }
    );

    if (insert_device_tokens_one?.id === null) {
      console.error("Failed to save token");
      return;
    } else {
      window.localStorage.setItem("tokenId", insert_device_tokens_one.id);
    }
  }

  async remove() {
    const tokenId = window.localStorage.getItem("tokenId");
    if (!tokenId) {
      return;
    }

    const { delete_device_tokens } = await fetchFromHasura(
      `
      mutation DeleteDeviceToken($tokenId: uuid!) {
        delete_device_tokens(where: {id: {_eq: $tokenId}}) {
          affected_rows
        }
      }
    `,
      {
        tokenId,
      }
    );

    if (delete_device_tokens?.affected_rows === 0) {
      console.error("Failed to remove token");
    }
  }
}

class PartnerNotification {
  async sendOrderNotification(order: Order) {
    const partnerId = order.partnerId;

    const { device_tokens } = await fetchFromHasura(
      `
      query GetPartnerDeviceTokens($partnerId: uuid!) {
        device_tokens(where: {user_id: {_eq: $partnerId}}) {
          device_token
        }
      }
    `,
      {
        partnerId,
      }
    );

    const tokens = device_tokens?.map(
      (token: { device_token: string }) => token.device_token
    );

    if (tokens.length === 0) {
      return;
    }

    const orderItemsDesc = order.items.map((item) => `${item.name} x ${item.quantity}`).join(", ");

    const message = getMessage("New Order Of", `You have a new order of ${orderItemsDesc}`, tokens);

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

class UserNotification {
  async sendOrderStatusNotification(order: Order , status: string) {
    const user = order.userId;

    const { device_tokens } = await fetchFromHasura(
      `
      query GetUserDeviceTokens($userId: uuid!) {
        device_tokens(where: {user_id: {_eq: $userId}}) {
          device_token
        }
      }
    `,
      {
        userId: user,
      }
    );

    const tokens = device_tokens?.map(
      (token: { device_token: string }) => token.device_token
    );

    if (tokens.length === 0) {
      return;
    }
    

    const message = getMessage(
      `Order ${status} `,
      `Your order has been ${status} by ${order.partner?.store_name}`,
      tokens,
      undefined,
      "default",
    );

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
      console.error("Failed to send order status notification");
    }
  }
}

export const Notification = {
  partner: new PartnerNotification(),
  user: new UserNotification(),
  token: new Token(),
};
