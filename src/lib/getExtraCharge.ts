import { PricingRule } from "@/app/admin/qr-management/page";
import { OrderItem } from "@/store/orderStore";

export const getExtraCharge = (
  items: OrderItem[],
  extraCharge: PricingRule[] | number,
  chargeType: "PER_ITEM" | "FLAT_FEE"
) => {
  console.log("getExtraCharge called with:", {
    itemsCount: items.length,
    extraCharge,
    chargeType,
    items: items.map(item => ({ name: item.name, price: item.price, quantity: item.quantity }))
  });

  if (!extraCharge || items.length === 0) {
    console.log("getExtraCharge: No extra charge or no items, returning 0");
    return 0;
  }

  // Handle backward compatibility for old numeric format
  if (typeof extraCharge === "number") {
    if (extraCharge <= 0) {
      console.log("getExtraCharge: Numeric charge is <= 0, returning 0");
      return 0;
    }
    const result = chargeType === "PER_ITEM"
      ? items.reduce((acc, item) => acc + item.quantity, 0) * extraCharge
      : extraCharge;
    console.log("getExtraCharge: Numeric charge result:", result);
    return result;
  }

  // Handle new step-based pricing format
  if (!Array.isArray(extraCharge) || extraCharge.length === 0) {
    console.log("getExtraCharge: No valid pricing rules, returning 0");
    return 0;
  }

  // Calculate the subtotal of all items
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  console.log("getExtraCharge: Subtotal calculated:", subtotal);

  // Find the appropriate pricing rule based on the subtotal
  const applicableRule = extraCharge.find((rule) => {
    const meetsMinimum = subtotal >= rule.min_amount;
    const meetsMaximum =
      rule.max_amount === null || subtotal <= rule.max_amount;
    return meetsMinimum && meetsMaximum;
  });

  console.log("getExtraCharge: Applicable rule found:", applicableRule);

  if (!applicableRule || applicableRule.charge <= 0) {
    console.log("getExtraCharge: No applicable rule or charge <= 0, returning 0");
    return 0;
  }

  // Apply the charge based on the charge type
  const result = chargeType === "PER_ITEM"
    ? items.reduce((acc, item) => acc + item.quantity, 0) *
        applicableRule.charge
    : applicableRule.charge;

  console.log("getExtraCharge: Final result:", result);
  return result;
};
