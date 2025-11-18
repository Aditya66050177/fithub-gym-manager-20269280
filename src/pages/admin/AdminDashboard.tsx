import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, LogOut, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GymOwnerRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<GymOwnerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/dashboard');
    } else {
      fetchRequests();
    }
  }, [userRole, navigate]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('gym_owners')
      .select(`
        id,
        user_id,
        status,
        created_at,
        profiles (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data as any);
    }
    setLoading(false);
  };

  const handleApprove = async (requestId: string, userId: string) => {
    const { error: updateError } = await (supabase
      .from('gym_owners')
      // @ts-expect-error Supabase type inference issue
      .update({ status: 'approved' })
      .eq('id', requestId));

    if (updateError) {
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        variant: 'destructive',
      });
      return;
    }

    const { error: roleError } = await (supabase
      .from('user_roles')
      // @ts-expect-error Supabase type inference issue
      .update({ role: 'owner' })
      .eq('user_id', userId));

    if (roleError) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Gym owner approved',
    });
    fetchRequests();
  };

  const handleReject = async (requestId: string) => {
    const { error } = await (supabase
      .from('gym_owners')
      // @ts-expect-error Supabase type inference issue
      .update({ status: 'rejected' })
      .eq('id', requestId));

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Request rejected',
    });
    fetchRequests();
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
            <span className="text-xl font-bold">FitHub Admin</span>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Gym Owner Requests</h1>

        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{request.profiles.name}</CardTitle>
                    <CardDescription>{request.profiles.email}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      request.status === 'approved'
                        ? 'default'
                        : request.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              {request.status === 'pending' && (
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(request.id, request.user_id)}
                      className="flex-1"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(request.id)}
                      className="flex-1"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {requests.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No gym owner requests found
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
