"use client";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { Partner } from "@/store/authStore";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { revalidateTag } from "@/app/actions/revalidate";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PartnerWithDetails extends Partner {
  place_id?: string;
  currency: string;
  show_price_data?: boolean;
  razorpay_linked_account_id?: string;
  business_type?: string;
}

const EditPartners = () => {
  const [partners, setPartners] = useState<PartnerWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<PartnerWithDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getAllPartners = async () => {
    setLoading(true);
    try {
      const res = await fetchFromHasura(
        `query {
          partners {
            id
            name
            email
            store_name
            location
            status
            upi_id
            description
            password
            phone
            district
            place_id
            currency
            show_price_data
            razorpay_linked_account_id
            business_type
          }
        }`
      );

      if (res) {
        setPartners(res.partners);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Failed to fetch partners");
    } finally {
      setLoading(false);
    }
  };

  const searchPartner = () => {
    if (!searchQuery) return partners;
    return partners.filter((partner) =>
      partner.store_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const updatePartner = async (partnerId: string, updates: Partial<PartnerWithDetails>) => {
    try {
      await fetchFromHasura(
        `mutation UpdatePartner($partnerId: uuid!, $updates: partners_set_input!) {
          update_partners_by_pk(pk_columns: {id: $partnerId}, _set: $updates) {
            id
          }
        }`,
        {
          partnerId,
          updates,
        }
      );
      revalidateTag(partnerId);
      toast.success("Partner updated successfully");
      getAllPartners();
    } catch (error) {
      console.error("Error updating partner:", error);
      toast.error("Failed to update partner");
    }
  };

  const handleEdit = (partner: PartnerWithDetails) => {
    setSelectedPartner(partner);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;

    const updates = {
      name: selectedPartner.name,
      email: selectedPartner.email,
      store_name: selectedPartner.store_name,
      location: selectedPartner.location,
      status: selectedPartner.status,
      upi_id: selectedPartner.upi_id,
      description: selectedPartner.description,
      password: selectedPartner.password,
      phone: selectedPartner.phone,
      district: selectedPartner.district,
      place_id: selectedPartner.place_id,
      currency: selectedPartner.currency,
      show_price_data: selectedPartner.show_price_data,
      razorpay_linked_account_id: selectedPartner.razorpay_linked_account_id,
      business_type: selectedPartner.business_type,
    };

    updatePartner(selectedPartner.id, updates);
    setIsDialogOpen(false);
  };

  useEffect(() => {
    getAllPartners();
  }, []);

  const filteredPartners = searchPartner();

  return (
    <div className="p-6">
      <div className="mb-6">
        <Input
          placeholder="Search partners by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div>Loading partners...</div>
      ) : (
        <Table>
          <TableCaption>A list of partners and their details.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Store Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell>{partner.store_name}</TableCell>
                <TableCell>{partner.email}</TableCell>
                <TableCell>{partner.location}</TableCell>
                <TableCell>{partner.status}</TableCell>
                <TableCell>{partner.phone}</TableCell>
                <TableCell>{partner.district}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(partner)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Partner Details</DialogTitle>
            <DialogDescription>
              Make changes to the partners information here.
            </DialogDescription>
          </DialogHeader>
          {selectedPartner && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={selectedPartner.name}
                    onChange={(e) =>
                      setSelectedPartner({ ...selectedPartner, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={selectedPartner.email}
                    onChange={(e) =>
                      setSelectedPartner({ ...selectedPartner, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store_name">Store Name</Label>
                  <Input
                    id="store_name"
                    value={selectedPartner.store_name}
                    onChange={(e) =>
                      setSelectedPartner({ ...selectedPartner, store_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={selectedPartner.location}
                    onChange={(e) =>
                      setSelectedPartner({ ...selectedPartner, location: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={selectedPartner.status}
                    onValueChange={(value) =>
                      setSelectedPartner({ ...selectedPartner, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upi_id">UPI ID</Label>
                  <Input
                    id="upi_id"
                    value={selectedPartner.upi_id}
                    onChange={(e) =>
                      setSelectedPartner({ ...selectedPartner, upi_id: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={selectedPartner.description || ""}
                    onChange={(e) =>
                      setSelectedPartner({ ...selectedPartner, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={selectedPartner.password || ""}
                    onChange={(e) =>
                      setSelectedPartner({ ...selectedPartner, password: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={selectedPartner.phone || ""}
                    onChange={(e) =>
                      setSelectedPartner({ ...selectedPartner, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={selectedPartner.district || ""}
                    onChange={(e) =>
                      setSelectedPartner({ ...selectedPartner, district: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="place_id">Place ID</Label>
                  <Input
                    id="place_id"
                    value={selectedPartner.place_id || ""}
                    onChange={(e) =>
                      setSelectedPartner({ ...selectedPartner, place_id: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={selectedPartner.currency || "₹"}
                    onChange={(e) =>
                      setSelectedPartner({ ...selectedPartner, currency: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razorpay_linked_account_id">Razorpay Account ID</Label>
                  <Input
                    id="razorpay_linked_account_id"
                    value={selectedPartner.razorpay_linked_account_id || ""}
                    onChange={(e) =>
                      setSelectedPartner({
                        ...selectedPartner,
                        razorpay_linked_account_id: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_type">Business Type</Label>
                  <Select
                    value={selectedPartner.business_type || "restaurant"}
                    onValueChange={(value) =>
                      setSelectedPartner({ ...selectedPartner, business_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="show_price_data">Show Price Data</Label>
                  <Switch
                    id="show_price_data"
                    checked={selectedPartner.show_price_data ?? true}
                    onCheckedChange={(checked) =>
                      setSelectedPartner({
                        ...selectedPartner,
                        show_price_data: checked,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditPartners; 