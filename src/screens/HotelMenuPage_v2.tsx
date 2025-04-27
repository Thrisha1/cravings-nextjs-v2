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
}

const HotelMenuPage = ({
  offers,
  hoteldata,
  auth,
  theme,
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
      className={`overflow-x-hidden relative min-h-screen flex flex-col gap-6 pb-40 `}
    >
      {/* top part  */}
      <section className="px-[8%] pt-[20px] flex justify-between items-start">
        {/* hotel details  */}
        <div className="grid gap-3">
          {/* banner image  */}
          <HotelBanner hoteldata={hoteldata} styles={styles} />

          <HeadingWithAccent
            className={"font-black text-3xl max-w-[250px]"}
            accent={styles.accent}
          >
            {hoteldata?.store_name}
          </HeadingWithAccent>

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
        <SearchMenu styles={styles} menu={hoteldata.menus} />
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
          <PopularItemsList items={topItems} styles={styles} />
        </section>
      )}

      {/* menu  */}
      <section>
        <MenuItemsList
          styles={styles}
          items={items}
          categories={categories}
          selectedCategory={selectedCategory}
          menu={hoteldata?.menus}
        />
      </section>


      {/* rating  */}
      <section className="px-[8.5%] mt-10">
        <RateThis styles={styles} hotel={hoteldata} type="hotel" />
      </section>
    </main>
  );
};

export default HotelMenuPage;
