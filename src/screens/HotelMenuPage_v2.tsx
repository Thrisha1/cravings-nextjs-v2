"use client";

import MenuItemsList from "@/components/hotelDetail/MenuItemsList_v2";
import { Offer } from "@/store/offerStore_hasura";
import { HotelData, SocialLinks } from "@/app/hotels/[id]/page";
import ThemeChangeButton, {
  ThemeConfig,
} from "@/components/hotelDetail/ThemeChangeButton";

import DescriptionWithTextBreak from "@/components/DescriptionWithTextBreak";
import { Category } from "@/store/categoryStore_hasura";
import PopularItemsList from "@/components/hotelDetail/PopularItemsList";
import OfferList from "@/components/hotelDetail/OfferList";
import SearchMenu from "@/components/hotelDetail/SearchMenu";
import HotelBanner from "@/components/hotelDetail/HotelBanner";
import RateThis from "@/components/RateThis";
import OrderDrawer from "@/components/hotelDetail/OrderDrawer";
import useOrderStore from "@/store/orderStore";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import SocialLinkList from "@/components/SocialLinkList";
import AuthModal from "@/components/hotelDetail/AuthModal";

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
}

export type FeatureFlags = {
  ordering: {
    access: boolean;
    enabled: boolean;
  };
  delivery: {
    access: boolean;
    enabled: boolean;
  };
  multiwhatsapp: {
    access: boolean;
    enabled: boolean;
  };
};

export const getFeatures = (perm: string) => {
  // Initialize default permissions
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
      }
    }
  }

  return permissions;
};

export const revertFeatureToString = (features: FeatureFlags): string => {
  const parts: string[] = [];

  if (features.ordering.access) {
    parts.push(`ordering-${features.ordering.enabled}`);
  }

  if (features.delivery.access) {
    parts.push(`delivery-${features.delivery.enabled}`);
  }

  if (features.multiwhatsapp.access) {
    parts.push(`multiwhatsapp-${features.multiwhatsapp.enabled}`);
  }

  return parts.join(",");
};

const HotelMenuPage = ({
  offers,
  hoteldata,
  auth,
  theme,
  tableNumber,
  socialLinks,
}: HotelMenuPageProps) => {
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

  const { setHotelId, genOrderId } = useOrderStore();

  const pathname = usePathname();

  useEffect(() => {
    if (hoteldata) {
      setHotelId(hoteldata.id);
      genOrderId();
    }
  }, []);

  const getCategories = () => {
    const uniqueCategoriesMap = new Map<string, Category>();

    hoteldata.menus.forEach((item) => {
      if (!uniqueCategoriesMap.has(item.category.name)) {
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
      (item) => item.category.name === selectedCategory
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
      (item) => item.is_top === true
    );
    return filteredItems;
  };

  const topItems = getTopItems();
  const categories = getCategories();
  const selectedCategory = categories[0]?.name || "";
  const items = getCategoryItems(selectedCategory);

  return (
    <main
      style={{
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontFamily: theme?.fontFamily || "Poppins, sans-serif",
      }}
      className={`overflow-x-hidden relative min-h-screen flex flex-col gap-6 lg:px-[20%] `}
    >
      {/* Auth Modal */}
      <AuthModal hoteldata={hoteldata} styles={styles} tableNumber={tableNumber} />

      {/* top part  */}
      <section className="px-[8%] pt-[20px]">
        {/* hotel details  */}
        <div
          style={{
            alignItems: theme?.infoAlignment || "start",
          }}
          className="flex flex-col gap-3"
        >
          {/* banner image  */}
          <HotelBanner hoteldata={hoteldata} styles={styles} />

          <h1
            style={{
              textAlign: theme?.infoAlignment === "center" ? "center" : "left",
            }}
            className={"font-black text-3xl max-w-[250px]"}
            dangerouslySetInnerHTML={{ __html: hoteldata?.store_name || "" }}
          />

          <DescriptionWithTextBreak
            style={{
              textAlign: theme?.infoAlignment === "center" ? "center" : "left",
            }}
            accent={styles.accent}
          >
            {hoteldata?.description}
          </DescriptionWithTextBreak>
        </div>

        {/* right top button  */}
        <div className="absolute right-[8%] top-[20px] flex flex-col items-center gap-3">
          {hoteldata?.id === auth?.id && (
            <ThemeChangeButton hotelData={hoteldata} theme={theme} />
          )}
          <SocialLinkList styles={styles} socialLinks={socialLinks} />
        </div>
      </section>

      {/* search bar  */}
      <section className="px-[8%]">
        <SearchMenu
          hotelData={hoteldata}
          feature_flags={hoteldata?.feature_flags || ""}
          currency={hoteldata?.currency}
          styles={styles}
          menu={hoteldata.menus}
        />
      </section>

      {/* offers  */}
      {offers.length > 0 && (
        <section className="px-[8%]">
          <OfferList offers={offers} styles={styles} />
        </section>
      )}

      {/* popular  */}
      {topItems.length > 0 && (
        <section>
          <PopularItemsList
            hotelData={hoteldata}
            currency={hoteldata?.currency}
            items={topItems}
            styles={styles}
          />
        </section>
      )}

      {/* menu  */}
      <section>
        <MenuItemsList
          currency={hoteldata?.currency}
          styles={styles}
          items={items}
          hotelData={hoteldata}
          categories={categories}
          selectedCategory={selectedCategory}
          menu={hoteldata?.menus}
        />
      </section>

      {/* order drawer  */}
      {((pathname.includes("qrScan") &&
        getFeatures(hoteldata?.feature_flags || "")?.ordering.enabled) ||
        (!pathname.includes("qrScan") &&
          getFeatures(hoteldata?.feature_flags || "")?.delivery.enabled)) && (
        <section>
          <OrderDrawer
            styles={styles}
            qrId={pathname.includes("qrScan") ? pathname.split("/")[2] : ""}
            hotelData={hoteldata}
            tableNumber={tableNumber}
          />
        </section>
      )}

      {/* rating  */}
      <section
        className={`px-[8.5%] mt-10 ${hoteldata?.footnote ? "" : "mb-40"}`}
      >
        <RateThis styles={styles} hotel={hoteldata} type="hotel" />
      </section>

      {/* footnote  */}
      {hoteldata?.footnote && (
        <section
          style={{
            borderTop: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
            backgroundColor: `${styles.color}1D`,
          }}
          className="px-[8.5%] pt-10 pb-36 mt-10"
        >
          <div
            style={{
              color: `${styles.color}9D`,
            }}
            className="text-center text-sm"
          >
            {hoteldata?.footnote}
          </div>
        </section>
      )}
    </main>
  );
};

export default HotelMenuPage;
