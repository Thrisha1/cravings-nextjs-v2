
import { type Offer } from "@/store/offerStore";
import SearchBox from "@/components/SearchBox";
import LocationSelection from "@/components/LocationSelection";
import OfferTabs from "@/components/OfferTabs";
import OfferCard from "@/components/OfferCard";
import NoOffersFound from "@/components/NoOffersFound";

export default async function Offers({ offers }: { offers: Offer[] }) {

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 px-3 py-3 relative pb-10">
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 px-3 py-3 relative pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start md:items-center gap-3 my-4">
        <div className="flex justify-between items-start md:items-center gap-3 my-4">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">
              Today&apos;s Special Offers
            </h1>
          </div>
          <LocationSelection/>
        </div>

        <SearchBox />

        {/* offers section  */}

        <section>
          {offers.length > 0 ? (
            <>
              <OfferTabs />
              {/* offer list  */}
              <div className="grid gap-2 gap-y-5 grid-cols-2 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                {offers.map((offer) => {
                  const discount = Math.round(
                    ((offer.originalPrice - offer.newPrice) /
                      offer.originalPrice) *
                      100
                  );
                  const isUpcoming = new Date(offer.fromTime) > new Date();

                  return (
                    <OfferCard
                      key={offer.id}
                      discount={discount}
                      isUpcoming={isUpcoming}
                      offer={offer}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <NoOffersFound />
          )}
        </section>
      </div>
    </div>
  );
}
