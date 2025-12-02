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
import { ArrowLeft, Dumbbell, Plus, IndianRupee, Users, Edit, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
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
  owner_id: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  opening_time: string;
  closing_time: string;
  timings: string;
  photos: string[];
}

const initialFormData = {
  name: '',
  duration_days: '',
  price: '',
  features: '',
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
  const [uploading, setUploading] = useState(false);

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

    const { data: gymData, error: gymError } = await (supabase as any)
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

    const { data: plansData, error: plansError } = await (supabase as any)
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

    const planData = {
      gym_id: gymId,
      name: planFormData.name,
      duration_days: parseInt(planFormData.duration_days),
      price: parseFloat(planFormData.price),
      features,
      is_active: true,
    };

    let error;
    if (editingPlan) {
      const result = await (supabase as any)
        .from('plans')
        .update(planData)
        .eq('id', editingPlan.id);
      error = result.error;
    } else {
      const result = await (supabase as any).from('plans').insert([planData]);
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
    });
    setOpenPlanDialog(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    const { error } = await (supabase as any).from('plans').delete().eq('id', planId);

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
    const { error } = await (supabase as any)
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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !gymId || !gym) return;

    const files = Array.from(event.target.files);
    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${gymId}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await (supabase as any).storage
          .from('gym-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = (supabase as any).storage
          .from('gym-photos')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newPhotos = [...(gym.photos || []), ...uploadedUrls];

      const { error: updateError } = await (supabase as any)
        .from('gyms')
        .update({ photos: newPhotos })
        .eq('id', gymId);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Photos uploaded successfully',
      });

      fetchGymData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload photos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!gymId || !gym) return;

    try {
      const fileName = photoUrl.split('/').slice(-2).join('/');
      
      const { error: deleteError } = await (supabase as any).storage
        .from('gym-photos')
        .remove([fileName]);

      if (deleteError) throw deleteError;

      const newPhotos = gym.photos.filter((url) => url !== photoUrl);

      const { error: updateError } = await (supabase as any)
        .from('gyms')
        .update({ photos: newPhotos })
        .eq('id', gymId);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Photo deleted successfully',
      });

      fetchGymData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete photo',
        variant: 'destructive',
      });
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
          <p className="text-muted-foreground">{gym.address}</p>
        </div>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
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
                    <div>
                      <Label htmlFor="plan-name">Plan Name *</Label>
                      <Input
                        id="plan-name"
                        placeholder="e.g., Gold Plan, Monthly Pass"
                        value={planFormData.name}
                        onChange={(e) =>
                          setPlanFormData({ ...planFormData, name: e.target.value })
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
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{plan.name}</CardTitle>
                        <CardDescription>
                          {plan.duration_days} days membership
                        </CardDescription>
                      </div>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center gap-1 text-2xl font-bold">
                        <IndianRupee className="h-5 w-5" />
                        {plan.price}
                      </div>
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

          <TabsContent value="photos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gym Photos</CardTitle>
                <CardDescription>
                  Upload photos of your gym to attract more members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="flex-1"
                    id="photo-upload"
                  />
                  <Button
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Photos'}
                  </Button>
                </div>

                {gym.photos && gym.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gym.photos.map((photo, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={photo}
                          alt={`${gym.name} photo ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeletePhoto(photo)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No photos uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
