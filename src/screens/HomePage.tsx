import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import { PartnerDialog } from "@/components/PartnerDialog";
import { useRouter } from "next/router";

export default function HomePage() {
  const navigate = useRouter();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <UtensilsCrossed className="h-12 w-12 text-orange-600" />
          <h1 className="text-5xl font-bold text-gray-900">Cravings</h1>
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
            Let's Go
          </Button>
          <PartnerDialog />
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
          <div className="p-6 bg-white rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Easy Savings
            </h3>
            <p className="text-gray-600">
              Save money on your favorite restaurants
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
