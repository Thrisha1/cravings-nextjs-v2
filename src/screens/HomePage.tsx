"use client";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, ShoppingCart } from "lucide-react";
// import { PartnerDialog } from "@/components/PartnerDialog";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const navigate = useRouter();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <UtensilsCrossed className="h-12 w-12 text-orange-600" />
            <h1 className="text-5xl font-bold text-gray-900">Cravings</h1>
          </div>
          
          {/* New CraveMart Feature Announcement */}
          <div className="flex items-center justify-center space-x-2 bg-green-50 p-3 rounded-full border border-green-200 animate-pulse">
            <ShoppingCart className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-700">
              Coming Soon: CraveMart - Smart Savings on Supermarket Shopping!
            </p>
          </div>
        </div>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Discover the best food deals and offers in your neighborhood. From
          cozy cafes to fine dining, we bring you exclusive discounts that will
          make your taste buds happy and your wallet happier.
        </p>

        <div className="mt-12 flex items-center justify-center gap-4">
          <Button
            onClick={() => navigate.push("/offers")}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Let&apos;s Go
          </Button>
          {/* <PartnerDialog /> */}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Local Deals
            </h3>
            <p className="text-gray-600">
              Exclusive offers from restaurants near you
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Real-time Updates
            </h3>
            <p className="text-gray-600">
              Never miss a deal with instant notifications
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-md hover:bg-green-50 transition-colors group">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-700">
              CraveMart
            </h3>
            <p className="text-gray-600 group-hover:text-green-600">
              Coming soon: Supermarket deals and discounts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
