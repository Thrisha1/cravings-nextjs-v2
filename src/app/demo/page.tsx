"use client";

import React, { useEffect, useState } from "react";
import { useDemoPartnerStore, DemoPartner } from "@/store/demoPartnerStore_hasura";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadFileToS3 } from "@/app/actions/aws-s3";
import { processImage } from "@/lib/processImage";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

const typeLabels: Record<string, string> = {
  restaurant: "Restaurant",
  cafe: "Cafe",
  bakery: "Bakery",
  hotel: "Hotel",
};

const typeOptions = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
  { value: "bakery", label: "Bakery" },
  { value: "hotel", label: "Hotel" },
];

const foodTypeOptions = [
  { value: "veg", label: "Veg" },
  { value: "non-veg", label: "Non-Veg" },
];

// Add the same mapping as in /demo/[id]/page.tsx
const typeToPartnerId: Record<string, string | Record<string, string>> = {
  restaurant: {
    veg: "272d9a75-b2f3-46b6-9530-773d3521db6d",
    "non-veg": "373a15f9-9c58-4e34-ae07-b272e578928f"
  },
  cafe: "c62da624-f2b6-4ebc-8b8a-504c1e7d936e",
  bakery: "9c5d77c0-0beb-443b-8005-7bde58e9f37c",
  hotel: "f69c10f9-3d5c-4078-b327-c76be78e8144",
};

// Add DemoPartnerCard component styled like PartnerCard
function DemoPartnerCard({ partner }: { partner: DemoPartner }) {
  return (
    <a
      href={`/demo/${partner.id}`}
      style={{ width: "100%" }}
      className="bg-white rounded-3xl flex-shrink-0 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col border-2 overflow-hidden"
    >
      <div style={{ width: "100%", maxWidth: "100%" }} className="relative h-28">
        <img
          src={partner.banner || "/default-banner.jpg"}
          alt={partner.name}
          className="object-cover rounded-t-lg w-full h-full absolute top-0 left-0"
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-1">
            {partner.name}
          </h2>
        </div>
        <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">
          {typeLabels[partner.type] || partner.type}
          {partner.type === "restaurant" && partner.food_type && (
            <span className="ml-2">| {partner.food_type}</span>
          )}
        </p>
      </div>
    </a>
  );
}

export default function DemoPage() {
  const { demoPartners, fetchDemoPartners, addDemoPartner } = useDemoPartnerStore();
  const { userData } = useAuthStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    banner: "",
    description: "",
    type: "",
    food_type: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState("");
  const [createdDemoId, setCreatedDemoId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDemoPartners().finally(() => setLoading(false));
  }, [fetchDemoPartners]);

  const filtered = demoPartners.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "type" && value !== "restaurant") {
      setForm((prev) => ({ ...prev, food_type: "" }));
    }
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !bannerFile || !form.description || !form.type) {
      setError("Please fill all required fields and upload a banner image.");
      return;
    }
    if (form.type === "restaurant" && !form.food_type) {
      setError("Please select food type for restaurant.");
      return;
    }
    setSubmitting(true);
    try {
      toast.loading("Uploading banner...");
      const webpBase64WithPrefix = await processImage(bannerPreviewUrl, "local");
      const imgUrl = await uploadFileToS3(
        webpBase64WithPrefix,
        `demo_banners/${Date.now()}_v0.webp`
      );
      toast.dismiss();
      let demopartner_id = "";
      if (form.type === "restaurant") {
        demopartner_id = (typeToPartnerId.restaurant as Record<string, string>)[form.food_type];
      } else {
        demopartner_id = typeToPartnerId[form.type] as string;
      }
      const newDemo = await addDemoPartner({
        id: uuidv4(),
        name: form.name,
        banner: imgUrl,
        description: form.description,
        type: form.type,
        food_type: form.type === "restaurant" ? form.food_type : undefined,
        demopartner_id,
      });
      setShowCreateModal(false);
      setForm({ name: "", banner: "", description: "", type: "", food_type: "" });
      setBannerFile(null);
      setBannerPreviewUrl("");
      fetchDemoPartners();
      toast.success("Demo partner created successfully!");
      if (newDemo && newDemo.id) {
        setCreatedDemoId(newDemo.id);
      }
    } catch (err) {
      toast.dismiss();
      setError("Failed to create demo partner.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold"> Partners</h1>
        {userData?.role === "superadmin" && (
          <Button onClick={() => setShowCreateModal(true)}>
            Create Demo Account
          </Button>
        )}
      </div>
      <div className="mb-6">
        <Input
          placeholder="Search demo partners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md"
        />
      </div>
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500">No demo partners found.</div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-lg font-bold mb-4 text-gray-800">
            Discover the Best Demo Partners
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
            {filtered.map((partner) => (
              <DemoPartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </div>
      )}
      {/* Modal placeholder for create demo account */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full shadow-lg">
            <h2 className="text-xl font-bold mb-4">Create Demo Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                name="name"
                placeholder="Demo Partner Name"
                value={form.name}
                onChange={handleFormChange}
                required
              />
              {/* Banner upload */}
              <div>
                <label className="block mb-1 font-medium">Banner Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFileChange}
                  disabled={submitting}
                  className="mb-2"
                />
                {bannerPreviewUrl && (
                  <img
                    src={bannerPreviewUrl}
                    alt="Banner Preview"
                    className="w-full h-32 object-cover rounded mb-2 border"
                  />
                )}
              </div>
              <Textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleFormChange}
                required
              />
              <select
                name="type"
                value={form.type}
                onChange={handleFormChange}
                className="border bg-white rounded p-2 w-full"
                required
              >
                <option value="">Select Type</option>
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {form.type === "restaurant" && (
                <select
                  name="food_type"
                  value={form.food_type}
                  onChange={handleFormChange}
                  className="border rounded p-2 w-full"
                  required
                >
                  <option value="">Select Food Type</option>
                  {foodTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {createdDemoId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg text-center">
            <h2 className="text-xl font-bold mb-4">Demo Account Created!</h2>
            <p className="mb-4">Your demo page is ready:</p>
            <a
              href={`/demo/${createdDemoId}`}
              className="text-blue-600 underline break-all text-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              {`${typeof window !== "undefined" ? window.location.origin : ""}/demo/${createdDemoId}`}
            </a>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row justify-center">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${window.location.origin}/demo/${createdDemoId}`);
                    toast.success("Link copied to clipboard!");
                  } catch {
                    toast.error("Failed to copy link");
                  }
                }}
              >
                Copy
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={async () => {
                  const url = `${window.location.origin}/demo/${createdDemoId}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: "Demo Page", url });
                      toast.success("Link shared!");
                    } catch {
                      // User cancelled or error
                    }
                  } else {
                    try {
                      await navigator.clipboard.writeText(url);
                      toast.success("Link copied to clipboard!");
                    } catch {
                      toast.error("Failed to copy link");
                    }
                  }
                }}
              >
                Share
              </button>
              <button
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                onClick={() => setCreatedDemoId(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 