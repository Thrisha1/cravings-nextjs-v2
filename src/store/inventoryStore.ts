import { create } from "zustand";
import { getAuthCookie } from "@/app/auth/actions";
import { fetchFromHasura } from "@/lib/hasuraClient";
import {
  createNewPurchaseItemQuery,
  createNewSupplierQuery,
  GetMonthlyTotalQuery,
  GetPaginatedPurchasesQuery,
} from "@/api/inventory";

export interface PartnerPurchaseTransaction extends PurchaseTransaction {
  purchase_item: PurchaseItem;
}

export interface PartnerPurchase extends Purchase {
  supplier: Supplier;
  purchase_transactions: PartnerPurchaseTransaction[];
}

interface InventoryStore {
  purchases: PartnerPurchase[];
  totalAmountThisMonth: number;
  isLoading: boolean;
  page: number;
  hasMore: boolean;
  initialLoadFinished: boolean;
  selectedPurchase: PartnerPurchase | null;
  isCreatingPurchase: boolean;
  isCreatingSupplier: boolean;
  currentPurchase: Partial<PartnerPurchase> | null;
  startCreatingPurchase: () => void;
  cancelCreatingPurchase: () => void;
  selectPurchase: (purchase: PartnerPurchase) => void;
  clearSelectedPurchase: () => void;
  fetchPaginatedPurchases: () => Promise<void>;
  fetchTotalAmountThisMonth: () => Promise<void>;
  clearPurchases: () => void;
  createNewPurchase: () => void;
  createNewSupplier: (supplier: Omit<Supplier, "id" | "partner_id" | "created_at">) => void;
  createNewPurchaseItem: (item: Omit<PurchaseItem, "id">) => void;
}

const PAGE_SIZE = 15;

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  purchases: [],
  totalAmountThisMonth: 0,
  isLoading: false,
  page: 0,
  hasMore: true,
  initialLoadFinished: false,
  selectedPurchase: null,
  isCreatingPurchase: false,
  isCreatingSupplier: false,
  currentPurchase: null,

  startCreatingPurchase: () =>
    set({ isCreatingPurchase: true, selectedPurchase: null }),
  cancelCreatingPurchase: () => set({ isCreatingPurchase: false }),

  selectPurchase: (purchase) => set({ selectedPurchase: purchase }),
  clearSelectedPurchase: () =>
    set({ selectedPurchase: null, isCreatingPurchase: false }),

  clearPurchases: () =>
    set({
      purchases: [],
      page: 0,
      hasMore: true,
      initialLoadFinished: false,
      selectedPurchase: null,
      isCreatingPurchase: false,
    }),

  fetchTotalAmountThisMonth: async () => {
    try {
      const cookies = await getAuthCookie();
      if (!cookies || cookies.role !== "partner") {
        throw new Error("Unauthorized");
      }

      const now = new Date();
      const startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      const endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).toISOString();

      const data = await fetchFromHasura(GetMonthlyTotalQuery, {
        partnerId: cookies.id,
        startDate,
        endDate,
      });

      const total = data.purchases_aggregate.aggregate.sum.total_price || 0;
      set({ totalAmountThisMonth: total });
    } catch (error) {
      console.error("Failed to fetch monthly total:", error);
    }
  },

  fetchPaginatedPurchases: async () => {
    const { isLoading, hasMore } = get();
    if (isLoading || !hasMore) return;

    set({ isLoading: true });

    try {
      const cookies = await getAuthCookie();
      if (!cookies || cookies.role !== "partner") {
        throw new Error("Unauthorized");
      }

      const data = await fetchFromHasura(GetPaginatedPurchasesQuery, {
        partnerId: cookies.id,
        limit: PAGE_SIZE,
        offset: get().page * PAGE_SIZE,
      });

      const newPurchases = data.purchases as PartnerPurchase[];

      set({
        purchases: [...get().purchases, ...newPurchases],
        page: get().page + 1,
        hasMore: newPurchases.length === PAGE_SIZE,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch purchases:", error);
      set({ isLoading: false });
    } finally {
      set({ initialLoadFinished: true });
    }
  },

  createNewSupplier: async (sup) => {
    const { isCreatingSupplier } = get();
    if (isCreatingSupplier) return;

    set({ isCreatingSupplier: true });

    try {
      const cookies = await getAuthCookie();
      if (!cookies || cookies.role !== "partner") {
        throw new Error("Unauthorized");
      }

      const { supplier } = await fetchFromHasura(createNewSupplierQuery, {
        name: sup.name,
        phone: sup.phone,
        address: sup.address,
        partner_id: cookies.id,
      });

      console.log("New supplier created:", supplier);

      console.log("Creating a new supplier...");
    } catch (error) {
      console.error("Failed to create new supplier:", error);
    } finally {
      set({ isCreatingSupplier: false });
    }
  },

  createNewPurchaseItem: async (item) => {
    try {
      const cookies = await getAuthCookie();
      if (!cookies || cookies.role !== "partner") {
        throw new Error("Unauthorized");
      }

      const { purchase_item } = await fetchFromHasura(createNewPurchaseItemQuery, {
        ...item,
        partner_id: cookies.id,
        supplier_id: get().currentPurchase?.supplier_id,
      });

      console.log("New purchase item created:", purchase_item);
    } catch (error) {
      console.error("Failed to create new purchase item:", error);
    }
  },

  createNewPurchase: async () => {
    const { isCreatingPurchase } = get();
    if (isCreatingPurchase) return;

    set({ isCreatingPurchase: true, selectedPurchase: null });

    console.log("Creating a new purchase..." , get().currentPurchase);

    try {
      console.log("Creating a new purchase...");
    } catch (error) {
      console.error("Failed to create new purchase:", error);
    } finally {
      set({ isCreatingPurchase: false });
    }
  },
}));
