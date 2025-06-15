"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, XCircle, Loader2 } from "lucide-react";
import useOrderStore, { PaymentModalState } from "@/store/orderStore";

// Payment Loader Modal - Full screen overlay with loader
export const PaymentLoaderModal = () => {
  const { payment_loader_modal } = useOrderStore();

  if (!payment_loader_modal) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 max-w-sm mx-4">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
        <h2 className="text-xl font-semibold text-center">Processing Payment</h2>
        <p className="text-gray-600 text-center">
          Please wait while we verify your payment...
        </p>
      </div>
    </div>
  );
};

// Payment Result Modal - Center modal with auto close timer
export const PaymentResultModal = () => {
  const { payment_result_modal, closePaymentResultModal } = useOrderStore();
  const [timeLeft, setTimeLeft] = useState(payment_result_modal.autoCloseTimer);

  useEffect(() => {
    if (!payment_result_modal.isOpen) return;

    setTimeLeft(payment_result_modal.autoCloseTimer);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          closePaymentResultModal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [payment_result_modal.isOpen, payment_result_modal.autoCloseTimer, closePaymentResultModal]);

  const handleClose = () => {
    closePaymentResultModal();
  };

  if (!payment_result_modal.isOpen) return null;

  const isSuccess = payment_result_modal.type === 'success';

  return (
    <div className="fixed inset-0 z-[9998] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-center ${isSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex justify-center mb-4">
            {isSuccess ? (
              <CheckCircle className="h-16 w-16 text-green-600" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <h2 className={`text-2xl font-bold ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-center mb-6">
            {payment_result_modal.message}
          </p>
          
          {/* Timer and Close Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Auto-close in {timeLeft}s
            </div>
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Combined component that renders both modals
const PaymentModals = () => {
  return (
    <>
      <PaymentLoaderModal />
      <PaymentResultModal />
    </>
  );
};

export default PaymentModals; 