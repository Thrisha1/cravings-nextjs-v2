import React from "react";
import { CommonOffer } from "../superAdmin/OfferUploadSuperAdmin";
import Image from "next/image";

type DistrictKeys =
  | "thiruvananthapuram"
  | "kollam"
  | "pathanamthitta"
  | "alappuzha"
  | "kottayam"
  | "idukki"
  | "ernakulam"
  | "thrissur"
  | "palakkad"
  | "malappuram"
  | "kozhikode"
  | "wayanad"
  | "kannur"
  | "kasaragod";

const districtToShortForm: Record<DistrictKeys, string> = {
  thiruvananthapuram: "tvm",
  kollam: "klm",
  pathanamthitta: "pta",
  alappuzha: "alp",
  kottayam: "ktm",
  idukki: "idk",
  ernakulam: "ekm",
  thrissur: "tsr",
  palakkad: "plk",
  malappuram: "mlp",
  kozhikode: "kkd",
  wayanad: "wyd",
  kannur: "knr",
  kasaragod: "kgd",
};

const CommonOfferCard = ({ commonOffer }: { commonOffer: CommonOffer }) => {
  return (
    <div className="relative overflow-hidden">
      <div className="relative aspect-[9/14] lg:aspect-[6/4] w-full rounded-xl overflow-hidden">
        <Image
          src={commonOffer.image_url as string}
          alt={commonOffer.item_name}
          fill
          className="w-full h-full object-cover "
        />
      </div>

      {/* details  */}
      <div className="w-full h-full absolute top-0 left-0 bg-gradient-to-b from-transparent to-black rounded-xl">
        <div className="absolute bottom-0 left-0 p-3 w-full">
          <h1 className="text-white font-bold text-lg capitalize">
            {commonOffer.item_name.toLowerCase()}
          </h1>
          <p className="text-white/80 text-sm capitalize">
            {commonOffer.partner_name.toLowerCase()}
          </p>
          <div className="flex justify-between items-center mt-2">
            <p className="text-orange-600 font-bold text-lg">
              ₹{commonOffer.price}
            </p>

            <p className="text-white/80 font-bold text-right uppercase">
              {districtToShortForm[
                commonOffer.district.toLowerCase() as DistrictKeys
              ] || commonOffer.district.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonOfferCard;
