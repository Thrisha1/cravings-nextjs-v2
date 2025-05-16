"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { useLocationStore } from "@/store/locationStore";
import { MapPin } from "lucide-react";
import { resolveShortUrl } from "@/app/actions/extractLatLonFromGoogleMapsUrl";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreatePartnerStore } from "@/store/createPartnerStore";
import { useCreatePartnerBulkUpload } from "@/hooks/useBulkUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

function CreatePartner() {
  const { createPartner } = useAuthStore();
  const { locations } = useLocationStore();
  const {
    step,
    setStep,
    jsonInput,
    setJsonInput,
    parsedJson,
    partner,
    setPartner,
    clearData,
    handleGenerateImages,
    handlePartialImageGeneration,
    handleGenerateAIImages,
  } = useCreatePartnerStore();

  const {
    menuItems,
    handleJsonSubmit,
    handleAddToMenu,
    handleDelete,
    handleUploadSelected,
    handleEdit,
    handleCategoryChange,
  } = useCreatePartnerBulkUpload();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    hotelName: "",
    area: "",
    location: "",
    phone: "",
    upiId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJsonVisible, setIsJsonVisible] = useState<boolean>(true);
  const [isProductView, setIsProductView] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProductIndex, setEditProductIndex] = useState<number | null>(null);
  const [editProductData, setEditProductData] = useState({
    name: "",
    description: "",
    price: "",
    category: ""
  });

  const currentPartner = partner;

  const validateUpiId = (upiId: string) => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
    return upiRegex.test(upiId);
  };

  const validateForm = async () => {
    if (!validateUpiId(formData.upiId)) {
      setError("Please enter a valid UPI ID (format: username@bankname)");
      return false;
    }

    if (
      !formData.hotelName ||
      !formData.area ||
      !formData.location ||
      !formData.phone ||
      !formData.upiId ||
      !formData.email ||
      !formData.password
    ) {
      setError("Please fill in all required fields");
      return false;
    }

    const urlWithCoordinates = await resolveShortUrl(formData.location);
    setFormData(prev => ({
      ...prev,
      location: urlWithCoordinates ?? prev.location
    }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!(await validateForm())) {
      setIsSubmitting(false);
      return;
    }

    try {
      const partner = await createPartner(
        formData.hotelName,
        formData.phone,
        formData.upiId,
        formData.area,
        formData.location,
        formData.email,
        formData.password
      );
      setPartner(partner);
      toast.success("Partner created successfully!");
      setFormData({
        email: "",
        password: "",
        hotelName: "",
        area: "",
        location: "",
        phone: "",
        upiId: "",
      });
      setStep(2);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGoogleMaps = () => {
    window.open("https://www.google.com/maps", "_blank");
  };

  const toggleJsonVisibility = () => {
    setIsJsonVisible((prev) => !prev);
  };

  const toggleView = () => {
    setIsProductView((prev) => !prev);
  };

  const isAIGenerateEnabled = Array.isArray(parsedJson) && parsedJson.length > 0 && 'image_prompt' in parsedJson[0];

  const openEditModal = (index: number) => {
    setEditProductIndex(index);
    setEditProductData(parsedJson[index]);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditProductIndex(null);
  };

  const handleEditProductChange = (field: string, value: string) => {
    setEditProductData(prev => ({ ...prev, [field]: value }));
  };

  const saveProductChanges = () => {
    if (editProductIndex !== null) {
      const updatedJson = [...parsedJson];
      updatedJson[editProductIndex] = editProductData;
      setJsonInput(JSON.stringify(updatedJson, null, 2));
      closeEditModal();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <Button
          onClick={() => setStep(Math.max(1, step - 1))}
          variant="outline"
          disabled={step === 1}
        >
          Previous Step
        </Button>
        <Button
          onClick={() => setStep(Math.min(3, step + 1))}
          variant="outline"
          disabled={step === 3}
        >
          Next Step
        </Button>
      </div>
      <div className="max-w-4xl mx-auto">
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Partner</CardTitle>
              <CardDescription>
                Fill in the details below to create a new partner account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hotelName">Business Name</Label>
                    <Input
                      id="hotelName"
                      placeholder="Enter business name"
                      value={formData.hotelName}
                      onChange={(e) =>
                        setFormData({ ...formData, hotelName: e.target.value, upiId: `${e.target.value}@oksbi` })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      placeholder="Enter UPI ID (e.g. username@bankname)"
                      value={formData.upiId}
                      onChange={(e) =>
                        setFormData({ ...formData, upiId: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">District</Label>
                    <Select
                      value={formData.area}
                      onValueChange={(value) =>
                        setFormData({ ...formData, area: value })
                      }
                    >
                      <SelectTrigger id="area">
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location: string) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="location">Google Map Location</Label>
                    <div className="relative">
                      <Textarea
                        id="location"
                        placeholder="Paste your gmap location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="min-h-[100px] pr-10"
                        required
                      />
                      <Button
                        type="button"
                        className="absolute right-2 top-2"
                        onClick={openGoogleMaps}
                      >
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Partner"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 2 && currentPartner && (
          <div className="">

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Current Partner Details</CardTitle>
                <CardDescription>
                  Review the details of the current partner.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Business Name</p>
                    <p className="mt-1">{currentPartner.store_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1">{currentPartner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1">{currentPartner.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">District</p>
                    <p className="mt-1">{currentPartner.district}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">UPI ID</p>
                    <p className="mt-1">{currentPartner.upi_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="mt-1">{currentPartner.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>JSON Input</CardTitle>
                <CardDescription>
                  Enter JSON data to parse and display.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJsonSubmit} className="space-y-4">
                  <Textarea
                    placeholder="Enter JSON here"
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Parse JSON
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Image Generation</CardTitle>
                <CardDescription>
                  Generate images using different methods.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <Button
                    onClick={handleGenerateImages}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Generate Full Images
                  </Button>
                  <Button
                    onClick={handlePartialImageGeneration}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Generate Partial Images
                  </Button>
                  <Button
                    onClick={handleGenerateAIImages}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={!isAIGenerateEnabled}
                  >
                    {isAIGenerateEnabled ? "Generate AI Images" : "No AI prompt found"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <div className="flex justify-between items-center px-4 py-5">
                <div>
                  <CardTitle>Parsed JSON</CardTitle>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={toggleJsonVisibility}
                    className="ml-4"
                  >
                    {isJsonVisible ? "Minimize" : "Expand"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={toggleView}
                    className="ml-4"
                  >
                    {isProductView ? "Show JSON" : "Show Products"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="ml-4"
                  >
                    proceed to bulk upload
                  </Button>
                </div>
              </div>
              {isJsonVisible && (
                <CardContent>
                  {isProductView ? (
                    <div className="grid grid-cols-1 gap-4">
                      {Array.isArray(parsedJson) && parsedJson.map((item, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between">
                            <div className="">
                              <p className="font-bold">Name: {item.name}</p>
                              <p>Description: {item.description}</p>
                              <p>Price: {item.price}</p>
                              <p>Category: {item.category}</p>
                            </div>
                            <img src={item.image} alt={item.name} className="size-24 mt-2" />
                          </div>
                          <Button onClick={() => openEditModal(index)} className="mt-2">Edit</Button>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                      {JSON.stringify(parsedJson, null, 2)}
                    </pre>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {step === 3 && parsedJson && (
          <div>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Bulk Menu Upload</CardTitle>
                <CardDescription>
                  Manage and upload menu items in bulk.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                  {Array.isArray(parsedJson) && parsedJson.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-center">
                        <Input
                          value={item.name}
                          onChange={(e) => handleEdit(index, { ...item, name: e.target.value })}
                          className="font-bold text-lg"
                        />
                        <Input
                          value={item.price}
                          type="number"
                          onChange={(e) => handleEdit(index, { ...item, price: parseFloat(e.target.value) })}
                          className="font-bold text-2xl text-right"
                        />
                      </div>
                      <Textarea
                        value={item.description}
                        onChange={(e) => handleEdit(index, { ...item, description: e.target.value })}
                        className="text-gray-600 mt-2"
                      />
                      <div className="flex gap-2 items-center mt-2">
                        <label htmlFor="category" className="text-sm">
                          Category :
                        </label>
                        <Input
                          id="category"
                          className="flex-1"
                          placeholder="Enter category name"
                          value={item.category}
                          onChange={(e) => handleCategoryChange(index, { name: e.target.value, id: item.category.id, priority: 0 })}
                        />
                      </div>
                      <div className="flex justify-between mt-4">
                        <Button
                          onClick={() => handleAddToMenu(item, index)}
                          disabled={item.isAdded || !item.category.name}
                        >
                          Add to Menu
                        </Button>
                        <Button variant="destructive" onClick={() => handleDelete(index)}>
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <Button
                  className="mt-6"
                  onClick={() => handleUploadSelected(partner?.id)}
                  disabled={menuItems.every(item => !item.isSelected)}
                >
                  Confirm Bulk Upload
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <Button
          onClick={clearData}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white"
        >
          Clear All Data
        </Button>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Edit the details of the product below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Name"
              value={editProductData.name}
              onChange={(e) => handleEditProductChange('name', e.target.value)}
            />
            <Textarea
              placeholder="Description"
              value={editProductData.description}
              onChange={(e) => handleEditProductChange('description', e.target.value)}
            />
            <Input
              placeholder="Price"
              type="number"
              value={editProductData.price}
              onChange={(e) => handleEditProductChange('price', e.target.value)}
            />
            <Input
              placeholder="Category"
              value={editProductData.category}
              onChange={(e) => handleEditProductChange('category', e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={saveProductChanges}>Save</Button>
            <Button variant="outline" onClick={closeEditModal}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CreatePartner;
