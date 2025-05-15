import { Button } from "@/components/ui/button";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { Partner, useAuthStore } from "@/store/authStore";
import { Order } from "@/store/orderStore";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { RiBillFill } from "react-icons/ri";

const TodaysEarnings = ({ orders } : { orders : Order[] }) => {
  const [todaysEarnings, setTodaysEarnings] = useState(0);
  const { userData } = useAuthStore();

  const fetchOrders = async () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const day = new Date().getDate();
    const date = `${year}-${month < 10 ? "0" + month : month}-${
      day < 10 ? "0" + day : day
    }`;

    const query = `
        query Last24HoursCompletedOrders {
            orders_aggregate(where: {_and: [{created_at: {_gte: "${date}"}}, {status: {_eq: "completed"}}]}) {
                aggregate {
                sum {
                    total_price
                }
                }
            }
        }
`;

    const { orders_aggregate } = await fetchFromHasura(query);

    setTodaysEarnings(orders_aggregate.aggregate.sum.total_price);
  };

  useEffect(() => {
    fetchOrders();
  }, [orders]);

  return (
    <div className="bg-gray-100 rounded-xl w-full py-6 px-4 sm:px-10 mb-5 flex justify-between items-center">
      <div>
        <h1 className="text-lg font-bold">Today's Earnings</h1>
        <p className="text-4xl font-bold">
          {todaysEarnings
            ? `${(userData as Partner)?.currency}${todaysEarnings}`
            : "Loading..."}
        </p>
      </div>

      <Link href={'/my-earnings'} className="flex gap-2 bg-black rounded-lg text-xs sm:text-sm text-white font-medium py-2 px-4 items-center">
        <RiBillFill /> View Report
      </Link>
    </div>
  );
};

export default TodaysEarnings;
