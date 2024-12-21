import React from "react";
import { motion } from "motion/react";

const DiscountBadge = ({ discount }: { discount: number }) => {
  return (
    <div className="badge-clip absolute top-0 right-0 text-white bg-red-600 grid text-center p-2">
      <motion.span
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.4,
          scale: { type: "spring", visualDuration: 0.4, bounce: 0.7 , delay : 0.3 },
        }}
        className="font-bold text-xl"
      >
        {discount}%
      </motion.span>
      <span className="font-medium text-sm">OFF</span>
    </div>
  );
};

export default DiscountBadge;
