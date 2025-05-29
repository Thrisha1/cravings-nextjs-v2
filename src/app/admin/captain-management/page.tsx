"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore, Partner } from "@/store/authStore";
import { getFeatures } from "@/lib/getFeatures";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { createCaptainMutation, getCaptainsQuery, deleteCaptainMutation } from "@/api/captains";

interface Captain {
  id: string;
  email: string;
  name: string;
  partner_id: string;
  role: string;
}

export default function CaptainManagementPage() {
  const router = useRouter();
  const { userData } = useAuthStore();
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [captainName, setCaptainName] = useState("");
  const [captainEmail, setCaptainEmail] = useState("");
  const [captainPassword, setCaptainPassword] = useState("");
  const [isCreatingCaptain, setIsCreatingCaptain] = useState(false);
  const [captainError, setCaptainError] = useState<string | null>(null);
  const [isDeletingCaptain, setIsDeletingCaptain] = useState<string | null>(null);
  const [showCaptainForm, setShowCaptainForm] = useState(false);
  const [features, setFeatures] = useState<any>(null);

  useEffect(() => {
    if (userData && userData.role === "partner") {
      setFeatures(getFeatures((userData as Partner).feature_flags || ""));
    }
  }, [userData]);

  useEffect(() => {
    if (userData && features?.captainordering?.enabled) {
      fetchCaptains();
    }
  }, [userData, features?.captainordering?.enabled]);

  const fetchCaptains = async () => {
    if (!userData) return;
    try {
      const result = await fetchFromHasura(getCaptainsQuery, {
        partner_id: userData.id,
      }) as { captain: Captain[] };
      setCaptains(result.captain || []);
    } catch (error) {
      console.error("Error fetching captains:", error);
      toast.error("Failed to fetch captain accounts");
    }
  };

  const handleCreateCaptain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    setIsCreatingCaptain(true);
    setCaptainError(null);
    try {
      if (!captainName || !captainEmail || !captainPassword) {
        throw new Error("Please fill in all fields");
      }
      if (captainPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(captainEmail)) {
        throw new Error("Please enter a valid email address");
      }
      // Check if email already exists
      const checkEmail = await fetchFromHasura(`
        query CheckCaptainEmail($email: String!) {
          captain(where: {email: {_eq: $email}}) { id email }
        }
      `, { email: captainEmail });
      if (checkEmail?.captain?.length > 0) {
        throw new Error("This email is already registered. Please use a different email address.");
      }
      // Check if name already exists
      const checkName = await fetchFromHasura(`
        query CheckCaptainName($name: String!) {
          captain(where: {name: {_eq: $name}}) { id name }
        }
      `, { name: captainName });
      if (checkName?.captain?.length > 0) {
        throw new Error("This name is already taken. Please use a different name.");
      }
      const result = await fetchFromHasura(createCaptainMutation, {
        name: captainName,
        email: captainEmail,
        password: captainPassword,
        partner_id: userData.id,
        role: "captain",
      });
      if (!result?.insert_captain_one) {
        throw new Error("Failed to create captain account");
      }
      toast.success("Captain account created successfully!");
      setCaptainName("");
      setCaptainEmail("");
      setCaptainPassword("");
      setShowCaptainForm(false);
      fetchCaptains();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create captain account";
      setCaptainError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCreatingCaptain(false);
    }
  };

  const handleDeleteCaptain = async (id: string) => {
    setIsDeletingCaptain(id);
    try {
      // Remove captain reference from orders
      const updateOrdersMutation = `
        mutation UpdateOrdersWithCaptain($captain_id: uuid!) {
          update_orders(
            where: { captain_id: { _eq: $captain_id } }
            _set: { captain_id: null, orderedby: null }
          ) { affected_rows }
        }
      `;
      await fetchFromHasura(updateOrdersMutation, { captain_id: id });
      await fetchFromHasura(deleteCaptainMutation, { id });
      await fetchCaptains();
      toast.success("Captain deleted successfully");
    } catch (error) {
      toast.error("Failed to delete captain");
    } finally {
      setIsDeletingCaptain(null);
    }
  };

  if (!userData || !features?.captainordering?.enabled) {
    return (
      <div className="p-8 text-center text-gray-500">Captain ordering is not enabled or you do not have access.</div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-orange-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Captain Management</h1>
          <Button variant="outline" onClick={() => router.push("/profile")}>Back to Profile</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Captain Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[140px] overflow-y-auto border rounded-lg bg-gray-50 p-2 space-y-2 mb-4">
              {captains.length === 0 && <div className="text-gray-500">No captains found.</div>}
              {captains.map((captain) => (
                <div key={captain.id} className="flex items-center justify-between p-2 bg-white border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{captain.name || "Unnamed Captain"}</div>
                    <div className="text-xs text-gray-500">{captain.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCaptain(captain.id)}
                    disabled={isDeletingCaptain === captain.id}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                  >
                    {isDeletingCaptain === captain.id ? (
                      <div className="animate-spin h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            {showCaptainForm ? (
              <form onSubmit={handleCreateCaptain} className="p-4 bg-white border rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Create Captain Account</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCaptainForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <label htmlFor="captainName" className="text-sm font-medium">Name</label>
                  <Input id="captainName" type="text" placeholder="Enter captain name" value={captainName} onChange={e => setCaptainName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="captainEmail" className="text-sm font-medium">Email</label>
                  <Input id="captainEmail" type="email" placeholder="Enter captain email" value={captainEmail} onChange={e => setCaptainEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="captainPassword" className="text-sm font-medium">Password</label>
                  <Input id="captainPassword" type="password" placeholder="Enter captain password" value={captainPassword} onChange={e => setCaptainPassword(e.target.value)} required />
                </div>
                {captainError && <p className="text-sm text-red-500">{captainError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreatingCaptain} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                    {isCreatingCaptain ? "Creating..." : "Create Account"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCaptainForm(false)} className="flex-1">Cancel</Button>
                </div>
              </form>
            ) : (
              <Button onClick={() => setShowCaptainForm(true)} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Captain Account
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 