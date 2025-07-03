import { getAuthCookie } from "@/app/auth/actions";
import { toast } from "sonner";
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default-secret-key";

function encryptData(data: any): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
}

function decryptData(ciphertext: string): any {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

export function addAccount(user: any) {
  const newUser = {
    name: user?.name || "Guest",
    email: user?.email || "No email",
    store_name: user?.store_name || "No store name",
    role: user?.role || "guest",
    id: user?.id,
    password: user?.password || "123456",
  };

  // Get existing accounts (decrypt if they exist)
  let existingAccounts = [];
  const encryptedAccounts = localStorage.getItem("accounts");

  if (encryptedAccounts) {
    existingAccounts = decryptData(encryptedAccounts);
  }

  // Check if account already exists
  const isAccountExists = existingAccounts.some(
    (account: any) => account.email === newUser.email
  );

  if (isAccountExists) {
    return;
  }

  // Add new account and encrypt before storing
  existingAccounts.push(newUser);
  localStorage.setItem("accounts", encryptData(existingAccounts));
}

export async function getAllAccounts() {
  const encryptedAccounts = localStorage.getItem("accounts");
  if (!encryptedAccounts) {
    return [];
  }
  let accounts = decryptData(encryptedAccounts);
  return accounts;
}

export async function getAccounts() {
  const currentUser = await getAuthCookie();
  const encryptedAccounts = localStorage.getItem("accounts");

  if (!encryptedAccounts) {
    return [];
  }

  // Decrypt accounts
  let accounts = decryptData(encryptedAccounts);

  // Filter out the current user
  if (currentUser) {
    accounts = accounts.filter((account: any) => account.id !== currentUser.id);
  }

  return accounts;
}

export function removeAccount(id: string) {
  const encryptedAccounts = localStorage.getItem("accounts");

  if (!encryptedAccounts) {
    toast.error("No accounts found");
    return;
  }

  // Decrypt, filter, and re-encrypt
  const existingAccounts = decryptData(encryptedAccounts);
  const updatedAccounts = existingAccounts.filter(
    (account: any) => account.id !== id
  );

  localStorage.setItem("accounts", encryptData(updatedAccounts));
  toast.success("Account removed successfully");
}
