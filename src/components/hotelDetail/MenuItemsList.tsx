import React, { useEffect } from "react";
import { Accordion, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { AccordionContent } from "@radix-ui/react-accordion";
import Image from "next/image";
import { HotelData, HotelDataMenus } from "@/app/hotels/[id]/page";

const MenuItemsList = ({ hoteldata } : {
  hoteldata : HotelData
}) => {
  const [categorisedItems, setCategorisedItems] = React.useState<Record<string, HotelDataMenus[]>>({});

  useEffect(() => {
    const fetchGroupedItems = async () => {
      const groupedItems: { [key: string]: HotelDataMenus[] } = {};
      for (const item of hoteldata.menus) {
        const category = item.category.name;
        if (!groupedItems[category]) {
          groupedItems[category] = [];
        }
        groupedItems[category].push(item);
      }
      const sortedItems = Object.fromEntries(
        Object.entries(groupedItems).sort(([a], [b]) => a.localeCompare(b))
      );
      setCategorisedItems(sortedItems);
    };

    if (hoteldata.menus.length > 0) {
      fetchGroupedItems();
    }
  }, [hoteldata.menus]);

  return (
    <>
      {Object.entries(categorisedItems).length > 0 && (
        <div className="py-10">
          <h1 className="text-3xl font-bold  text-center underline underline-offset-2">
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
                    <div key={item.id} className="py-6 rounded px-2">
                      <div className="flex justify-between items-start">
                        <div className="grid gap-2 flex-1">
                          <span className="capitalize  text-xl font-bold">
                            {item.name}
                          </span>
                          <span className="font-bold text-xl text-orange-500">
                            ₹{item.price}
                          </span>
                          <span className="text-sm text-black/50">
                            {item.description}
                          </span>
                        </div>
                        {item.image_url.length > 0 && (
                          <div className="w-[100px] h-[100px] relative rounded-3xl overflow-hidden ">
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
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
