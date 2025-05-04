"use client";
import { fetchFromHasura } from "@/lib/hasuraClient";
import {
  FeatureFlags,
  getFeatures,
  revertFeatureToString,
} from "@/screens/HotelMenuPage_v2";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { revalidateTag } from "@/app/actions/revalidate";

interface PartnerWithFeatureFlags extends Partner {
  featureFlag: FeatureFlags;
}

const FeatureFlagManagement = () => {
  const [partners, setPartners] = useState<PartnerWithFeatureFlags[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState<{
    name: string;
    description: string;
  } | null>(null);

  const featureDescriptions = {
    ordering:
      "Enables ordering feature in QR Scan page. When enabled, customers can place orders by scanning the QR code.",
    delivery:
      "Enables ordering feature in Hotel Details page. When enabled, customers can place delivery orders from the hotel details page.",
  };

  const getAllPartners = async () => {
    setLoading(true);
    try {
      const res = await fetchFromHasura(
        `query {
          partners {
            id
            store_name
            feature_flags
          }
        }`
      );

      if (res) {
        const partnersWithFeatureFlags = res.partners.map(
          (partner: Partner) => {
            const featureFlag = getFeatures(partner.feature_flags || "");
            return {
              ...partner,
              featureFlag,
            } as PartnerWithFeatureFlags;
          }
        );
        setPartners(partnersWithFeatureFlags);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
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

  const updateFeatureFlag = async (
    partnerId: string,
    feature: keyof FeatureFlags,
    type: "access" | "enabled",
    value: boolean
  ) => {
    setPartners((prev) =>
      prev.map((partner) => {
        if (partner.id === partnerId) {
          const updatedFeatureFlag = {
            ...partner.featureFlag,
            [feature]: {
              ...partner.featureFlag[feature],
              [type]: value,
            },
          };

          // If enabling 'enabled', ensure 'access' is also true
          if (type === "enabled" && value) {
            updatedFeatureFlag[feature].access = true;
          }

          // If disabling 'access', also disable 'enabled'
          if (type === "access" && !value) {
            updatedFeatureFlag[feature].enabled = false;
          }

          // Update in backend
          updatePartnerFeatureFlags(partnerId, updatedFeatureFlag);

          return {
            ...partner,
            featureFlag: updatedFeatureFlag,
          };
        }
        return partner;
      })
    );
  };

  const updatePartnerFeatureFlags = async (
    partnerId: string,
    featureFlag: FeatureFlags
  ) => {
    try {
      const featureString = revertFeatureToString(featureFlag);
      await fetchFromHasura(
        `mutation UpdatePartnerFeatureFlags($partnerId: uuid!, $featureFlags: String!) {
          update_partners_by_pk(pk_columns: {id: $partnerId}, _set: {feature_flags: $featureFlags}) {
            id
          }
        }`,
        {
          partnerId,
          featureFlags: featureString,
        }
      );
      revalidateTag(partnerId);
    } catch (error) {
      console.error("Error updating feature flags:", error);
      // Revert changes if update fails
      getAllPartners();
    }
  };

  const openFeatureDescription = (feature: keyof FeatureFlags) => {
    setActiveFeature({
      name: feature,
      description: featureDescriptions[feature],
    });
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
          <TableCaption>
            A list of partners and their feature flags.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Name</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-2">
                  Ordering Access
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4"
                        onClick={() => openFeatureDescription("ordering")}
                      >
                        ℹ️
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ordering Feature</AlertDialogTitle>
                        <AlertDialogDescription>
                          {featureDescriptions.ordering}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction>Close</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableHead>
              <TableHead className="text-center">Ordering Enabled</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-2">
                  Delivery Access
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4"
                        onClick={() => openFeatureDescription("delivery")}
                      >
                        ℹ️
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delivery Feature</AlertDialogTitle>
                        <AlertDialogDescription>
                          {featureDescriptions.delivery}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction>Close</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableHead>
              <TableHead className="text-center">Delivery Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell>{partner.store_name}</TableCell>

                {/* Ordering Access */}
                <TableCell className="text-center">
                  <Checkbox
                    checked={partner.featureFlag.ordering.access}
                    onCheckedChange={(checked) =>
                      updateFeatureFlag(
                        partner.id,
                        "ordering",
                        "access",
                        checked as boolean
                      )
                    }
                  />
                </TableCell>

                {/* Ordering Enabled */}
                <TableCell className="text-center">
                  <Checkbox
                    checked={partner.featureFlag.ordering.enabled}
                    disabled={!partner.featureFlag.ordering.access}
                    onCheckedChange={(checked) =>
                      updateFeatureFlag(
                        partner.id,
                        "ordering",
                        "enabled",
                        checked as boolean
                      )
                    }
                  />
                </TableCell>

                {/* Delivery Access */}
                <TableCell className="text-center">
                  <Checkbox
                    checked={partner.featureFlag.delivery.access}
                    onCheckedChange={(checked) =>
                      updateFeatureFlag(
                        partner.id,
                        "delivery",
                        "access",
                        checked as boolean
                      )
                    }
                  />
                </TableCell>

                {/* Delivery Enabled */}
                <TableCell className="text-center">
                  <Checkbox
                    checked={partner.featureFlag.delivery.enabled}
                    disabled={!partner.featureFlag.delivery.access}
                    onCheckedChange={(checked) =>
                      updateFeatureFlag(
                        partner.id,
                        "delivery",
                        "enabled",
                        checked as boolean
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Feature Description Dialog */}
      {activeFeature && (
        <AlertDialog
          open={!!activeFeature}
          onOpenChange={() => setActiveFeature(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{activeFeature.name} Feature</AlertDialogTitle>
              <AlertDialogDescription>
                {activeFeature.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default FeatureFlagManagement;
