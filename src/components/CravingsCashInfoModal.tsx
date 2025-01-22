"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Banknote } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

const CravingsCashInfoModal = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setTimeout(() => {
      if (!user) {
        setOpen(true);
      }
    }, 2000);
  }, [user]);

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-[90%] grid justify-items-center rounded-3xl py-10 px-10 gap-5">
        <h1 className="font-bold text-2xl text-center">
          🎉Welcome to <span className="text-orange-600">Cravings</span>!
        </h1>

        <div className="grid justify-items-center text-orange-600 text-2xl font-bold">
          <Banknote size={100} />
          <h1>₹100 Rs</h1>
        </div>

        <p className="text-center text-black/80">
          Sign up now and get ₹100 Cravings Cash to enjoy delicious offers! 💰
        </p>

        <Link
          onClick={() => setOpen(false)}
          href={"/login"}
          className="text-white rounded-full bg-orange-600 px-6 py-2 font-semibold hover:bg-oragne-500 transition-all"
        >
          Get Now
        </Link>
      </DialogContent>
    </Dialog>
  );
};

export default CravingsCashInfoModal;
