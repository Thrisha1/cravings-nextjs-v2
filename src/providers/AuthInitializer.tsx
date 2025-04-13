// app/providers/AuthInitializer.tsx
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

const AuthInitializer = () => {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    console.log("AuthInitializer started");
    
    fetchUser().catch((error) => {
      console.error("Failed to fetch user:", error);
    });
  }, [fetchUser]);

  return null;
};

export default AuthInitializer;
