import { FeatureFlags } from "@/screens/HotelMenuPage_v2";

export const getFeatures = (perm: string) => {
  const permissions: FeatureFlags = {
    ordering: {
      access: false,
      enabled: false,
    },
    delivery: {
      access: false,
      enabled: false,
    },
    multiwhatsapp: {
      access: false,
      enabled: false,
    },
    pos: {
      access: false,
      enabled: false,
    },
    stockmanagement: {
      access: false,
      enabled: false,
    },
  };

  if (perm) {
    const parts = perm.split(",");

    for (const part of parts) {
      const [key, value] = part.split("-");

      if (key === "ordering") {
        permissions.ordering.access = true;
        permissions.ordering.enabled = value === "true";
      } else if (key === "delivery") {
        permissions.delivery.access = true;
        permissions.delivery.enabled = value === "true";
      } else if (key === "multiwhatsapp") {
        permissions.multiwhatsapp.access = true;
        permissions.multiwhatsapp.enabled = value === "true";
      }else if (key === "pos") {
        permissions.pos.access = true;
        permissions.pos.enabled = value === "true";
      }else if (key === "stockmanagement") {
        permissions.stockmanagement.access = true;
        permissions.stockmanagement.enabled = value === "true";
      }
    }
  }

  return permissions;
};