"use client";
import Image from "next/image";
import React from "react";

const Error = () => {
  return (
    <div>
      <Image src="./icon-192x192.png" alt="404" width={300} height={300} />
      <h1>Offer Not-Found/Expired</h1>
    </div>
  );
};

export default Error;
