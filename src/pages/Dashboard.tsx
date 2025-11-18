import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && userRole) {
      // Redirect based on role
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'owner') {
        navigate('/owner');
      } else if (userRole === 'user') {
        navigate('/user');
      }
    }
  }, [user, loading, userRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 animate-pulse mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <header className="bg-card border-b">
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
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground mb-8">Role: {userRole || 'Loading...'}</p>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Email: {user.email}</p>
                <Button className="mt-4" variant="secondary">Edit Profile</Button>
              </CardContent>
            </Card>

            {userRole === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Panel</CardTitle>
                  <CardDescription>Manage gyms and owners</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => navigate('/admin')}>Go to Admin Dashboard</Button>
                </CardContent>
              </Card>
            )}

            {userRole === 'owner' && (
              <Card>
                <CardHeader>
                  <CardTitle>Gym Owner Panel</CardTitle>
                  <CardDescription>Manage your gyms</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Gyms</Button>
                </CardContent>
              </Card>
            )}

            {userRole === 'user' && (
              <Card>
                <CardHeader>
                  <CardTitle>Browse Gyms</CardTitle>
                  <CardDescription>Find and join gyms</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Explore Gyms</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
