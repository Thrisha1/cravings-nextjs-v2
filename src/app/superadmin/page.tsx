import AssignQrPartners from "@/components/superAdmin/AssignQrPartners";
import OfferUploadSuperAdmin from "@/components/superAdmin/OfferUploadSuperAdmin";
// import BulkUpload from "@/components/superAdmin/BulkUpload";
// import OfferDetails from "@/components/superAdmin/OfferDetails";
import PartnerVerification from "@/components/superAdmin/PartnerVerification";
import UpdateHotelUpiId from "@/components/superAdmin/UpdateHotelUpiId";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

const page = async (props: { searchParams: SearchParams }) => {
  const page = (await props.searchParams).page;
  const pages = [
    {
      name: "Partner Verification",
      component: <PartnerVerification />,
      id: "partner-verification",
    },
    // {
    //   name: "Offer Details",
    //   component: <OfferDetails />,
    //   id: "offer-Details",
    // },
    {
      name: "Assign QR",
      component: <AssignQrPartners />,
      id: "assign-qr",
    },
    // {
    //   name: "Bulk Upload",
    //   component: <BulkUpload />,
    //   id: "bulk-upload",
    // },
    {
      name: "Update Hotel UPI ID",
      component: <UpdateHotelUpiId />,
      id: "update-hotel-upi-id",
    },
    {
      name: "Offer Upload",
      component: <OfferUploadSuperAdmin />,
      id: "offer-upload",
    },
  ];

  if (page) {
    const selectedPage = pages.find((p) => p.id === page);
    return (
      <main className="px-3 py-5 sm:px-[7.5%] bg-[#FFF7EC] min-h-screen">
        <h1 className="text-2xl lg:text-4xl font-bold mb-5">
          {selectedPage?.name}
        </h1>
        {selectedPage?.component}
      </main>
    );
  } else {
    return (
      <main className="px-3 py-5 sm:px-[7.5%] bg-[#FFF7EC] min-h-screen">
        <h1 className="text-2xl lg:text-4xl font-bold">Dashboard</h1>

        <div className="mt-5">
          {pages.map((p) => (
            <Link
              className="font-medium p-4 mt-2 rounded border-2 border-[#ffba79]/20 bg-[#fffefd] flex items-center justify-between"
              href={`?page=${p.id}`}
              key={p.name}
            >
              {p.name}
              <ChevronRight size={24} className="text-orange-600" />
            </Link>
          ))}
        </div>
      </main>
    );
  }
};

export default page;
