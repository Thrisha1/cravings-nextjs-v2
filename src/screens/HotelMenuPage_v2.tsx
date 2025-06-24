"use client";


import { Offer } from "@/store/offerStore_hasura";
import { HotelData, SocialLinks } from "@/app/hotels/[...id]/page";
import {
  ThemeConfig,
} from "@/components/hotelDetail/ThemeChangeButton";
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

    const uniqueCategories = Array.from(uniqueCategoriesMap.values()).sort(
      (a, b) => (a.priority || 0) - (b.priority || 0)
    );
    return uniqueCategories;
  };

  const getCategoryItems = (selectedCategory: string) => {
    const filteredItems = hoteldata?.menus.filter(
      (item) =>
        item.category.name === selectedCategory &&
        (item.category.is_active === undefined ||
          item.category.is_active === true)
    );
    const sortedItems = [...filteredItems].sort((a, b) => {
      if (a.image_url.length && !b.image_url.length) return -1;
      if (!a.image_url.length && b.image_url.length) return 1;
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
  const selectedCategory = "all";
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
