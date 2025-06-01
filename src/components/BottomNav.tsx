"use client";
import { BadgePercent, Telescope } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const BottomNav = () => {
  const pathname = usePathname();
  const [isValidPath, setIsValidPath] = useState(false);

  const items = [
    {
      href: "/explore",
      name: "Explore",
      icon: <Telescope size={20} />,
    },
    {
      href: "/offers",
      name: "Offers",
      icon: <BadgePercent size={20} />,
    },
  ];

  useEffect(() => {
    const isvalidpath = items.some((item) => pathname === item.href);
    setIsValidPath(isvalidpath);
  }, [pathname]);

  return (
    <section className={`lg:hidden ${!isValidPath ? "hidden" : ""}`}>
      <div className="fixed bottom-0 left-0 w-full bg-white px-4 py-3 flex justify-around z-[50]">
        {items.map((item) => (
          <Link key={item.name} href={item.href} className="text-center">
            <div
              className={`flex flex-col items-center text-sm font-medium ${
                pathname === item.href ? "text-orange-600" : "text-black/60"
              }`}
            >
              <div>{item.icon}</div>
              <span>{item.name}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full h-[100px] bg-gradient-to-t from-black/90 to-transparent  z-[40]"></div>
    </section>
  );
};

export default BottomNav;
