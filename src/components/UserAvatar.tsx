import { getAccounts } from "@/lib/addAccount";
import { Partner, useAuthStore, User } from "@/store/authStore";
import { UserCircle, LogOut, Plus, Settings } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const UserAvatar = ({ userData }: { userData: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    userData: user,
    signInCaptainWithEmail,
    signInSuperAdminWithEmail,
    signInWithPhone,
    signInPartnerWithEmail,
  } = useAuthStore();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const toggleDialog = () => setIsOpen(!isOpen);
  const [accounts, setAccounts] = useState<any[]>([]);

  const otherAccounts = async () => {
    const storedAccounts = await getAccounts();
    console.log("Stored Accounts:", storedAccounts);
    setAccounts(storedAccounts);
  };

  useEffect(() => {
    if (user) {
      otherAccounts();

      const dp = "Guest";

      switch (userData?.role) {
        case "partner":
          setDisplayName((user as Partner)?.store_name || dp);
          break;
        case "superadmin":
          setDisplayName("Super Admin");
          break;
        case "captain":
          setDisplayName("Captain");
          break;
        case "user":
          setDisplayName((user as User)?.phone || dp);
          break;
        default:
          setDisplayName(dp);
          break;
      }
    }
  }, [user, userData]);

  const handleSwitchAccount = async (account: any) => {
    try {
      switch (account.role) {
        case "partner":
          await signInPartnerWithEmail(account.email, account.password);
          break;
        case "superadmin":
          await signInSuperAdminWithEmail(account.email, account.password);
          break;
        case "captain":
          await signInCaptainWithEmail(account.email, account.password);
          break;
        case "user":
          await signInWithPhone(account.password);
          break;
        default:
          toast.error("Unknown account role: " + account.role);
          console.error("Unknown account role:", account.role);
          break;
      }

      // Refresh the page to ensure all state is updated
      window.location.reload();
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to switch account:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDialog}
        className="flex text-sm items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <UserCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          {/* Profile Section */}
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            {userData?.role !== "user" && (
              <p className="text-xs text-gray-500 truncate">
                {user?.email || "No email"}
              </p>
            )}
          </div>

          {/* Account Management */}
          <div className="py-1">
            <Link
              href={"/profile"}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </Link>
          </div>

          {/* Other Accounts */}
          {accounts.length > 0 && (
            <div className="py-1 border-t border-gray-100">
              <p className="px-4 py-2 text-xs text-gray-500">Other accounts</p>
              {/* Map through other accounts here */}
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => handleSwitchAccount(account)}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    {account.name || "Guest"}
                  </div>
                ))
              ) : (
                <p className="px-4 py-2 text-sm text-gray-500">
                  No accounts found
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="py-1 border-t border-gray-100">
            <Link
              href={"/login"}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
