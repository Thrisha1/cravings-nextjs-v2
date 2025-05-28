"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Step components will be imported here
import RegistrationForm from "./components/RegistrationForm";
import MenuUploadForm from "./components/MenuUploadForm";
import BusinessPreview from "./components/BusinessPreview";

// Define the steps for the onboarding process
const steps = [
  { id: 1, name: "Registration Details" },
  { id: 2, name: "Menu Upload" },
  { id: 3, name: "Preview" },
];

// Define the business registration data interface
export interface BusinessRegistrationData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  area: string;
  district: string; // Added district field
  country: string; // Added country field
  location: string; // Google Maps URL
  category: string; // e.g., "restaurant", "cafe", etc.
  upiId: string; // For payments
}

// Define the menu item interface
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string; // URL to the uploaded image
  category?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  
  // State for tracking the current step
  const [currentStep, setCurrentStep] = useState(1);
  
  // State for storing form data
  const [businessData, setBusinessData] = useState<BusinessRegistrationData>({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    area: "",
    district: "", // Initialize district field
    country: "India", // Default country
    location: "",
    category: "restaurant",
    upiId: "",
  });
  
  // State for storing menu items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // State for tracking loading state during submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State for tracking errors
  const [error, setError] = useState<string | null>(null);

  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle final submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create user account with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        businessData.email,
        businessData.password
      );
      
      const user = userCredential.user;
      
      // Create business document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        businessName: businessData.businessName,
        ownerName: businessData.ownerName,
        email: businessData.email,
        phone: businessData.phone,
        area: businessData.area,
        location: businessData.location,
        category: businessData.category,
        upiId: businessData.upiId,
        role: "hotel", // Set role as hotel/business
        accountStatus: "pending", // Set initial status as pending for review
        createdAt: new Date().toISOString(),
      });
      
      // Store menu items without images for now
      // We'll implement proper image upload later
      const menuItemsCollection = doc(db, "users", user.uid, "menu", "items");
      await setDoc(menuItemsCollection, {
        items: menuItems.map(item => ({
          name: item.name,
          price: item.price,
          description: item.description,
          // Skip image upload for now
          // image: item.image,
          category: businessData.category,
        }))
      });
      
      // Show success message
      toast.success("Business registered successfully! Your account is pending approval.");
      
      // Redirect to success page or dashboard
      router.push("/admin");
      
    } catch (error) {
      console.error("Error submitting data:", error);
      setError(
        error instanceof Error 
          ? error.message 
          : "An unexpected error occurred. Please try again."
      );
      toast.error("Failed to register business. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">Business Onboarding</h1>
      
      {/* Stepper */}
      <div className="mb-8">
        <ol className="flex items-center w-full">
          {steps.map((step, index) => (
            <li 
              key={step.id} 
              className={`flex items-center ${
                index < steps.length - 1 
                  ? "w-full" 
                  : "flex-1"
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep > step.id 
                  ? "bg-green-500" 
                  : currentStep === step.id 
                    ? "bg-blue-600" 
                    : "bg-gray-200"
              } shrink-0`}>
                {currentStep > step.id ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className={`text-sm font-medium ${
                    currentStep === step.id ? "text-white" : "text-gray-500"
                  }`}>
                    {step.id}
                  </span>
                )}
              </div>
              <span className={`ms-3 text-sm font-medium ${
                currentStep === step.id ? "text-blue-600" : "text-gray-500"
              }`}>
                {step.name}
              </span>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ms-3 me-3 ${
                  currentStep > step.id ? "bg-green-500" : "bg-gray-200"
                }`}></div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Main content */}
      <Card className="p-6">
        {currentStep === 1 && (
          <RegistrationForm 
            businessData={businessData}
            setBusinessData={setBusinessData}
            onNext={handleNext}
          />
        )}
        
        {currentStep === 2 && (
          <MenuUploadForm 
            menuItems={menuItems}
            setMenuItems={setMenuItems}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )}
        
        {currentStep === 3 && (
          <BusinessPreview 
            businessData={businessData}
            menuItems={menuItems}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </Card>
    </div>
  );
} 