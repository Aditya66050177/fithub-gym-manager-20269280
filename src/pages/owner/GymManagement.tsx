import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Dumbbell, Plus, IndianRupee, Users, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  features: string[];
  is_active: boolean;
  description: string | null;
  plan_type: 'Basic' | 'Premium' | 'Student' | 'Limited-Time' | null;
  discounted_price: number | null;
  max_users: number | null;
  color_tag: string | null;
  badge_text: string | null;
  image_url: string | null;
  gym_amenities: string[] | null;
  start_date: string | null;
  end_date: string | null;
}

interface Gym {
  id: string;
  name: string;
  description: string;
  location: string;
  timings: string;
}

const initialFormData = {
  name: '',
  duration_days: '',
  price: '',
  features: '',
  description: '',
  plan_type: '',
  discounted_price: '',
  max_users: '',
  color_tag: '#FFD700',
  badge_text: '',
  gym_amenities: '',
};

export default function GymManagement() {
  const { gymId } = useParams();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gym, setGym] = useState<Gym | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planFormData, setPlanFormData] = useState(initialFormData);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (userRole !== 'owner') {
      navigate('/dashboard');
    } else {
      fetchGymData();
    }
  }, [user, userRole, navigate, gymId]);

  const fetchGymData = async () => {
    if (!gymId) return;

    const { data: gymData, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single();

    if (gymError || !gymData) {
      toast({
        title: 'Error',
        description: 'Failed to load gym data',
        variant: 'destructive',
      });
      navigate('/owner');
      return;
    }

    setGym(gymData);

    const { data: plansData, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('gym_id', gymId)
      .order('price');

    if (plansError) {
      toast({
        title: 'Error',
        description: 'Failed to load plans',
        variant: 'destructive',
      });
    } else if (plansData) {
      setPlans(plansData);
    }

    setLoading(false);
  };

  const handleCreateOrUpdatePlan = async () => {
    if (!gymId || !user) return;

    const features = planFormData.features
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f);

    const amenities = planFormData.gym_amenities
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a);

    const planData = {
      gym_id: gymId,
      name: planFormData.name,
      duration_days: parseInt(planFormData.duration_days),
      price: parseFloat(planFormData.price),
      features,
      is_active: true,
      description: planFormData.description || null,
      plan_type: planFormData.plan_type || null,
      discounted_price: planFormData.discounted_price ? parseFloat(planFormData.discounted_price) : null,
      max_users: planFormData.max_users ? parseInt(planFormData.max_users) : null,
      color_tag: planFormData.color_tag || '#FFD700',
      badge_text: planFormData.badge_text || null,
      gym_amenities: amenities.length > 0 ? amenities : null,
    };

    let error;
    if (editingPlan) {
      const result = await supabase
        .from('plans')
        .update(planData)
        .eq('id', editingPlan.id);
      error = result.error;
    } else {
      const result = await supabase.from('plans').insert(planData);
      error = result.error;
    }

    if (error) {
      console.error('Plan operation error:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingPlan ? 'update' : 'create'} plan: ${error.message}`,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: `Plan ${editingPlan ? 'updated' : 'created'} successfully`,
    });
    setOpenPlanDialog(false);
    setEditingPlan(null);
    setPlanFormData(initialFormData);
    fetchGymData();
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      duration_days: plan.duration_days.toString(),
      price: plan.price.toString(),
      features: plan.features.join(', '),
      description: plan.description || '',
      plan_type: plan.plan_type || '',
      discounted_price: plan.discounted_price?.toString() || '',
      max_users: plan.max_users?.toString() || '',
      color_tag: plan.color_tag || '#FFD700',
      badge_text: plan.badge_text || '',
      gym_amenities: plan.gym_amenities?.join(', ') || '',
    });
    setOpenPlanDialog(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    const { error } = await supabase.from('plans').delete().eq('id', planId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete plan',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Plan deleted successfully',
    });
    fetchGymData();
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('plans')
      .update({ is_active: !currentStatus })
      .eq('id', planId);

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

  const handleDialogClose = (open: boolean) => {
    setOpenPlanDialog(open);
    if (!open) {
      setEditingPlan(null);
      setPlanFormData(initialFormData);
    }
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
              <Dialog open={openPlanDialog} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                    <DialogDescription>
                      {editingPlan ? 'Update your membership plan' : 'Add a new membership plan'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="plan-name">Plan Name *</Label>
                        <Input
                          id="plan-name"
                          placeholder="e.g., Gold Plan"
                          value={planFormData.name}
                          onChange={(e) =>
                            setPlanFormData({ ...planFormData, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="plan-type">Plan Type</Label>
                        <Select
                          value={planFormData.plan_type}
                          onValueChange={(value) =>
                            setPlanFormData({ ...planFormData, plan_type: value })
                          }
                        >
                          <SelectTrigger id="plan-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Basic">Basic</SelectItem>
                            <SelectItem value="Premium">Premium</SelectItem>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Limited-Time">Limited-Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="e.g., Access to all equipment + 2 personal training sessions"
                        value={planFormData.description}
                        onChange={(e) =>
                          setPlanFormData({ ...planFormData, description: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (days) *</Label>
                        <Input
                          id="duration"
                          type="number"
                          placeholder="e.g., 30, 90, 365"
                          value={planFormData.duration_days}
                          onChange={(e) =>
                            setPlanFormData({ ...planFormData, duration_days: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-users">Max Users</Label>
                        <Input
                          id="max-users"
                          type="number"
                          placeholder="Leave empty for unlimited"
                          value={planFormData.max_users}
                          onChange={(e) =>
                            setPlanFormData({ ...planFormData, max_users: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price (₹) *</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="e.g., 999"
                          value={planFormData.price}
                          onChange={(e) =>
                            setPlanFormData({ ...planFormData, price: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="discounted-price">Discounted Price (₹)</Label>
                        <Input
                          id="discounted-price"
                          type="number"
                          placeholder="e.g., 799"
                          value={planFormData.discounted_price}
                          onChange={(e) =>
                            setPlanFormData({ ...planFormData, discounted_price: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="features">Benefits / Features (comma separated) *</Label>
                      <Textarea
                        id="features"
                        placeholder="e.g., Access to all equipment, Free trainer sessions, Group classes"
                        value={planFormData.features}
                        onChange={(e) =>
                          setPlanFormData({ ...planFormData, features: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="amenities">Gym Amenities Included (comma separated)</Label>
                      <Textarea
                        id="amenities"
                        placeholder="e.g., Sauna, Steam room, Locker, Shower"
                        value={planFormData.gym_amenities}
                        onChange={(e) =>
                          setPlanFormData({ ...planFormData, gym_amenities: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="color-tag">Color Tag</Label>
                        <Input
                          id="color-tag"
                          type="color"
                          value={planFormData.color_tag}
                          onChange={(e) =>
                            setPlanFormData({ ...planFormData, color_tag: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="badge">Badge Text</Label>
                        <Input
                          id="badge"
                          placeholder="e.g., Most Popular, Best Value"
                          value={planFormData.badge_text}
                          onChange={(e) =>
                            setPlanFormData({ ...planFormData, badge_text: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => handleDialogClose(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateOrUpdatePlan}>
                      {editingPlan ? 'Update Plan' : 'Create Plan'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="relative">
                  {plan.badge_text && (
                    <Badge
                      className="absolute -top-2 -right-2 z-10"
                      style={{ backgroundColor: plan.color_tag || undefined }}
                    >
                      {plan.badge_text}
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {plan.plan_type && (
                            <Badge variant="outline">{plan.plan_type}</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {plan.duration_days} days membership
                        </CardDescription>
                      </div>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        {plan.discounted_price && (
                          <div className="flex items-center gap-1 text-lg text-muted-foreground line-through">
                            <IndianRupee className="h-4 w-4" />
                            {plan.price}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-2xl font-bold">
                          <IndianRupee className="h-5 w-5" />
                          {plan.discounted_price || plan.price}
                        </div>
                      </div>
                      {plan.max_users && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Limited to {plan.max_users} users
                        </p>
                      )}
                    </div>

                    {plan.features.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold mb-2">Benefits:</p>
                        <ul className="space-y-1">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              • {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plan.gym_amenities && plan.gym_amenities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold mb-2">Amenities:</p>
                        <ul className="space-y-1">
                          {plan.gym_amenities.map((amenity, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              • {amenity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                      >
                        {plan.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
