import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Dumbbell, Plus, IndianRupee, Users } from 'lucide-react';
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

export default function GymManagement() {
  const { gymId } = useParams();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gym, setGym] = useState<Gym | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    duration_days: '',
    price: '',
    features: '',
  });

  useEffect(() => {
    if (userRole !== 'owner') {
      navigate('/dashboard');
    } else {
      fetchGymData();
    }
  }, [userRole, navigate, gymId]);

  const fetchGymData = async () => {
    if (!gymId) return;

    const { data: gymData, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single();

    if (gymError || !gymData) {
      navigate('/owner');
      return;
    }

    setGym(gymData);

    const { data: plansData, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('gym_id', gymId)
      .order('price');

    if (!plansError && plansData) {
      setPlans(plansData);
    }

    setLoading(false);
  };

  const handleCreatePlan = async () => {
    if (!gymId) return;

    const features = planFormData.features
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f);

    const { error } = await supabase.from('plans').insert({
      gym_id: gymId,
      name: planFormData.name,
      duration_days: parseInt(planFormData.duration_days),
      price: parseFloat(planFormData.price),
      features,
      is_active: true,
    } as any);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create plan',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Plan created successfully',
    });
    setOpenPlanDialog(false);
    setPlanFormData({ name: '', duration_days: '', price: '', features: '' });
    fetchGymData();
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    const { error } = await (supabase
      .from('plans')
      // @ts-expect-error Supabase type inference issue
      .update({ is_active: !currentStatus })
      .eq('id', planId));

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update plan status',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: `Plan ${!currentStatus ? 'activated' : 'deactivated'}`,
    });
    fetchGymData();
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
          <Button variant="ghost" onClick={() => navigate('/owner')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gyms
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{gym.name}</h1>
          <p className="text-muted-foreground">{gym.location}</p>
        </div>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={openPlanDialog} onOpenChange={setOpenPlanDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Plan</DialogTitle>
                    <DialogDescription>Add a membership plan</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="plan-name">Plan Name</Label>
                      <Input
                        id="plan-name"
                        value={planFormData.name}
                        onChange={(e) =>
                          setPlanFormData({ ...planFormData, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (days)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={planFormData.duration_days}
                        onChange={(e) =>
                          setPlanFormData({ ...planFormData, duration_days: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={planFormData.price}
                        onChange={(e) =>
                          setPlanFormData({ ...planFormData, price: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="features">Features (comma separated)</Label>
                      <Input
                        id="features"
                        placeholder="e.g., Access to all equipment, Free trainer"
                        value={planFormData.features}
                        onChange={(e) =>
                          setPlanFormData({ ...planFormData, features: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreatePlan}>Create Plan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {plan.duration_days} days membership
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-2xl font-bold mb-4">
                      <IndianRupee className="h-5 w-5" />
                      {plan.price}
                    </div>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                    >
                      {plan.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {plans.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No plans yet. Create your first plan!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Member management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
