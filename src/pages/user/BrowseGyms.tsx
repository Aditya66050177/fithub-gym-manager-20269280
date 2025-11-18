import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dumbbell, LogOut, MapPin, Clock, Search } from 'lucide-react';

interface Gym {
  id: string;
  name: string;
  description: string;
  location: string;
  timings: string;
  plans: { id: string; price: number }[];
}

export default function BrowseGyms() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== 'user') {
      navigate('/dashboard');
    } else {
      fetchGyms();
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = gyms.filter(
        (gym) =>
          gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gym.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGyms(filtered);
    } else {
      setFilteredGyms(gyms);
    }
  }, [searchQuery, gyms]);

  const fetchGyms = async () => {
    const { data, error } = await supabase
      .from('gyms')
      .select(`
        id,
        name,
        description,
        location,
        timings,
        plans!inner (
          id,
          price,
          is_active
        )
      `)
      .eq('plans.is_active', true);

    if (!error && data) {
      setGyms(data as any);
      setFilteredGyms(data as any);
    }
    setLoading(false);
  };

  const getMinPrice = (plans: { price: number }[]) => {
    if (plans.length === 0) return 0;
    return Math.min(...plans.map((p) => p.price));
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
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FitHub</span>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Browse Gyms</h1>
          <p className="text-muted-foreground mb-6">Find the perfect gym for your fitness journey</p>

          <div className="relative mb-8">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {filteredGyms.map((gym) => (
              <Card
                key={gym.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/gym/${gym.id}`)}
              >
                <CardHeader>
                  <CardTitle>{gym.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {gym.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{gym.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{gym.timings}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Starting from</p>
                      <p className="text-2xl font-bold">₹{getMinPrice(gym.plans)}</p>
                    </div>
                    <Button>View Plans</Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredGyms.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No gyms found matching your search' : 'No gyms available yet'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
