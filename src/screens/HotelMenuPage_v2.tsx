"use client";

import { Offer } from "@/store/offerStore_hasura";
import { HotelData, SocialLinks } from "@/app/hotels/[...id]/page";
import { ThemeConfig } from "@/components/hotelDetail/ThemeChangeButton";
import { Category } from "@/store/categoryStore_hasura";
import OrderDrawer from "@/components/hotelDetail/OrderDrawer";
import useOrderStore from "@/store/orderStore";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getFeatures } from "@/lib/getFeatures";
import { QrGroup } from "@/app/admin/qr-management/page";
import { addToRecent } from "@/lib/addToRecent";
import { getQrScanCookie, setQrScanCookie } from "@/app/auth/actions";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { INCREMENT_QR_CODE_SCAN_COUNT } from "@/api/qrcodes";
import Default from "@/components/hotelDetail/styles/Default/Default";
import Compact from "@/components/hotelDetail/styles/Compact/Compact";
import { saveUserLocation } from "@/lib/saveUserLocLocal";

export type MenuItem = {
  description: string;
  id: string;
  image: string;
  name: string;
  price: number;
};

export type Styles = {
  backgroundColor: string;
  color: string;
  accent: string;
  border: {
    borderColor: string;
    borderWidth: string;
    borderStyle: string;
  };
};

interface HotelMenuPageProps {
  offers: Offer[];
  hoteldata: HotelData;
  auth: {
    id: string;
    role: string;
  } | null;
  theme: ThemeConfig | null;
  tableNumber: number;
  socialLinks: SocialLinks;
  qrGroup?: QrGroup | null;
  qrId?: string | null;
  selectedCategory?: string;
}

