import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Phone } from 'lucide-react';

interface Partner {
  id: string;
  hotelName: string;
  email: string;
  phone: string;
  area: string;
  category: string;
  verified: boolean;
}

export default function SuperAdmin() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'hotel'),
          where('verified', '==', false)
        );
        
        const querySnapshot = await getDocs(q);
        const partnersData: Partner[] = [];
        
        querySnapshot.forEach((doc) => {
          partnersData.push({ id: doc.id, ...doc.data() } as Partner);
        });
        
        setPartners(partnersData);
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  const verifyPartner = async (partnerId: string) => {
    try {
      await updateDoc(doc(db, 'users', partnerId), {
        verified: true
      });
      setPartners(partners.filter(partner => partner.id !== partnerId));
    } catch (error) {
      console.error('Error verifying partner:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Partner Verification</h1>
        
        {partners.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No pending verifications</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <Card key={partner.id}>
                <CardHeader>
                  <CardTitle>{partner.hotelName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-medium">{partner.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{partner.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{partner.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Area</p>
                      <p className="font-medium">{partner.area}</p>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        onClick={() => verifyPartner(partner.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Verify Partner
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(`tel:${partner.phone}`)}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}