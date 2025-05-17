"use client";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

export interface QrGroup {
  id: string;
  name: string;
  extra_charge: number;
  charge_type: 'PER_ITEM' | 'FLAT_FEE';
}

interface QrCode {
  id: string;
  table_number: string;
  qr_group: QrGroup | null;
}

const QrManagementPage = () => {
  const [qrGroups, setQrGroups] = useState<QrGroup[]>([]);
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [newExtraCharge, setNewExtraCharge] = useState(0);
  const [newChargeType, setNewChargeType] = useState<'PER_ITEM' | 'FLAT_FEE'>('FLAT_FEE');
  const [editingGroup, setEditingGroup] = useState<QrGroup | null>(null);
  const { userData } = useAuthStore();

  useEffect(() => {
    if (userData?.id) {
      fetchQrGroups();
      fetchQrCodes();
    }
  }, [userData]);

  const fetchQrGroups = async () => {
    try {
      const query = `
        query GetQrGroups($partner_id: uuid!) {
          qr_groups(where: {partner_id: {_eq: $partner_id}}) {
            extra_charge
            id
            name
            charge_type
          }
        }
      `;
      const data = await fetchFromHasura(query, { partner_id: userData?.id });
      setQrGroups(data.qr_groups);
    } catch (error) {
      console.error("Error fetching QR groups:", error);
      toast.error("Failed to fetch QR groups");
    }
  };

  const fetchQrCodes = async () => {
    try {
      const query = `
        query GetQrCodes($partner_id: uuid!) {
          qr_codes(where: {partner_id: {_eq: $partner_id}}) {
            id
            table_number
            qr_group {
              name
              extra_charge
              id
              charge_type
            }
          }
        }
      `;
      const data = await fetchFromHasura(query, { partner_id: userData?.id });
      setQrCodes(data.qr_codes);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      setLoading(false);
      toast.error("Failed to fetch QR codes");
    }
  };

  const countQrCodesInGroup = (groupId: string) => {
    return qrCodes.filter((qr) => qr.qr_group?.id === groupId).length;
  };

  const handleAddGroup = async () => {
    try {
      if (!newGroupName.trim()) {
        toast.error("Group name cannot be empty");
        return;
      }

      const mutation = `
        mutation AddQrGroup($name: String!, $extra_charge: numeric!, $partner_id: uuid!, $charge_type: String!) {
          insert_qr_groups_one(object: {
            name: $name,
            extra_charge: $extra_charge,
            partner_id: $partner_id,
            charge_type: $charge_type
          }) {
            id
            name
            extra_charge
            charge_type
          }
        }
      `;

      await fetchFromHasura(mutation, {
        name: newGroupName,
        extra_charge: newExtraCharge,
        partner_id: userData?.id,
        charge_type: newChargeType
      });

      toast.success("QR group added successfully");

      fetchQrGroups();
      setNewGroupName("");
      setNewExtraCharge(0);
      setNewChargeType('FLAT_FEE');
    } catch (error) {
      console.error("Error adding QR group:", error);
      toast.error("Failed to add QR group");
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;

    try {
      if (!editingGroup.name.trim()) {
        toast.error("Group name cannot be empty");
        return;
      }

      const mutation = `
        mutation UpdateQrGroup($id: uuid!, $name: String!, $extra_charge: numeric!, $charge_type: String!) {
          update_qr_groups_by_pk(
            pk_columns: {id: $id},
            _set: {
              name: $name,
              extra_charge: $extra_charge,
              charge_type: $charge_type
            }
          ) {
            id
            name
            extra_charge
            charge_type
          }
        }
      `;

      await fetchFromHasura(mutation, {
        id: editingGroup.id,
        name: editingGroup.name,
        extra_charge: editingGroup.extra_charge,
        charge_type: editingGroup.charge_type
      });

      toast.success("QR group updated successfully");

      fetchQrGroups();
      setEditingGroup(null);
    } catch (error) {
      console.error("Error updating QR group:", error);
      toast.error("Failed to update QR group");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      // First check if there are any QR codes assigned to this group
      const qrCodesInGroup = qrCodes.filter(
        (qr) => qr.qr_group?.id === groupId
      );
      if (qrCodesInGroup.length > 0) {
        toast.error(
          "Cannot delete group with assigned QR codes. Please unassign them first."
        );
        return;
      }

      const mutation = `
        mutation DeleteQrGroup($id: uuid!) {
          delete_qr_groups_by_pk(id: $id) {
            id
          }
        }
      `;

      await fetchFromHasura(mutation, { id: groupId });

      toast.success("QR group deleted successfully");

      fetchQrGroups();
    } catch (error) {
      console.error("Error deleting QR group:", error);
      toast.error("Failed to delete QR group");
    }
  };

  const handleUpdateQrCodeGroup = async (
    qrCodeId: string,
    newGroupId: string
  ) => {
    try {
      const mutation = `
        mutation UpdateQrCodeGroup($id: uuid!, $group_id: uuid) {
          update_qr_codes_by_pk(
            pk_columns: {id: $id},
            _set: {
              group_id: $group_id
            }
          ) {
            id
            qr_group {
              id
              name
              charge_type
            }
          }
        }
      `;

      await fetchFromHasura(mutation, {
        id: qrCodeId,
        group_id: newGroupId === "unassign" ? null : newGroupId,
      });

      // Optimistically update the UI
      setQrCodes((prevCodes) =>
        prevCodes.map((qr) =>
          qr.id === qrCodeId
            ? {
                ...qr,
                qr_group: newGroupId
                  ? qrGroups.find((g) => g.id === newGroupId) || null
                  : null,
              }
            : qr
        )
      );

      toast.success("QR code group updated successfully");
    } catch (error) {
      console.error("Error updating QR code group:", error);
      toast.error("Failed to update QR code group");
      // Revert the optimistic update if the mutation fails
      fetchQrCodes();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-[8%] space-y-8">
      <h1 className="text-2xl font-bold">QR Code Management</h1>

      {/* QR Groups Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">QR Groups</h2>
          <div className="flex justify-end">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Add New Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New QR Group</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="groupName" className="text-right">
                      Group Name
                    </Label>
                    <Input
                      id="groupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="extraCharge" className="text-right">
                      Extra Charge
                    </Label>
                    <Input
                      id="extraCharge"
                      type="number"
                      value={newExtraCharge}
                      onChange={(e) =>
                        setNewExtraCharge(parseFloat(e.target.value))
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="chargeType" className="text-right">
                      Charge Type
                    </Label>
                    <Select
                      value={newChargeType}
                      onValueChange={(value: 'PER_ITEM' | 'FLAT_FEE') => setNewChargeType(value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select charge type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FLAT_FEE">Flat Fee</SelectItem>
                        <SelectItem value="PER_ITEM">Per Item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddGroup}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Name</TableHead>
              <TableHead>Extra Charge</TableHead>
              <TableHead>Charge Type</TableHead>
              <TableHead>No. of QR Codes</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrGroups.length > 0 ? (
              qrGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell className="w-[32px]">
                    ${group.extra_charge}
                  </TableCell>
                  <TableCell className="w-[32px] text-nowrap">
                    {group.charge_type === 'PER_ITEM' ? 'Per Item' : 'Flat Fee'}
                  </TableCell>
                  <TableCell className="w-[29px]">
                    {countQrCodesInGroup(group.id)}
                  </TableCell>
                  <TableCell className="space-x-2 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGroup(group)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No QR groups found. Create your first group using the "Add New
                  Group" button.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Group Dialog */}
      {editingGroup && (
        <Dialog open={true} onOpenChange={() => setEditingGroup(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit QR Group</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editGroupName" className="text-right">
                  Group Name
                </Label>
                <Input
                  id="editGroupName"
                  value={editingGroup.name}
                  onChange={(e) =>
                    setEditingGroup({ ...editingGroup, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editExtraCharge" className="text-right">
                  Extra Charge
                </Label>
                <Input
                  id="editExtraCharge"
                  type="number"
                  value={editingGroup.extra_charge}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      extra_charge: parseFloat(e.target.value),
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editChargeType" className="text-right">
                  Charge Type
                </Label>
                <Select
                  value={editingGroup.charge_type}
                  onValueChange={(value: 'PER_ITEM' | 'FLAT_FEE') =>
                    setEditingGroup({
                      ...editingGroup,
                      charge_type: value
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select charge type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT_FEE">Flat Fee</SelectItem>
                    <SelectItem value="PER_ITEM">Per Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateGroup}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* QR Codes Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">QR Codes</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table Number</TableHead>
              <TableHead>Group Name</TableHead>
              <TableHead>Charge Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrCodes.length > 0 ? (
              qrCodes.map((qrCode) => (
                <TableRow key={qrCode.id}>
                  <TableCell>{qrCode.table_number}</TableCell>
                  <TableCell>
                    {qrCode.qr_group?.name || "No Group Assigned"}
                  </TableCell>
                  <TableCell>
                    {qrCode.qr_group?.charge_type === 'PER_ITEM' 
                      ? 'Per Item' 
                      : qrCode.qr_group?.charge_type === 'FLAT_FEE' 
                        ? 'Flat Fee' 
                        : '-'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={qrCode.qr_group?.id || ""}
                      onValueChange={(value) =>
                        handleUpdateQrCodeGroup(qrCode.id, value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassign">Unassign</SelectItem>
                        {qrGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} ({group.charge_type === 'PER_ITEM' ? 'Per Item' : 'Flat Fee'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No QR codes found. QR codes will appear here once they're
                  created.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default QrManagementPage;