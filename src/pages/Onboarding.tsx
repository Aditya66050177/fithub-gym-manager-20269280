import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Dumbbell, User, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const { error } = await (supabase
      .from('profiles')
      // @ts-ignore Supabase type inference issue
      .update({
        name: formData.name,
        phone: formData.phone || null
      })
      .eq('id', user.id));

    setLoading(false);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setStep(2);
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    const { error } = await (supabase
      .from('profiles')
      // @ts-ignore Supabase type inference issue
      .update({ onboarding_completed: true })
      .eq('id', user.id));

    setLoading(false);

    if (error) {
      toast({
        title: "Error completing onboarding",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Welcome to FitHub!",
      description: "Your profile is all set up"
    });

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Dumbbell className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Welcome to FitHub!</CardTitle>
          <CardDescription className="text-lg">
            Let's get you started with a quick setup
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Step 1: Profile Setup */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Complete Your Profile</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <Button
                onClick={handleProfileUpdate}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Saving...' : 'Continue'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 2: About Gym Memberships */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Browse & Join Gyms</h3>
              </div>

              <div className="space-y-4 text-muted-foreground">
                <p>
                  FitHub connects you with the best gyms in your area. Here's what you can do:
                </p>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Browse gyms</strong> - Discover gyms with detailed information, photos, and timings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Choose plans</strong> - Select from monthly, quarterly, or yearly memberships</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Track attendance</strong> - Monitor your workout sessions and progress</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Gym Owner Information */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Are You a Gym Owner?</h3>
              </div>

              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you own or manage a gym, you can list it on FitHub and reach more members!
                </p>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-foreground">Benefits for Gym Owners:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">List your gym with photos and details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Create and manage membership plans</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Track member attendance and payments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Grow your membership base</span>
                    </li>
                  </ul>
                </div>

                <p className="text-sm">
                  To apply as a gym owner, go to your dashboard and click "Apply as Gym Owner". 
                  Our team will review your application within 1-2 business days.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? 'Finishing...' : 'Get Started'}
                  <CheckCircle className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}