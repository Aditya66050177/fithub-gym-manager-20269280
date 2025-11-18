import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dumbbell } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="text-center">
        <Dumbbell className="h-16 w-16 animate-pulse mx-auto text-primary mb-4" />
        <h1 className="mb-4 text-4xl font-bold">FitHub</h1>
        <p className="text-xl text-muted-foreground mb-8">Your Gym Membership Platform</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/auth')}>Get Started</Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
