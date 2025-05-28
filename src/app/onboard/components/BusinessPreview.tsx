"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Phone, Mail, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { BusinessRegistrationData, MenuItem } from "../page";

interface BusinessPreviewProps {
  businessData: BusinessRegistrationData;
  menuItems: MenuItem[];
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function BusinessPreview({
  businessData,
  menuItems,
  onPrevious,
  onSubmit,
  isSubmitting,
}: BusinessPreviewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Preview Your Business</h2>
      <p className="text-gray-500">
        Review your business details and menu items before submitting.
      </p>

      {/* Business Details Preview */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xl font-medium border-b pb-2">Business Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Business Name</h4>
              <p className="text-lg">{businessData.businessName}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Owner Name</h4>
              <p>{businessData.ownerName}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Category</h4>
              <p className="capitalize">{businessData.category}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <p>{businessData.phone}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <p>{businessData.email}</p>
            </div>
            
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
              <div>
                <p className="font-medium">{businessData.area}</p>
                <p className="text-sm text-gray-500 truncate max-w-xs">{businessData.location}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Menu Items Preview */}
      <Card className="p-6 space-y-4">
        <h3 className="text-xl font-medium border-b pb-2">Menu Items</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative h-48 w-full">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-400">No image</p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-lg">{item.name}</h4>
                  <p className="font-bold">₹{item.price.toFixed(2)}</p>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-2">{item.description}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Submission Section */}
      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <Check className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-800">Ready to Submit?</h3>
            <p className="text-sm text-blue-600 mt-1">
              By submitting, you agree to our terms and conditions. Your business will be reviewed before being published.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            "Submit Business"
          )}
        </Button>
      </div>
    </div>
  );
} 