import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireRole?: 'hotel' | 'superadmin';
}

export function AuthGuard({ children, requireRole }: AuthGuardProps) {
  const { user, userData, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (requireRole) {
        if (userData?.role !== requireRole) {
          navigate('/');
        }
      }
    }
  }, [user, userData, loading, navigate, requireRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user || (requireRole && userData?.role !== requireRole)) {
    return null;
  }

  // Show verification pending message for unverified partners
  if (requireRole === 'hotel' && userData?.role === 'hotel' && userData.verified === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 p-8">
        <div className="max-w-2xl mx-auto">
          <Alert className="bg-white shadow-lg">
            <AlertDescription className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Verification Pending</h2>
              <p className="text-gray-600">
                Your partner account is currently pending verification. Please contact our support team to complete the verification process.
              </p>
              <Button
                onClick={() => window.open('tel:6238969297')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Support (6238969297)
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}