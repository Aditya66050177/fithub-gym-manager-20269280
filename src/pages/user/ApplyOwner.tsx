import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dumbbell, LogOut, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ApplyOwner() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  useEffect(() => {
    if (userRole !== 'user') {
      navigate('/dashboard');
    } else {
      checkExistingApplication();
    }
  }, [userRole, navigate]);

  const checkExistingApplication = async () => {
    if (!user) return;

    type ApplicationData = { status: 'pending' | 'approved' | 'rejected' };
    const { data, error } = await supabase
      .from('gym_owners')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle<ApplicationData>();

    if (!error && data) {
      setApplicationStatus(data.status);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);

    const { error } = await (supabase
      .from('gym_owners')
      // @ts-expect-error Supabase type inference issue
      .insert([{
        user_id: user.id,
        status: 'pending'
      }]));

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Your application has been submitted! An admin will review it soon.'
      });
      setApplicationStatus('pending');
    }

    setSubmitting(false);
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
            <span className="text-xl font-bold">FitHub</span>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/user')} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Become a Gym Owner</CardTitle>
              <CardDescription>
                Apply to list your gym on FitHub and reach more members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {applicationStatus === null && (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Benefits of being a gym owner:</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>List your gym and reach thousands of potential members</li>
                        <li>Create and manage multiple membership plans</li>
                        <li>Track member attendance with QR codes</li>
                        <li>Accept online payments through Razorpay</li>
                        <li>Manage your gym's profile, photos, and timings</li>
                      </ul>
                    </div>

                    <Alert>
                      <AlertDescription>
                        Once you submit your application, an admin will review it and approve or reject it.
                        You'll be notified once a decision is made.
                      </AlertDescription>
                    </Alert>
                  </div>

                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </>
              )}

              {applicationStatus === 'pending' && (
                <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="ml-2">
                    Your application is pending review. An admin will review it soon.
                  </AlertDescription>
                </Alert>
              )}

              {applicationStatus === 'approved' && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="ml-2">
                    Congratulations! Your application has been approved. Please refresh the page to access your owner dashboard.
                  </AlertDescription>
                </Alert>
              )}

              {applicationStatus === 'rejected' && (
                <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="ml-2">
                    Your application was rejected. Please contact support for more information.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
