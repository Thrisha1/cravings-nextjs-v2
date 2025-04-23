import React, { useEffect } from "react";
import { Accordion, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { AccordionContent } from "@radix-ui/react-accordion";
import Image from "next/image";
import { HotelData, HotelDataMenus } from "@/app/hotels/[id]/page";

const MenuItemsList = ({ hoteldata }: { hoteldata: HotelData }) => {
  const [categorisedItems, setCategorisedItems] = React.useState<
    Record<string, HotelDataMenus[]>
  >({});

  useEffect(() => {
    const fetchGroupedItems = async () => {
      // 1. First group by category
      const groupedItems: { [key: string]: HotelDataMenus[] } = {};
      for (const item of hoteldata.menus) {
        const category = item.category.name;
        if (!groupedItems[category]) {
          groupedItems[category] = [];
        }
        groupedItems[category].push(item);
      }

      // 2. Convert to array of categories with their priority
      const categories = Object.entries(groupedItems).map(
        ([category, items]) => {
          const priority = items[0]?.category?.priority || 0; // Get priority from first item
          return {
            name: category,
            priority,
            items,
          };
        }
      );

      // 3. Sort categories by priority (ascending)
      categories.sort((a, b) => a.priority - b.priority);

      // 4. Convert back to object with sorted order
      const sortedItems = Object.fromEntries(
        categories.map((category) => [category.name, category.items])
      );

      setCategorisedItems(sortedItems);
    };

    if (hoteldata?.menus?.length > 0) {
      fetchGroupedItems();
    }
  }, [hoteldata.menus]);

  return (
    <>
      {Object.entries(categorisedItems).length > 0 && (
        <div className="pb-10">
          <h1 className="text-3xl font-bold text-center underline underline-offset-2">
            Menu
          </h1>

          <Accordion
            type="multiple"
            defaultValue={[Object.entries(categorisedItems)[0]?.[0]]}
            className="mt-10"
          >
            {Object.entries(categorisedItems).map(([category, items]) => (
              <AccordionItem value={category} key={category} className="mb-6">
                <AccordionTrigger className="text-xl font-bold mb-2 capitalize">
                  {category + `(${items.length})`}
                </AccordionTrigger>
                <AccordionContent className="grid divide-y-2 divide-orange-200">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="py-6 rounded px-4 flex-1 relative"
                    >
                    

                      <div className="flex flex-col gap-y-2 justify-between items-start w-full">
                        <div className="flex justify-between w-full">
                          <div className={`flex flex-col justify-center w-1/2 ${!item.is_available ? "opacity-25" : ""}`}>
                            <span className="capitalize text-xl font-bold">
                              {item.name}
                            </span>
                            <span className={`font-bold text-xl ${!item.is_available ? "text-black" : "text-orange-600"}`}>
                              ₹{item.price}
                            </span>
                          </div>
                          {item.image_url.length > 0 && (
                            <div className="w-[100px] h-[100px] relative rounded-3xl overflow-hidden">
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className={`object-cover w-full h-full ${!item.is_available ? "grayscale" : ""}`}
                              />
                                {!item.is_available && (<div className="absolute top-1/2 left-0 -translate-y-1/2 bg-red-500 text-white text-sm font-semibold py-2 px-3 w-full">Unavailabe</div>)}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-black/50">
                          {item.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </>
  );
};

export default MenuItemsList;
