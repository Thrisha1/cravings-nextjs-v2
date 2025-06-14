import { fetchFromHasura } from "./hasuraClient";

export interface PricingRule {
  min_amount: number;
  max_amount: number | null;
  charge: number;
}

export interface QrGroup {
  id: string;
  name: string;
  extra_charge: PricingRule[];
  charge_type: 'PER_ITEM' | 'FLAT_FEE';
  partner_id: string;
  table_number?: number;
}

export const getQrGroupForTable = async (
  partnerId: string,
  tableNumber: number
): Promise<QrGroup | null> => {
  try {
    console.log("getQrGroupForTable called with:", { partnerId, tableNumber });
    
    // For table 0, we need to look in qr_codes table and get the qr_group data
    if (tableNumber === 0) {
      console.log("Fetching QR group for table 0 from qr_codes table");
      
      const qrCodeResponse = await fetchFromHasura(
        `
        query GetQrCodeForTable($partner_id: uuid!, $table_number: Int!) {
          qr_codes(where: {partner_id: {_eq: $partner_id}, table_number: {_eq: $table_number}}) {
            id
            table_number
            qr_group {
              id
              name
              extra_charge
              charge_type
              partner_id
            }
          }
        }
      `,
        {
          partner_id: partnerId,
          table_number: tableNumber,
        }
      );

      console.log("QR code response for table 0:", qrCodeResponse);

      if (qrCodeResponse.qr_codes && qrCodeResponse.qr_codes.length > 0) {
        const qrCode = qrCodeResponse.qr_codes[0];
        if (qrCode.qr_group) {
          const group = qrCode.qr_group;
          console.log("Found QR group through qr_codes for table 0:", group);
          
          // Transform the extra_charge to match the expected format
          const extra_charge = Array.isArray(group.extra_charge)
            ? group.extra_charge
            : typeof group.extra_charge === 'number'
              ? [{ min_amount: 0, max_amount: null, charge: group.extra_charge }]
              : [{ min_amount: 0, max_amount: null, charge: 0 }];

          const result = {
            ...group,
            table_number: qrCode.table_number,
            extra_charge,
          } as QrGroup;
          
          console.log("Transformed QR group result from qr_codes:", result);
          return result;
        } else {
          console.log("QR code found but no qr_group associated with it");
        }
      } else {
        console.log("No QR codes found for table 0");
        
        // Fallback: try to find any QR group that might be suitable for delivery
        console.log("Trying fallback: looking for any QR group suitable for delivery");
        
        const fallbackResponse = await fetchFromHasura(
          `
          query GetAnyQrGroupForPartner($partner_id: uuid!) {
            qr_groups(where: {partner_id: {_eq: $partner_id}}) {
              id
              name
              extra_charge
              charge_type
              partner_id
              table_number
            }
          }
        `,
          {
            partner_id: partnerId,
          }
        );

        console.log("Fallback QR group response:", fallbackResponse);

        if (fallbackResponse.qr_groups && fallbackResponse.qr_groups.length > 0) {
          // Find the first QR group that might be suitable for delivery (table 0 or null table)
          const deliveryGroup = fallbackResponse.qr_groups.find(
            (group: any) => group.table_number === 0 || group.table_number === null
          ) || fallbackResponse.qr_groups[0]; // Fallback to first group

          console.log("Found fallback delivery QR group:", deliveryGroup);
          
          // Transform the extra_charge to match the expected format
          const extra_charge = Array.isArray(deliveryGroup.extra_charge)
            ? deliveryGroup.extra_charge
            : typeof deliveryGroup.extra_charge === 'number'
              ? [{ min_amount: 0, max_amount: null, charge: deliveryGroup.extra_charge }]
              : [{ min_amount: 0, max_amount: null, charge: 0 }];

          const result = {
            ...deliveryGroup,
            extra_charge,
          } as QrGroup;
          
          console.log("Transformed fallback QR group result:", result);
          return result;
        }
      }
    } else {
      // For other table numbers, try direct QR group lookup
      const response = await fetchFromHasura(
        `
        query GetQrGroupForTable($partner_id: uuid!, $table_number: Int!) {
          qr_groups(where: {partner_id: {_eq: $partner_id}, table_number: {_eq: $table_number}}) {
            id
            name
            extra_charge
            charge_type
            partner_id
            table_number
          }
        }
      `,
        {
          partner_id: partnerId,
          table_number: tableNumber,
        }
      );

      console.log("Direct QR group response:", response);

      if (response.qr_groups && response.qr_groups.length > 0) {
        const group = response.qr_groups[0];
        console.log("Found direct QR group:", group);
        
        // Transform the extra_charge to match the expected format
        const extra_charge = Array.isArray(group.extra_charge)
          ? group.extra_charge
          : typeof group.extra_charge === 'number'
            ? [{ min_amount: 0, max_amount: null, charge: group.extra_charge }]
            : [{ min_amount: 0, max_amount: null, charge: 0 }];

        const result = {
          ...group,
          extra_charge,
        } as QrGroup;
        
        console.log("Transformed direct QR group result:", result);
        return result;
      }
    }

    console.log("No QR group found for table:", tableNumber);
    return null;
  } catch (error) {
    console.error("Error fetching QR group for table:", error);
    return null;
  }
}; 