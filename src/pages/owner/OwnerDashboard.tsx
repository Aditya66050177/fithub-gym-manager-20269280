import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dumbbell, LogOut, Plus, Building2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Gym {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  timings: string;
  plans: { id: string }[];
}

export default function OwnerDashboard() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    timings: '',
  });

  useEffect(() => {
    if (userRole !== 'owner') {
      navigate('/dashboard');
    } else {
      fetchGyms();
    }
  }, [userRole, navigate]);

  const fetchGyms = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('gyms')
      .select(`
        id,
        name,
        description,
        address,
        city,
        state,
        timings,
        plans (id)
      `)
      .eq('owner_id', user.id);

    if (!error && data) {
      setGyms(data as any);
    }
    setLoading(false);
  };

  const handleCreateGym = async () => {
    if (!user) return;

    console.log('Creating gym with data:', {
      owner_id: user.id,
      name: formData.name,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      timings: formData.timings,
    });

    const { error } = await supabase.from('gyms').insert({
      owner_id: user.id,
      name: formData.name,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      timings: formData.timings,
    } as any);

    if (error) {
      console.error('Gym creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create gym',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Gym created successfully',
    });
    setOpenDialog(false);
    setFormData({ name: '', description: '', address: '', city: '', state: '', timings: '' });
    fetchGyms();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FitHub Owner</span>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Gyms</h1>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Gym
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Gym</DialogTitle>
                <DialogDescription>Add your gym details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Gym Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="timings">Timings</Label>
                  <Input
                    id="timings"
                    placeholder="e.g., 6 AM - 10 PM"
                    value={formData.timings}
                    onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGym}>Create Gym</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gyms.map((gym) => (
            <Card key={gym.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-2">{gym.name}</CardTitle>
                <CardDescription>{gym.city}, {gym.state}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{gym.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Users className="h-4 w-4" />
                  <span>{gym.plans.length} Plans</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => navigate(`/owner/gym/${gym.id}`)}
                >
                  Manage Gym
                </Button>
              </CardContent>
            </Card>
          ))}

          {gyms.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No gyms yet. Create your first gym!</p>
                <Button onClick={() => setOpenDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Gym
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
