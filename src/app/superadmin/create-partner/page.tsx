"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocationStore } from "@/store/locationStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, UploadCloud, Image as ImageIcon, RefreshCw } from "lucide-react";
import { useSuperAdminPartnerStore } from "@/store/superAdminPartnerStore";
import { useCreatedPartnerStore } from "@/store/createdPartnerStore";

export default function SuperAdminCreatePartnerPage() {
  const router = useRouter();
  const { locationData, countries } = useLocationStore();
  const { partner, setPartner, clearPartner } = useCreatedPartnerStore();
  const {
    createPartner,
    uploadBanner,
    isExtractingMenu,
    extractionError,
    extractedMenuItems,
    extractMenuFromImages,
    retryMenuExtraction,
    clearExtractedMenu,
    isGeneratingImages,
    generateMenuImages,
    generatedImages,
    clearAll
  } = useSuperAdminPartnerStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    hotelName: "",
    area: "",
    phone: "",
    upiId: "",
    isInIndia: true,
    state: "",
    country: "India",
  });

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [menuImagePreviews, setMenuImagePreviews] = useState<string[]>([]);
  const [menuImageFiles, setMenuImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerBanner, setPartnerBanner] = useState<string | null>(null);

  const handleCreateAnother = () => {
    clearPartner();
    clearAll();
    clearExtractedMenu();
    setFormData({
      email: "", password: "", hotelName: "", area: "", phone: "",
      upiId: "", isInIndia: true, state: "", country: "India",
    });
    setBannerPreview(null);
    setBannerFile(null);
    setMenuImagePreviews([]);
    setMenuImageFiles([]);
    setError(null);
    setIsSubmitting(false);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleMenuImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setMenuImageFiles(filesArray);
      const previews = filesArray.map(file => URL.createObjectURL(file));
      setMenuImagePreviews(previews);
    }
  };

  const validateForm = () => {
    if (!formData.hotelName || !formData.phone || !formData.country || 
        (formData.isInIndia && (!formData.state || !formData.area))) {
      setError("Please fill in all required business and location fields.");
      return false;
    }
    if (!formData.email || !formData.password || formData.password.length < 6) {
      setError("A valid email and password (min 6 chars) are required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newPartner = await createPartner(
        formData.email,
        formData.password,
        formData.hotelName,
        formData.area,
        formData.area,
        formData.phone,
        formData.upiId,
        formData.country,
        formData.state
      );
      setPartner(newPartner);
      toast.success("Partner created successfully!");

      if (bannerFile && bannerPreview) {
        const banner = await uploadBanner(newPartner.id, bannerFile, bannerPreview);
        if (banner) {
          setPartnerBanner(banner);
        }
      }

      if (menuImageFiles.length > 0) {
        const menuItems = await extractMenuFromImages(menuImageFiles);
        if (menuItems.length > 0) {
          await generateMenuImages(menuItems);
        }
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err?.message || "An unexpected error occurred.");
      if (!partner) setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateAllImages = async () => {
    if (extractedMenuItems.length > 0) {
      await generateMenuImages(extractedMenuItems);
    }
  };

  const handleRegenerateSingleImage = async (itemName: string) => {
    const item = extractedMenuItems.find(i => i.name === itemName);
    if (item) {
      await generateMenuImages([item]);
    }
  };

  const handleUploadMenu = async () => {
    try{
      if (!partner) {
        toast.error("Please create a partner first.");
        return;
      }
      const uploadedCount = await useSuperAdminPartnerStore.getState().uploadMenu(partner.id);
      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} menu items uploaded successfully!`);
        // router.push(`/superadmin/partners/${partner.id}`);
      } else {
        toast.error("No menu items were uploaded. Please try again.");
      }

    }catch(error) {
      console.error(error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-4xl bg-white p-8">
        <div className="mb-6">
          <Link href="/superadmin" className="inline-flex items-center gap-2 px-4 py-2 rounded border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 transition font-medium">
            <ChevronLeft size={20} />
            Back to Dashboard
          </Link>
        </div>
        
        {!partner ? (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create New Partner</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hotelName">Business Name</Label>
                  <Input id="hotelName" placeholder="e.g., The Grand Cafe" value={formData.hotelName} onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="Enter phone number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Login Email</Label>
                  <Input id="email" type="email" placeholder="Enter partner's email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Min 6 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                </div>
              </div>

              <div className="space-y-4 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="location-type" className="text-sm">Is business in India?</Label>
                  <Switch id="location-type" checked={formData.isInIndia} onCheckedChange={(c) => setFormData({ ...formData, isInIndia: c, state: '', area: '', country: c ? 'India' : '' })} />
                </div>
                {formData.isInIndia ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v, area: '' })}>
                      <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                      <SelectContent>{locationData.map((s) => (<SelectItem key={s.state} value={s.state}>{s.state}</SelectItem>))}</SelectContent>
                    </Select>
                    <Select value={formData.area} onValueChange={(v) => setFormData({ ...formData, area: v })} disabled={!formData.state}>
                      <SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger>
                      <SelectContent>{formData.state && locationData.find((s) => s.state === formData.state)?.districts.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent>{countries.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                  <Label className="mb-2 block">Store Banner (Optional)</Label>
                  <label htmlFor="bannerInput" className="w-full cursor-pointer border-2 border-dashed rounded-lg h-40 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Banner Preview" className="object-cover w-full h-full rounded-lg"/>
                    ) : (
                      <div className="text-center text-gray-500">
                        <UploadCloud className="mx-auto h-8 w-8" />
                        <span>Click to upload banner</span>
                      </div>
                    )}
                    <input type="file" id="bannerInput" accept="image/*" onChange={handleBannerChange} className="hidden" />
                  </label>
                </div>
                <div>
                  <Label className="mb-2 block">Menu Images (for AI)</Label>
                  <label htmlFor="menuImagesInput" className="w-full cursor-pointer border-2 border-dashed rounded-lg h-40 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100">
                    {menuImagePreviews.length > 0 ? (
                      <div className="flex items-center gap-2 p-2">
                        <ImageIcon className="h-8 w-8 text-green-600" />
                        <span className="font-semibold text-gray-700">{menuImagePreviews.length} menu images selected</span>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        <UploadCloud className="mx-auto h-8 w-8" />
                        <span>Upload menu pages</span>
                      </div>
                    )}
                    <input type="file" id="menuImagesInput" accept="image/*" multiple onChange={handleMenuImagesChange} className="hidden" />
                  </label>
                </div>
              </div>

              {extractionError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <p className="text-red-700">{extractionError}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => retryMenuExtraction()}
                      disabled={isExtractingMenu}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Extraction
                    </Button>
                  </div>
                </div>
              )}

              {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-center">{error}</div>}
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg flex items-center justify-center gap-2" disabled={isSubmitting || isExtractingMenu || isGeneratingImages}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Create Partner & Process Menu"
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-6">

          <div className="flex justify-between items-center pt-4">
            <Button className="bg-orange-600" onClick={handleUploadMenu}>Upload Menu</Button>
            <Button variant="outline" onClick={handleCreateAnother}>Create Another Partner</Button>
          </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-xl font-bold text-green-800">Partner Created: {partner.store_name}</h3>
              <p className="text-gray-600">{partner.email} | {partner.phone}</p>
              <a target="_blank" href={`https://www.cravings.live/hotels/${partner?.store_name || partner?.name}/${partner?.id}`}>Link</a>
            </div>

            {partnerBanner && (
              <div>
                <h4 className="font-bold text-lg mb-2">Partner Banner</h4>
                <img src={partnerBanner} alt="Partner Banner" className="w-full h-32 object-cover rounded-md border" />
              </div>
            )}
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-lg">Extracted Menu Items</h4>
                {extractedMenuItems.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateAllImages}
                    disabled={isGeneratingImages}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate All Images
                  </Button>
                )}
              </div>
              
              {(isExtractingMenu || isGeneratingImages) && (
                <div className="flex items-center gap-3 text-orange-600 font-medium p-3 bg-orange-50 rounded-md">
                  <Loader2 className="animate-spin"/>
                  {isExtractingMenu ? "AI is analyzing your menu images..." : "Generating images for each item..."}
                </div>
              )}
              
              {extractionError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <p className="text-red-700">{extractionError}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => retryMenuExtraction()}
                      disabled={isExtractingMenu}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Extraction
                    </Button>
                  </div>
                </div>
              )}

              {extractedMenuItems.length > 0 && (
                <ScrollArea className=" mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                    {extractedMenuItems.map((item) => (
                      <div key={item.name} className="border rounded-lg p-3 shadow-sm bg-white">
                        <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center mb-2 relative">
                          {generatedImages[item.name] ? (
                            <>
                              <img src={generatedImages[item.name]} alt={item.name} className="w-full h-full object-cover rounded-md"/>
                              {/* <button 
                                onClick={() => handleRegenerateSingleImage(item.name)}
                                className="absolute top-1 right-1 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                                disabled={isGeneratingImages}
                              >
                                <RefreshCw className="h-3 w-3" />
                              </button> */}
                            </>
                          ) : (
                            <div className="flex flex-col items-center text-gray-500 text-xs">
                              <Loader2 className="h-5 w-5 animate-spin mb-1"/>
                              <span>Generating image...</span>
                            </div>
                          )}
                        </div>
                        <h5 className="font-bold truncate">{item.name}</h5>
                        <p className="text-sm font-medium">₹{item.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{item.category}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                        {
                          (item?.variants ?? [])?.length > 0 ? (
                            <div>
                              <h6 className="font-semibold mt-2">Options:</h6>
                              <ul className="list-disc list-inside text-sm text-gray-600">
                                {(item?.variants ?? []).map((variant) => (
                                  <li key={variant.name}>{variant.name} - ₹{variant.price.toFixed(2)}</li>
                                ))}
                              </ul> 
                              </div>
                          ) : null
                        }
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            </div>
        )}
      </div>
    </div>
  );
}