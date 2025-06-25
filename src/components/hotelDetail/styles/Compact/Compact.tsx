"use client";
import React, { useState, useEffect, useRef } from "react";
import { DefaultHotelPageProps } from "../Default/Default";
import { formatDisplayName } from "@/store/categoryStore_hasura";
import ThemeChangeButton from "../../ThemeChangeButton";
import ItemCard from "./ItemCard";
import { MapPin } from "lucide-react";
import SocialLinks from "./SocialLinks";

const Compact = ({
  styles,
  theme,
  open_place_order_modal,
  hoteldata,
  socialLinks,
  offers,
  tableNumber,
  auth,
  topItems,
  items,
  pathname,
  categories,
  setSelectedCategory,
  qrGroup,
  qrId,
}: DefaultHotelPageProps) => {
  const [activeCatIndex, setActiveCatIndex] = useState<number>(0);
  const categoryHeadersRef = useRef<(HTMLHeadingElement | null)[]>([]);
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const categoryElementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isOwner = auth && hoteldata ? auth?.id === hoteldata?.id : false;
  const themeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 64; // 64px is the sticky position
      let activeIndex = 0;

      // Find which category header is currently at the top
      for (let i = categoryHeadersRef.current.length - 1; i >= 0; i--) {
        const header = categoryHeadersRef.current[i];
        if (!header) continue;

        const headerTop = header.offsetTop;

        // Check if the scroll position is below this header's top position
        if (scrollPosition >= headerTop) {
          activeIndex = i;
          break;
        }
      }

      if (activeIndex !== activeCatIndex) {
        setActiveCatIndex(activeIndex);
        window.history.replaceState(
          null,
          "",
          `#${categories[activeIndex].name}`
        );
        scrollCategoryIntoView(activeIndex);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories, activeCatIndex]);

  useEffect(() => {
    // Update border position whenever activeCatIndex changes
    updateBorderPosition(activeCatIndex);
  }, [activeCatIndex]);

  const scrollCategoryIntoView = (index: number) => {
    const container = categoriesContainerRef.current;
    if (!container) return;

    const categoryElement = categoryElementsRef.current[index];
    if (!categoryElement) return;

    const containerRect = container.getBoundingClientRect();
    const categoryRect = categoryElement.getBoundingClientRect();

    if (categoryRect.left < containerRect.left) {
      container.scrollTo({
        left:
          container.scrollLeft + (categoryRect.left - containerRect.left) - 10,
        behavior: "smooth",
      });
    } else if (categoryRect.right > containerRect.right) {
      container.scrollTo({
        left:
          container.scrollLeft +
          (categoryRect.right - containerRect.right) +
          10,
        behavior: "smooth",
      });
    }
  };

  const updateBorderPosition = (index: number) => {
    const container = categoriesContainerRef.current;
    const border = borderRef.current;
    const activeCategory = categoryElementsRef.current[index];

    if (!container || !border || !activeCategory) return;

    const containerRect = container.getBoundingClientRect();
    const categoryRect = activeCategory.getBoundingClientRect();

    // Calculate position relative to container
    const left = categoryRect.left - containerRect.left + container.scrollLeft;
    const width = categoryRect.width;

    // Apply the position to the border
    border.style.transform = `translateX(${left}px)`;
    border.style.width = `${width}px`;
  };

  const handleCategoryClick = (index: number, category: any) => {
    setActiveCatIndex(index);
    const element = document.getElementById(category.name);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    scrollCategoryIntoView(index);
  };

  return (
    <>
      <main
        style={{
          color: styles?.color || "#000",
        }}
        className="max-w-xl mx-auto relative mb-40"
      >
        {/* hotel banner  */}
        <div className="relative">
          {/* image  */}
          <div className="w-full h-[30vh] relative overflow-hidden">
            <img
              src={hoteldata?.store_banner}
              alt="Hotel Logo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* hotel details  */}
          <div className="absolute bottom-0 gap-2 left-0 w-full p-5 bg-gradient-to-t from-black to-transparent text-white">
            <h1 className="text-xl font-semibold w-[200px]">
              {hoteldata?.store_name}
            </h1>
            <div className="inline-flex gap-2 text-sm">
              <MapPin size={15} />
              <span>{hoteldata.district}</span>
            </div>
          </div>
        </div>

        {/* social links  */}
        {(socialLinks || isOwner) && (
          <div className="flex overflow-x-auto scrollbar-hide gap-2 p-4 border-b-[1px] bg-white z-20">
            <SocialLinks socialLinks={socialLinks} />
            {isOwner && (
              <div onClick={()=>themeButtonRef?.current?.click} className="flex items-center gap-2 border-[1px] border-gray-300 p-2 rounded-md bg-gray-50">
                <ThemeChangeButton
                  ref={themeButtonRef}
                  iconSize={15}
                  hotelData={hoteldata}
                  theme={theme}
                />
                <span className="text-xs text-nowrap text-gray-500">Change Theme</span>
              </div>
            )}
          </div>
        )}

        

        {/* Categories Navigation */}
        <div
          style={{
            backgroundColor: styles?.backgroundColor || "#fff",
            color: styles?.color || "#000",
            borderColor: styles?.border?.borderColor,
            borderWidth: styles?.border?.borderWidth || "1px",
            borderStyle: styles?.border?.borderStyle || "solid",
          }}
          ref={categoriesContainerRef}
          className="overflow-y-auto w-full flex gap-2 p-2 sticky top-0 z-10 shadow-md scrollbar-hide"
          onScroll={() => updateBorderPosition(activeCatIndex)}
        >
          {/* Animated border element */}
          <div
            ref={borderRef}
            className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-in-out"
            style={{
              backgroundColor: styles?.accent || "#000",
              width:
                categoryElementsRef.current[0]?.getBoundingClientRect().width ||
                "0px",
            }}
          />

          {categories.map((category, index) => (
            <div
              ref={(el) => {
                categoryElementsRef.current[index] = el;
              }}
              style={{
                color:
                  activeCatIndex === index ? styles?.accent || "#000" : "gray",
              }}
              onClick={() => handleCategoryClick(index, category)}
              key={category.id}
              className={`p-3 text-nowrap ${
                activeCatIndex === index ? "font-semibold" : "font-medium"
              } flex-shrink-0`}
            >
              {formatDisplayName(category.name)}
            </div>
          ))}
        </div>

        {/* Categories Content */}
        <div className="grid gap-4 p-4">
          {categories.map((category, index) => (
            <section key={category.id} id={category.name} className="py-4">
              <h2
                ref={(el) => {
                  categoryHeadersRef.current[index] = el;
                }}
                style={{
                  color: styles?.accent || "#000",
                }}
                className="text-xl font-bold sticky top-[64px] bg-white z-[9] py-4"
              >
                {formatDisplayName(category.name)}
              </h2>
              <div className="grid grid-cols-1 gap-4 divide-y-2 divide-gray-200">
                {hoteldata?.menus
                  .filter((item) => item.category.id === category.id)
                  .map((item) => (
                    <ItemCard
                      tableNumber={tableNumber}
                      feature_flags={hoteldata?.feature_flags}
                      hoteldata={hoteldata}
                      item={item}
                      styles={styles}
                      key={item.id}
                    />
                  ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
};

export default Compact;
