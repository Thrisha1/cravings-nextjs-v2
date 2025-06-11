"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuTab } from "@/components/admin/MenuTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { Partner } from "@/store/authStore";
import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, MapPin, FileText, Phone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Function to check profile completeness
const checkProfileCompleteness = (userData: Partner) => {
  const missingFields = [];
  const deliveryIssues = [];
  
  // Check if delivery feature is enabled
  const features = userData.feature_flags || "";
  const isDeliveryEnabled = features.includes("delivery-true");
  
  if (!userData.description || userData.description.trim() === "") {
    missingFields.push({
      field: "Bio",
      description: "Restaurant description is missing",
      icon: FileText,
      section: "bio"
    });
  }
  
  if (!userData.location || userData.location.trim() === "") {
    missingFields.push({
      field: "Location",
      description: "Restaurant location is missing",
      icon: MapPin,
      section: "location"
    });
  }
  
  if (!userData.phone || userData.phone.trim() === "") {
    missingFields.push({
      field: "Phone Number",
      description: "Contact phone number is missing",
      icon: Phone,
      section: "phone"
    });
  }
  
  if (!userData.store_name || userData.store_name.trim() === "") {
    missingFields.push({
      field: "Store Name",
      description: "Restaurant name is missing",
      icon: Building2,
      section: "store_name"
    });
  }

  if (!userData.whatsapp_numbers || userData.whatsapp_numbers.length === 0 || !userData.whatsapp_numbers[0]?.number) {
    missingFields.push({
      field: "WhatsApp Number",
      description: "WhatsApp contact number is missing",
      icon: Phone,
      section: "whatsapp"
    });
  }

  // Only check delivery-related fields if delivery feature is enabled
  if (isDeliveryEnabled) {
    if (!userData.geo_location || !userData.geo_location.coordinates) {
      deliveryIssues.push({
        field: "Geo Location",
        description: "Restaurant coordinates are missing",
        icon: MapPin,
        section: "geo_location"
      });
    }

    if (!userData.delivery_rate || userData.delivery_rate <= 0) {
      deliveryIssues.push({
        field: "Delivery Rate",
        description: "Delivery pricing is not set",
        icon: Building2,
        section: "delivery_rate"
      });
    }
  }
  
  return { missingFields, deliveryIssues, isDeliveryEnabled };
};

// Profile Warning Component
const ProfileWarning = ({ userData }: { userData: Partner }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const { missingFields, deliveryIssues, isDeliveryEnabled } = checkProfileCompleteness(userData);
  
  // Function to navigate to profile with anchor
  const navigateToProfileField = (section: string) => {
    router.push(`/profile#${section}`);
  };
  
  if (missingFields.length === 0 && deliveryIssues.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800">
              Profile Incomplete
            </h3>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-red-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-red-600" />
        )}
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Delivery Issues Section - Show First */}
          {isDeliveryEnabled && deliveryIssues.length > 0 && (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <h4 className="font-semibold text-orange-800 mb-2">
                  🚚 Delivery Issues
                </h4>
                <p className="text-sm text-orange-700 mb-3">
                  {deliveryIssues.length === 1 
                    ? deliveryIssues[0].field === "Geo Location"
                      ? "You cannot do delivery because your location is not properly configured:"
                      : "You cannot do delivery because your delivery settings are not properly configured:"
                    : "You cannot do delivery because your location and settings are not properly configured:"
                  }
                </p>
                <div className="space-y-2">
                  {deliveryIssues.map((field, index) => {
                    const IconComponent = field.icon;
                    return (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="font-medium text-orange-800">{field.field}</p>
                            <p className="text-sm text-orange-600">{field.description}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          onClick={() => navigateToProfileField(field.section)}
                        >
                          Configure
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* General Profile Issues - Show Second */}
          {missingFields.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-red-700">
                Please complete the following fields to improve your restaurant profile:
              </p>
              <div className="space-y-2">
                {missingFields.map((field, index) => {
                  const IconComponent = field.icon;
                  return (
                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4 text-red-600" />
                        <div>
                          <p className="font-medium text-red-800">{field.field}</p>
                          <p className="text-sm text-red-600">{field.description}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => navigateToProfileField(field.section)}
                      >
                        Fill Now
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function Admin({ userData }: { userData: Partner }) {
  // Main dashboard for active partners
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 pb-20">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-900 capitalize mb-8">
          {(userData as Partner)?.store_name} Admin Dashboard
        </h1>

        {/* Profile Warning Component */}
        <ProfileWarning userData={userData} />

        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-flow-col auto-cols-fr mb-8">
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
          </TabsList>
          <TabsContent value="menu">
            <MenuTab />
          </TabsContent>
          <TabsContent value="offers">
            <OffersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
