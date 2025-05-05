"use client";

import { SearchIcon } from "lucide-react";
import MenuItemsList from "@/components/hotelDetail/MenuItemsList_v2";
import { Offer } from "@/store/offerStore_hasura";
import { HotelData } from "@/app/hotels/[id]/page";
import ThemeChangeButton, {
  ThemeConfig,
} from "@/components/hotelDetail/ThemeChangeButton";
import Img from "@/components/Img";
import HeadingWithAccent from "@/components/HeadingWithAccent";
import DescriptionWithTextBreak from "@/components/DescriptionWithTextBreak";
import { Category } from "@/store/categoryStore_hasura";
import PopularItemsList from "@/components/hotelDetail/PopularItemsList";
import OfferList from "@/components/hotelDetail/OfferList";
import SearchMenu from "@/components/hotelDetail/SearchMenu";
import HotelBanner from "@/components/hotelDetail/HotelBanner";
import RateThis from "@/components/RateThis";
import OrderDrawer from "@/components/hotelDetail/OrderDrawer";
import useOrderStore from "@/store/orderStore";
import { useEffect, useState } from "react"; // Add this import
import { useAuthStore } from "@/store/authStore";
import { usePathname } from "next/navigation";

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

  return parts.join(",");
};

const HotelMenuPage = ({
  offers,
  hoteldata,
  auth,
  theme,
  tableNumber,
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

  const { open_auth_modal, setHotelId, genOrderId } = useOrderStore();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const { setUserAddress } = useOrderStore();

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
      }}
      className={`overflow-x-hidden relative min-h-screen flex flex-col gap-6 lg:px-[20%] `}
    >
      {/* Auth Modal */}
      {open_auth_modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          style={{ backgroundColor: `${styles.backgroundColor}80` }}
        >
          <div
            className="w-full max-w-md p-6 rounded-lg shadow-lg"
            style={{
              backgroundColor: styles.backgroundColor,
              color: styles.color,
              border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
            }}
          >
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: styles.accent }}
            >
              Please enter your details to place order
            </h2>

            <div className="mb-6">
              <label htmlFor="phone" className="block mb-2 text-sm font-medium">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-3 rounded-lg"
                style={{
                  backgroundColor: styles.backgroundColor,
                  color: styles.color,
                  border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
                }}
                placeholder="Enter your phone number"
              />

              {!tableNumber && (
                <div className="my-6">
                  <label
                    htmlFor="address"
                    className="block mb-2 text-sm font-medium"
                  >
                    Delivery Address
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-3 rounded-lg min-h-[100px]"
                    style={{
                      backgroundColor: styles.backgroundColor,
                      color: styles.color,
                      border: `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
                      resize: "vertical", // Allows vertical resizing only
                    }}
                    placeholder="Enter your delivery address (House no, Building, Street, Area)"
                  />
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                if (!phoneNumber) {
                  alert("Please enter both phone number and address.");
                  return;
                }
                if (!tableNumber && !address) {
                  alert("Please enter the delivery address.");
                  return;
                }
                setUserAddress(address);
                const result = await useAuthStore
                  .getState()
                  .signInWithPhone(phoneNumber, hoteldata?.id);
                if (result) {
                  console.log("Login successful", result);
                  useOrderStore.getState().setOpenAuthModal(false);
                }
              }}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: styles.accent,
                color: "#fff",
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Rest of your existing code... */}
      {/* top part  */}
      <section className="px-[8%] pt-[20px] flex justify-between items-start">
        {/* hotel details  */}
        <div className="grid gap-3">
          {/* banner image  */}
          <HotelBanner hoteldata={hoteldata} styles={styles} />

          <h1
            className={"font-black text-3xl max-w-[250px]"}
            dangerouslySetInnerHTML={{ __html: hoteldata?.store_name || "" }}
          />

          <DescriptionWithTextBreak accent={styles.accent}>
            {hoteldata?.description}
          </DescriptionWithTextBreak>
        </div>

        {/* right top button  */}
        <div>
          {hoteldata?.id === auth?.id && (
            <ThemeChangeButton hotelData={hoteldata} theme={theme} />
          )}
        </div>
      </section>

      {/* search bar  */}
      <section className="px-[8%]">
        <SearchMenu
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
      <section className="px-[8.5%] mt-10">
        <RateThis styles={styles} hotel={hoteldata} type="hotel" />
      </section>

      {/* footnote  */}
      {hoteldata?.footnote && (
        <section style={{
          borderTop : `${styles.border.borderWidth} ${styles.border.borderStyle} ${styles.border.borderColor}`,
          backgroundColor: `${styles.color}1D`,
        }} className="px-[8.5%] pt-10 pb-36 mt-10">
          <div style={{
            color : `${styles.color}9D`
          }} className="text-center text-sm">{hoteldata?.footnote}</div>
        </section>
      )}
    </main>
  );
};

export default HotelMenuPage;
