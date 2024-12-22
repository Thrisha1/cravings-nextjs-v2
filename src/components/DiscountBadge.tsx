import React from "react";

const DiscountBadge = ({ discount }: { discount: number }) => {
  return (
    <div className="badge-clip absolute top-0 right-0 text-white bg-red-600 grid text-center p-2 animate-in">
      <span className="font-bold text-xl">{discount}%</span>
      <span className="font-medium text-sm">OFF</span>
    </div>
  );
};

export default DiscountBadge;
