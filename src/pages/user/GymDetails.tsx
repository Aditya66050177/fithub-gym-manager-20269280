import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Dumbbell, MapPin, Clock, IndianRupee, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  features: string[];
  is_active: boolean;
}

interface Gym {
  id: string;
  name: string;
  description: string;
  location: string;
  timings: string;
}

export default function GymDetails() {
  const { gymId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gym, setGym] = useState<Gym | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGymDetails();
  }, [gymId]);

  const fetchGymDetails = async () => {
    if (!gymId) return;

    const { data: gymData, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single();

    if (gymError || !gymData) {
      navigate('/user');
      return;
    }

    setGym(gymData);

    const { data: plansData, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .order('price');

    if (!plansError && plansData) {
      setPlans(plansData);
    }

    setLoading(false);
  };

  const handlePurchasePlan = (planId: string, price: number) => {
    toast({
      title: 'Payment Integration Required',
      description: 'Razorpay integration needs to be configured with your API keys.',
    });
    // TODO: Implement Razorpay payment flow
  };

  if (loading || !gym) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/user')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{gym.name}</h1>
            <p className="text-lg text-muted-foreground mb-6">{gym.description}</p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>{gym.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>{gym.timings}</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Membership Plans</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.duration_days} days membership
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex items-center gap-1 text-3xl font-bold mb-6">
                      <IndianRupee className="h-6 w-6" />
                      {plan.price}
                    </div>
                    
                    <div className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handlePurchasePlan(plan.id, plan.price)}
                    >
                      Purchase Plan
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {plans.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No active plans available at the moment
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
