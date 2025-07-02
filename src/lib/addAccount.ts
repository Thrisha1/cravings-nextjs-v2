import { getAuthCookie } from "@/app/auth/actions";
import { toast } from "sonner";

export function addAccount(user: any) {

    const newUser = {
        name: user?.name || "Guest",
        email: user?.email || "No email",
        store_name: user?.store_name || "No store name",
        role: user?.role || "guest",
        id: user?.id ,
        password : user?.password || "123456",
    }   

    const existingAccounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    const isAccountExists = existingAccounts.some((account: any) => account.email === newUser.email);

    if (isAccountExists) {
        toast.error("Account already exists");
        return;
    }

    existingAccounts.push(newUser);
    localStorage.setItem("accounts", JSON.stringify(existingAccounts));
    toast.success("Account added successfully");

}


export async function getAccounts() {
    const currentUser = await getAuthCookie();
    let accounts = JSON.parse(localStorage.getItem("accounts") || "[]");

    if (currentUser){
       accounts = accounts.filter((account: any) => account.id !== currentUser.id); 
    }

    return accounts;
}


export function removeAccount(email: string) {
    const existingAccounts = JSON.parse(localStorage.getItem("accounts") || "[]");
    const updatedAccounts = existingAccounts.filter((account: any) => account.email !== email);
    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
    toast.success("Account removed successfully");
}