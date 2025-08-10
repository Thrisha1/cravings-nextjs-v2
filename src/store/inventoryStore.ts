import { create } from "zustand";
import { getAuthCookie } from "@/app/auth/actions";
import { fetchFromHasura } from "@/lib/hasuraClient";
import {
  createNewPurchaseItemQuery,
  createNewPurchaseQuery,
  createNewPurchaseTransactionQuery,
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
  purchase_items?:
    | {
        id: string;
        name: string;
        quantity: number;
        unit_price: number;
      }[]
    | null;
}

interface InventoryStore {
  purchases: PartnerPurchase[];
  totalAmountThisMonth: number;
  isLoading: boolean;
  page: number;
  hasMore: boolean;
  initialLoadFinished: boolean;
  selectedPurchase: PartnerPurchase | null;
  isCreatePurchasePage: boolean;
  isCreatingSupplier: boolean;
  isCreatingPurchase: boolean;
  setIsCreatePurchasePage: (value: boolean) => void;
  selectPurchase: (purchase: PartnerPurchase) => void;
  clearSelectedPurchase: () => void;
  fetchPaginatedPurchases: () => Promise<void>;
  fetchTotalAmountThisMonth: () => Promise<void>;
  clearPurchases: () => void;
  createNewPurchase: (
    currentPurchase: Partial<PartnerPurchase>
  ) => Promise<void>;
  createNewSupplier: (
    currentPurchase: Partial<PartnerPurchase>
  ) => Promise<void>;
  createNewPurchaseTransaction: (
    purchase: Partial<PartnerPurchase>
  ) => Promise<void>;
  createNewPurchaseItem: (
    currentPurchase: Partial<PartnerPurchase>
  ) => Promise<{ purchase_items: Partial<PurchaseItem>[] }>;
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
  isCreatePurchasePage: false,
  isCreatingSupplier: false,
  isCreatingPurchase: false,

  setIsCreatePurchasePage: (value) => set({ isCreatePurchasePage: value }),

  selectPurchase: (purchase) => set({ selectedPurchase: purchase }),
  clearSelectedPurchase: () =>
    set({ selectedPurchase: null, isCreatePurchasePage: false }),

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

  createNewSupplier: async (purchase) => {
    const { isCreatingSupplier } = get();
    if (isCreatingSupplier || !purchase.supplier?.isNew) return;

    set({ isCreatingSupplier: true });

    try {
      const cookies = await getAuthCookie();
      if (!cookies || cookies.role !== "partner") {
        throw new Error("Unauthorized");
      }

      const { supplier } = await fetchFromHasura(createNewSupplierQuery, {
        id: purchase.supplier?.id,
        name: purchase.supplier?.name
          ?.trim()
          .toLowerCase()
          .replace(/\s+/g, "_"),
        phone: purchase.supplier?.phone,
        address: purchase.supplier?.address,
        partner_id: cookies.id,
      });

      console.log("New supplier created:", supplier);

      console.log("Creating a new supplier...");
    } catch (error) {
      throw error;
    } finally {
      set({ isCreatingSupplier: false });
    }
  },

  createNewPurchaseItem: async (currentPurchase) => {
    try {
      const cookies = await getAuthCookie();
      if (!cookies || cookies.role !== "partner") {
        throw new Error("Unauthorized");
      }

      const items = currentPurchase.purchase_items?.map((item) => ({
        id: item.id,
        name: item.name.trim().toLowerCase().replace(/\s+/g, "_"),
        partner_id: cookies.id,
      }));

      const { insert_purchase_items } = await fetchFromHasura(
        createNewPurchaseItemQuery,
        { items: items }
      );

      return {
        purchase_items: insert_purchase_items.returning,
      };

    } catch (error) {
      throw error;
    }
  },

  createNewPurchaseTransaction: async (purchase) => {
    try {
      const cookies = await getAuthCookie();
      if (!cookies || cookies.role !== "partner") {
        throw new Error("Unauthorized");
      }

      const transactions = purchase.purchase_items?.map((item) => ({
        purchase_id: purchase.id,
        item_id: item.id,
        partner_id: cookies?.id,
        supplier_id: purchase.supplier?.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const { purchase_transaction } = await fetchFromHasura(
        createNewPurchaseTransactionQuery,
        { transactions }
      );

      console.log("New purchase transaction created:", purchase_transaction);
    } catch (error) {
      throw error;
    }
  },

  createNewPurchase: async (currentPurchase) => {
    const { isCreatingPurchase } = get();
    if (isCreatingPurchase) return;

    set({ isCreatingPurchase: true, selectedPurchase: null });

    const cookies = await getAuthCookie();
    if (!cookies || cookies.role !== "partner") {
      throw new Error("Unauthorized");
    }

    try {
      await get().createNewSupplier(currentPurchase);
      const { purchase_items } = await get().createNewPurchaseItem(
        currentPurchase
      );
      const { insert_purchases_one } = await fetchFromHasura(
        createNewPurchaseQuery,
        {
          id: currentPurchase.id,
          partner_id: cookies.id,
          supplier_id: currentPurchase.supplier?.id,
          total_price: currentPurchase.total_price,
          purchase_date: currentPurchase.purchase_date,
        }
      );
      await get().createNewPurchaseTransaction({
        ...currentPurchase,
        purchase_items: currentPurchase.purchase_items?.map((item) => ({
          ...item,
          id: purchase_items.find((i) => i.name === item.name)?.id || item.id,
        })),
      });

      set({
        selectedPurchase: insert_purchases_one,
        isCreatePurchasePage: false,
      });
    } catch (error) {
      throw error;
    } finally {
      set({ isCreatingPurchase: false });
    }
  },
}));
