// app/providers/AuthInitializer.tsx
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore"; // adjust path

const AuthInitializer = () => {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return null;
};

export default AuthInitializer;
