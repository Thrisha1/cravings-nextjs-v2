import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  numberOfVisits: number;
  isRecentVisit: boolean;
}

const VisitModal = ({ isOpen, onClose, numberOfVisits, isRecentVisit }: VisitModalProps) => {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] sm:max-w-lg rounded-xl bg-gradient-to-br from-orange-50 to-white">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-center text-xl font-bold text-orange-600">
            {isRecentVisit ? '⚠️ Already Scanned Today ⚠️' : '🎉 Thank you for visiting! 🎉'}
          </DialogTitle>
          <DialogDescription className="text-center space-y-4">
            {isRecentVisit ? (
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-inner">
                <p className="text-lg font-semibold text-gray-800">
                  You have already scanned today. Please come back tomorrow to claim more offers!
                </p>
              </div>
            ) : (
              <>
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-inner">
                  <p className="text-xl font-semibold text-gray-800">
                    You have visited this place{" "}
                    <span className="text-orange-600 text-3xl font-bold animate-pulse">
                      {numberOfVisits}
                    </span>{" "}
                    {numberOfVisits === 1 ? "time" : "times"}!
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    We truly appreciate your loyalty and are delighted to have you as our valued guest.
                  </p>
                  <p className="text-base font-medium text-orange-600">
                    🎁 Come back soon for a chance to win exclusive offers and rewards! 🎁
                  </p>
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default VisitModal;