const HotelMenuPage = ({
  offers,
  hoteldata,
  auth,
  theme,
  tableNumber,
  socialLinks,
  qrGroup,
  qrId,
  selectedCategory: selectedCategoryProp,
}: HotelMenuPageProps) => {
  const router = useRouter();
  const styles: Styles = {
    backgroundColor: theme?.colors?.bg || "#F5F5F5",
    color: theme?.colors?.text || "#000",
    accent: theme?.colors?.accent || "#EA580C",
    border: {
      borderColor: theme?.colors?.text ? `${theme.colors.text}1D` : "#0000001D",
      borderWidth: "1px",
      borderStyle: "solid",
    },
  };

  const { setHotelId, genOrderId, open_place_order_modal } = useOrderStore();

  const pathname = usePathname();


  useEffect(() => {
    saveUserLocation(false);
  },[]);

  useEffect(() => {
    const handleUpdateQrCount = async () => {
      if (!qrId) return;

      const canUpdateScanCount = (await getQrScanCookie(qrId)) ? false : true;

      if (canUpdateScanCount) {
        try {
          await fetchFromHasura(INCREMENT_QR_CODE_SCAN_COUNT, {
            id: qrId,
          });
          await setQrScanCookie(qrId);
        } catch (error) {
          console.error("Failed to update QR scan count:", error);
        }
      }
    };

    if (qrId) {
      handleUpdateQrCount();
    }
  }, [qrId]);

  useEffect(() => {
    if (hoteldata) {
      setHotelId(hoteldata.id);
      genOrderId();
    }
  }, [hoteldata, setHotelId, genOrderId]);

  useEffect(() => {
    if (hoteldata?.id) {
      addToRecent(hoteldata?.id);
    }
  }, [hoteldata?.id]);

  // Helper function to check if a menu item has an active offer
  const hasActiveOffer = (menuItemId: string) => {
    return offers.some((offer) => offer.menu && offer.menu.id === menuItemId);
  };

  // Helper function to get items that have active offers
  const getOfferedItems = () => {
    console.log("Debug - All offers:", offers);
    console.log("Debug - All menu items:", hoteldata?.menus);
    
    if (!hoteldata?.menus) return [];
    
    const filteredItems = hoteldata.menus.filter((item) => {
      // Convert ID to string for consistent comparison
      const itemId = String(item.id);
      const hasOffer = hasActiveOffer(itemId);
      const isActiveCategory = item.category.is_active === undefined || item.category.is_active === true;
      
      console.log(`Debug - Item ${itemId}:`, {
        name: item.name,
        hasOffer,
        isActiveCategory,
        categoryName: item.category.name,
        categoryActive: item.category.is_active
      });
      
      return hasOffer && isActiveCategory;
    });
    
    console.log("Debug - Filtered offered items:", filteredItems);
    return filteredItems;
  };

  const getCategories = () => {
    const uniqueCategoriesMap = new Map<string, Category>();

    hoteldata.menus.forEach((item) => {
      // Only add category if it's active (is_active is true) or if is_active is undefined (backward compatibility)
      if (
        !uniqueCategoriesMap.has(item.category.name) &&
        (item.category.is_active === undefined ||
          item.category.is_active === true)
      ) {
        uniqueCategoriesMap.set(item.category.name, item.category);
      }
    });

    let uniqueCategories = Array.from(uniqueCategoriesMap.values()).sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );

    // Add "Offer" category if there are items with active offers
    const offeredItems = getOfferedItems();
    if (offeredItems.length > 0) {
      // Create a virtual "Offer" category
      const offerCategory: Category = {
        id: "offer-category",
        name: "Offer",
        priority: -999, // Very low priority to ensure it comes first
        is_active: true
      };
      // Insert the offer category at the beginning and sort again
      uniqueCategories = [offerCategory, ...uniqueCategories];
    }

    return uniqueCategories;
  };

  const getCategoryItems = (selectedCategory: string) => {
    if (selectedCategory === "all") {
      return (
        hoteldata?.menus.filter(
          (item) =>
            item.category.is_active === undefined ||
            item.category.is_active === true
        ) || []
      );
    }
    
    // Handle the special "Offer" category
    if (selectedCategory === "Offer") {
      const offeredItems = getOfferedItems();
      // Sort offered items with images first
      const sortedItems = [...offeredItems].sort((a, b) => {
        if (a.image_url && a.image_url.length && (!b.image_url || !b.image_url.length)) return -1;
        if ((!a.image_url || !a.image_url.length) && b.image_url && b.image_url.length) return 1;
        return 0;
      });
      return sortedItems;
    }

    const filteredItems = hoteldata?.menus.filter(
      (item) =>
        item.category.name === selectedCategory &&
        (item.category.is_active === undefined ||
          item.category.is_active === true)
    ) || [];
    
    const sortedItems = [...filteredItems].sort((a, b) => {
      if (a.image_url && a.image_url.length && (!b.image_url || !b.image_url.length)) return -1;
      if ((!a.image_url || !a.image_url.length) && b.image_url && b.image_url.length) return 1;
      return 0;
    });
    return sortedItems;
  };

  const getTopItems = () => {
    const filteredItems = hoteldata?.menus.filter(
      (item) =>
        item.is_top === true &&
        (item.category.is_active === undefined ||
          item.category.is_active === true)
    );
    return filteredItems;
  };

  const setSelectedCategory = (category: string) => {
    if (category === "all") {
      const url = new URL(window.location.href);
      url.searchParams.delete("cat");
      router.push(url.toString(), { scroll: false });
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set("cat", category);
      router.push(url.toString(), { scroll: false });
    }
  };

  const topItems = getTopItems();
  const categories = getCategories();
  const selectedCategory = selectedCategoryProp || "all";
  const items = getCategoryItems(selectedCategory);

  

  const defaultProps = {
    offers,
    hoteldata,
    auth,
    theme,
    tableNumber,
    styles,
    socialLinks,
    qrGroup,
    qrId,
    categories,
    setSelectedCategory,
    items,
    topItems,
    open_place_order_modal: open_place_order_modal,
    pathname: pathname,
  };

  const renderPage = () => {
    switch (theme?.menuStyle) {
      case "compact":
        return <Compact {...defaultProps} />;
      default:
        return <Default {...defaultProps} />;
    }
  };

  return (
    <>
      {renderPage()}

      {/* order drawer  */}
      {((pathname.includes("qrScan") &&
        getFeatures(hoteldata?.feature_flags || "")?.ordering.enabled) ||
        (!pathname.includes("qrScan") &&
          getFeatures(hoteldata?.feature_flags || "")?.delivery.enabled)) && (
        <section>
          <OrderDrawer
            qrGroup={qrGroup}
            styles={styles}
            qrId={qrId || undefined}
            hotelData={hoteldata}
            tableNumber={tableNumber}
          />
        </section>
      )}
    </>
  );
};

export default HotelMenuPage;