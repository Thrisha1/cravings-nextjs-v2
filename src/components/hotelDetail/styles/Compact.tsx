import React, { useState, useEffect, useRef } from "react";
import { DefaultHotelPageProps } from "./Default";
import { formatDisplayName } from "@/store/categoryStore_hasura";
import ThemeChangeButton from "../ThemeChangeButton";

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
  const categoryRefs = useRef<(HTMLElement | null)[]>([]);
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);
  const categoryElementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = categoryRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (index !== -1) {
              setActiveCatIndex(index);
              window.history.replaceState(
                null,
                "",
                `#${categories[index].name}`
              );
              scrollCategoryIntoView(index);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.8,
      }
    );

    categoryRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [categories]);

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
      <main style={{
        color: styles?.color || "#000",
      }} className="max-w-xl mx-auto relative">
        <div className="absolute top-5 right-5 z-20 rounded-full aspect-square w-10 grid place-items-center bg-white shadow-xl active:scale-95 transition-transform">
          <ThemeChangeButton hotelData={hoteldata} theme={theme} />
        </div>

        {/* image  */}
        <div className="w-full h-[35vh] relative overflow-hidden">
          <img
            src={hoteldata?.store_banner}
            alt="Hotel Logo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Categories Navigation */}
        <div
          style={{
            backgroundColor: styles?.backgroundColor || "#fff",
            color: styles?.color || "#000",
          }}
          ref={categoriesContainerRef}
          className="overflow-y-auto w-full flex gap-2 p-2 sticky top-0 z-10  shadow-md scrollbar-hide"
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
              className={`p-3 text-nowrap ${activeCatIndex === index ? "font-semibold" : "font-medium"} flex-shrink-0`}
            >
              {formatDisplayName(category.name)}
            </div>
          ))}
        </div>

        {/* Categories Content */}
        <div className="grid gap-4 p-4 ">
          {categories.map((category, index) => (
            <section
              key={category.id}
              id={category.name}
              ref={(el) => {
                categoryRefs.current[index] = el;
              }}
              className="py-4"
            >
              <h2 style={{
                color: styles?.accent || "#000",
              }} className="text-xl font-bold mb-2">
                {formatDisplayName(category.name)}
              </h2>
              <div className="grid grid-cols-1  gap-4 divide-y-2 divide-gray-200">
                {hoteldata?.menus
                  .filter((item) => item.category.id === category.id)
                  .map((item) => (
                    <div key={item.id} className="p-4 flex justify-between">
                      <div>
                        <h3 className=" capitalize text-lg font-semibold">
                          {item.name}
                        </h3>
                        <p className="text-sm opacity-50">{item.description}</p>
                        <p style={{
                          color: styles?.accent || "#000",
                        }} className="text-lg font-bold">
                          {hoteldata?.currency || "₹"}
                          {item.price}
                        </p>
                      </div>

                      <div className="relative">
                        {item.image_url && (
                          <div className="overflow-hidden aspect-square h-28 rounded-3xl">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}


                        {/* button  */}

                       
                      </div>
                    </div>
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
