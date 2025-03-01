"use client";
// import Link from "next/link";
import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Link } from "lucide-react";
import React, { useState } from "react";

const TestPage = () => {
  const [upiLink, setUpiLink] = useState("upi://pay?pa=6238969297@ptyes&pn=MUHAMMED%20MUSTHAFA%20AMEEN%20%20N%20M");
  const router = useRouter();

  const onClickFn = () => {
    router.push(upiLink);
  }

  return (
    <div>
      <div>Test Link : </div>
      <input 
        type="text" 
        value={upiLink} 
        onChange={(e) => setUpiLink(e.target.value)} 
        placeholder="Enter UPI link" 
        className="border p-2 mb-4 bg-white"
      />

      <div>Click :</div>
      <div onClick={onClickFn}>{upiLink}</div>
    </div>
  );
};

export default TestPage;
