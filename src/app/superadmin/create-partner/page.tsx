"use client";

import React, { useState, useEffect } from "react";
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
import { ChevronLeft, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Import superadmin-specific stores and hooks
import { useSuperAdminBulkUpload } from "@/hooks/useSuperAdminBulkUpload";
import { useSuperAdminPartnerStore } from "@/store/superAdminPartnerStore";
import { Textarea } from "@/components/ui/textarea";
import { MenuItemCard } from "@/components/bulkMenuUpload/MenuItemCard";
import { EditItemModal } from "@/components/bulkMenuUpload/EditItemModal";
import { useCreatedPartnerStore } from "@/store/createdPartnerStore";

// Import banner upload dependencies
import { fetchFromHasura } from "@/lib/hasuraClient";
import { updatePartnerBannerMutation } from "@/api/auth";
import { processImage } from "@/lib/processImage";
import { uploadFileToS3 } from "@/app/actions/aws-s3";

export default function SuperAdminCreatePartnerPage() {
  const router = useRouter();
  const { createPartner } = useSuperAdminPartnerStore();
  const { locationData, countries } = useLocationStore();
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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Use the new created partner store
  const { partner, setPartner, clearPartner } = useCreatedPartnerStore();

  // Superadmin bulk menu upload logic
  const bulkUpload = useSuperAdminBulkUpload();

  // Banner upload state
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isBannerUploading, setBannerUploading] = useState(false);

  const validateForm = () => {
    if (!formData.hotelName || !formData.phone || !formData.upiId || !formData.country || (formData.country === "India" && (!formData.state || !formData.area))) {
      setError("Please fill in all required fields");
      setIsSubmitting(false);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    if (!validateForm()) return;
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
    } catch (error: any) {
      setError(error?.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Banner upload logic
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const file = files[0];
    setBannerFile(file);
    setBannerImage(URL.createObjectURL(file));
  };

  const handleBannerUpload = async () => {
    if (!partner || !bannerFile) {
      toast.error("Please select a banner image first");
      return;
    }

    setBannerUploading(true);
    try {
      // Process the image
      const processedImage = await processImage(
        bannerImage!,
        "local"
      );

      // Upload to S3
      const s3Url = await uploadFileToS3(
        processedImage,
        `${partner.id}/banner/banner_${Date.now()}.webp`
      );

      // Update partner's store_banner in database
      const response = await fetchFromHasura(updatePartnerBannerMutation, {
        id: partner.id,
        store_banner: s3Url,
      });

      if (response?.update_partners_by_pk) {
        // Update the partner object in store with new banner URL
        setPartner({
          ...partner,
          store_banner: s3Url,
        });
        toast.success("Banner uploaded successfully!");
      } else {
        throw new Error("Failed to update partner banner in database");
      }
    } catch (error) {
      console.error("Banner upload error:", error);
      toast.error("Failed to upload banner");
    } finally {
      setBannerUploading(false);
    }
  };

  // Check if AI generate is enabled
  const isAIGenerateEnabled = Array.isArray(bulkUpload.menuItems) && bulkUpload.menuItems.length > 0 && 'image_prompt' in bulkUpload.menuItems[0];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50 py-8 px-2">
      <div className="w-full max-w-7xl bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <Link href="/superadmin" className="inline-flex items-center gap-2 px-4 py-2 rounded border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 transition font-medium">
            <ChevronLeft size={20} />
            Back to Dashboard
          </Link>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Create Partner (Superadmin)</h2>
        {!partner ? (
          <ScrollArea>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="hotelName" className="text-sm font-medium text-gray-700">Business Name</Label>
                <Input
                  id="hotelName"
                  placeholder="Enter your business name"
                  value={formData.hotelName}
                  onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                  className="w-full"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full"
                  required
                />
              </div>

              {/* UPI ID */}
              <div className="space-y-2">
                <Label htmlFor="upiId" className="text-sm font-medium text-gray-700">UPI ID</Label>
                <Input
                  id="upiId"
                  placeholder="Enter your UPI ID"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  className="w-full"
                  required
                />
              </div>

              {/* Location Toggle and Selectors */}
              <div className="space-y-2">
                <div className="flex items-center justify-between space-x-2 mb-4">
                  <Label htmlFor="location-type" className="text-sm text-gray-600">Is your business located in India?</Label>
                  <Switch
                    id="location-type"
                    checked={formData.isInIndia}
                    onCheckedChange={(checked) => setFormData({ ...formData, isInIndia: checked, state: '', area: '', country: checked ? 'India' : '' })}
                    className="data-[state=checked]:bg-orange-600"
                  />
                </div>
                {formData.isInIndia ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => setFormData({ ...formData, state: value, area: '' })}
                      >
                        <SelectTrigger id="state" className="w-full">
                          <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationData.map((stateData) => (
                            <SelectItem key={stateData.state} value={stateData.state}>
                              {stateData.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area" className="text-sm font-medium text-gray-700">District</Label>
                      <Select
                        value={formData.area}
                        onValueChange={(value) => setFormData({ ...formData, area: value })}
                        disabled={!formData.state}
                      >
                        <SelectTrigger id="area" className="w-full">
                          <SelectValue placeholder="Select your district" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.state &&
                            locationData.find((state) => state.state === formData.state)?.districts.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                    >
                      <SelectTrigger id="country" className="w-full">
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2 text-gray-700">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2 text-gray-700">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full"
                  required
                  minLength={6}
                />
              </div>

              {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">{error}</div>}
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2" disabled={isSubmitting}>{isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div> : "Create Partner"}</Button>
            </form>
          </ScrollArea>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Partner Created:</h3>
              <div className="text-lg font-semibold text-orange-700">{partner?.store_name || partner?.name}</div>
              <div className="mt-2 text-gray-700">
                <div><b>Email:</b> {partner?.email}</div>
                <div><b>Phone:</b> {partner?.phone}</div>
                <div><b>UPI ID:</b> {partner?.upi_id}</div>
                <div><b>District:</b> {partner?.district}</div>
                <div><b>Country:</b> {partner?.country}</div>
                <div><b>Status:</b> {partner?.status}</div>
                {partner?.store_banner && (
                  <div className="mt-2">
                    <b>Banner:</b> 
                    <img 
                      src={partner.store_banner} 
                      alt="Partner Banner" 
                      className="w-full h-24 object-cover rounded mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <Button className="flex-1 h-12 text-base" onClick={() => setShowBulkMenu(v => !v)}>{showBulkMenu ? "Close Bulk Menu Upload" : "Add Bulk Menu"}</Button>
              <Button className="flex-1 h-12 text-base" onClick={() => setShowBanner(v => !v)}>{showBanner ? "Close Banner Upload" : "Add Banner"}</Button>
            </div>
            {(!showBulkMenu && !showBanner) && <div className="text-center text-gray-500 text-sm">Select an action above</div>}
            {showBulkMenu && (
              <div className="mt-6 border rounded-lg p-6 bg-orange-50">
                {/* Bulk Menu Upload Panel with all features */}
                <div className="mb-6 font-semibold text-xl">Bulk Menu Upload</div>
                
                {/* JSON Input Section */}
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">JSON Input</Label>
                  <Textarea
                    placeholder="Paste your JSON here..."
                    value={bulkUpload.jsonInput}
                    onChange={e => bulkUpload.setJsonInput(e.target.value)}
                    className="min-h-[200px] text-base p-4 w-full"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                  <Button
                    className="text-[13px] w-full h-12"
                    onClick={bulkUpload.handleJsonSubmit}
                    disabled={!bulkUpload.jsonInput.trim()}
                  >
                    {bulkUpload.menuItems.length > 0 ? "Update JSON" : "Convert JSON"}
                  </Button>

                  {bulkUpload.menuItems.length > 0 && (
                    <>
                      <Button
                        className="text-[13px] w-full h-12"
                        variant="destructive"
                        onClick={bulkUpload.handleClear}
                      >
                        Clear All
                      </Button>

                      <Button
                        className="text-[13px] w-full h-12"
                        onClick={() => bulkUpload.handleUploadSelected(partner?.id)}
                        disabled={bulkUpload.isBulkUploading}
                      >
                        {bulkUpload.isBulkUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Upload Selected"
                        )}
                      </Button>
                    </>
                  )}
                </div>

                {/* Select All Checkbox */}
                {bulkUpload.menuItems.length > 0 && (
                  <div className="mb-4 flex items-center">
                    <Checkbox
                      checked={bulkUpload.selectAll}
                      onCheckedChange={bulkUpload.handleSelectAll}
                      id="selectAll"
                      className="h-5 w-5"
                    />
                    <label htmlFor="selectAll" className="ml-2 text-base">
                      Select All
                    </label>
                  </div>
                )}

                {/* Image Generation Buttons */}
                {bulkUpload.menuItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Button
                      onClick={bulkUpload.handleGenerateImages}
                      className="bg-green-600 hover:bg-green-700 text-white h-12 text-sm sm:text-base flex-1"
                      disabled={bulkUpload.loading}
                    >
                      {bulkUpload.loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate Full Images"}
                    </Button>
                    <Button
                      onClick={bulkUpload.handlePartialImageGeneration}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white h-12 text-sm sm:text-base flex-1"
                      disabled={bulkUpload.loading}
                    >
                      {bulkUpload.loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate Partial Images"}
                    </Button>
                    <Button
                      onClick={bulkUpload.handleGenerateAIImages}
                      className="bg-purple-600 hover:bg-purple-700 text-white h-12 text-sm sm:text-base flex-1"
                      disabled={bulkUpload.loading || !isAIGenerateEnabled}
                    >
                      {bulkUpload.loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Generate AI Images"}
                    </Button>
                  </div>
                )}

                {/* Menu Items Grid */}
                {bulkUpload.menuItems.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {bulkUpload.menuItems.map((item, idx) => (
                      <MenuItemCard
                        key={idx}
                        item={item}
                        index={idx}
                        isUploading={bulkUpload.isUploading[idx]}
                        onSelect={() => bulkUpload.handleSelectItem(idx)}
                        onAddToMenu={() => bulkUpload.handleAddToMenu(item, idx, partner?.id)}
                        onEdit={() => bulkUpload.handleEdit(idx, item)}
                        onDelete={() => bulkUpload.handleDelete(idx)}
                        onImageClick={(index, url) => bulkUpload.handleImageClick(index, url)}
                        onCategoryChange={(category) => bulkUpload.handleCategoryChange(idx, { name: category, priority: 0, id: item.category.id })}
                      />
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {bulkUpload.menuItems.length === 0 && (
                  <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                    Convert JSON to see menu items here
                  </div>
                )}

                {/* Edit Modal */}
                {bulkUpload.isEditModalOpen && bulkUpload.editingItem && (
                  <div className="w-full max-w-2xl mx-auto">
                    <EditItemModal
                      isOpen={bulkUpload.isEditModalOpen}
                      onOpenChange={bulkUpload.setIsEditModalOpen}
                      editingItem={bulkUpload.editingItem}
                      onSave={bulkUpload.handleSaveEdit}
                      onEdit={(field, value) => bulkUpload.setEditingItem(
                        bulkUpload.editingItem
                          ? { ...bulkUpload.editingItem, item: { ...bulkUpload.editingItem.item, [field]: value } }
                          : null
                      )}
                    />
                  </div>
                )}
              </div>
            )}
            {showBanner && (
              <div className="mt-6 border rounded-lg p-4 bg-orange-50">
                <div className="mb-4 font-semibold text-lg">Upload Banner</div>
                <div className="flex flex-col items-center gap-4">
                  <label htmlFor="bannerInput" className="w-full cursor-pointer">
                    <div className="h-48 w-full bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {bannerImage ? (
                        <img src={bannerImage} alt="Banner Preview" className="object-cover w-full h-48" />
                      ) : (
                        <span className="text-gray-500">Click to select banner image</span>
                      )}
                    </div>
                    <input type="file" id="bannerInput" accept="image/*" onChange={handleBannerChange} className="hidden" />
                  </label>
                  <Button onClick={handleBannerUpload} disabled={isBannerUploading || !bannerImage} className="w-full">{isBannerUploading ? "Uploading..." : "Upload Banner"}</Button>
                </div>
              </div>
            )}
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={clearPartner}>Create Another Partner</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 

