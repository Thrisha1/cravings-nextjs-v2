import { fetchFromHasura } from "@/lib/hasuraClient";
import { GET_QR_CODES_BY_PARTNER } from "@/api/qrcodes";
import { QrCodesTable } from "@/components/superAdmin/QrCodesTable";

export default async function PartnerQrCodesPage({
  params,
}: {
  params: { partnerId: string };
}) {
  const { partnerId } = params;
  const response = await fetchFromHasura(GET_QR_CODES_BY_PARTNER, {
    partner_id: partnerId,
  });
  
  const qrCodes = response?.qr_codes || [];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">QR Codes Management</h1>
      <QrCodesTable qrCodes={qrCodes} partnerId={partnerId} />
    </div>
  );
}