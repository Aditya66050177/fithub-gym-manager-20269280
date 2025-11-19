import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Dumbbell, LogOut, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const applicationSchema = z.object({
  businessName: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be less than 100 characters')
    .trim(),
  businessAddress: z.string()
    .min(10, 'Please provide a complete address')
    .max(200, 'Address must be less than 200 characters')
    .trim(),
  businessPhone: z.string()
    .min(10, 'Please provide a valid phone number')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[0-9+\-() ]+$/, 'Please enter a valid phone number')
    .trim(),
  businessEmail: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim(),
  yearsInBusiness: z.coerce.number()
    .min(0, 'Years in business must be 0 or greater')
    .max(100, 'Please enter a valid number'),
  numberOfLocations: z.coerce.number()
    .min(1, 'Must have at least 1 location')
    .max(1000, 'Please enter a valid number'),
  description: z.string()
    .min(50, 'Please provide at least 50 characters describing your gym')
    .max(1000, 'Description must be less than 1000 characters')
    .trim(),
  termsAccepted: z.boolean()
    .refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function ApplyOwner() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      businessName: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      yearsInBusiness: 0,
      numberOfLocations: 1,
      description: '',
      termsAccepted: false,
    },
  });

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

  const onSubmit = async (data: ApplicationFormData) => {
    if (!user) return;

    const { error } = await (supabase
      .from('gym_owners')
      // @ts-expect-error Supabase type inference issue
      .insert([{
        user_id: user.id,
        status: 'pending',
        business_name: data.businessName,
        business_address: data.businessAddress,
        business_phone: data.businessPhone,
        business_email: data.businessEmail,
        years_in_business: data.yearsInBusiness,
        number_of_locations: data.numberOfLocations,
        description: data.description,
        terms_accepted: data.termsAccepted,
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
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., FitZone Gym" {...field} />
                          </FormControl>
                          <FormDescription>
                            The official name of your gym or fitness business
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="businessAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                          </FormControl>
                          <FormDescription>
                            Full physical address of your main location
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="businessPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Phone *</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="businessEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contact@fitzone.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="yearsInBusiness"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years in Business *</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="5" {...field} />
                            </FormControl>
                            <FormDescription>
                              How long have you been operating?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="numberOfLocations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Locations *</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" placeholder="1" {...field} />
                            </FormControl>
                            <FormDescription>
                              How many gym locations do you have?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gym Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your gym, facilities, equipment, classes, and what makes your gym unique..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum 50 characters. Describe your gym's features and what sets it apart.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="termsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I accept the terms and conditions *
                            </FormLabel>
                            <FormDescription>
                              I confirm that all information provided is accurate and I agree to FitHub's terms of service and owner policies. I understand that my application will be reviewed by an administrator.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <Alert>
                      <AlertDescription>
                        <strong>What happens next?</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                          <li>Your application will be reviewed by our admin team</li>
                          <li>We'll verify your business information</li>
                          <li>You'll receive a notification once approved</li>
                          <li>After approval, you can start listing your gyms</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </form>
                </Form>
              )}

              {applicationStatus === 'pending' && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    <strong>Application Pending</strong>
                    <p className="mt-2">
                      Your application is currently under review. You'll be notified once an admin reviews your application.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {applicationStatus === 'approved' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    <strong>Application Approved</strong>
                    <p className="mt-2">
                      Congratulations! Your application has been approved. You can now manage your gyms from the owner dashboard.
                    </p>
                    <Button onClick={() => navigate('/owner')} className="mt-4">
                      Go to Owner Dashboard
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {applicationStatus === 'rejected' && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    <strong>Application Rejected</strong>
                    <p className="mt-2">
                      Unfortunately, your application was not approved at this time. Please contact support for more information.
                    </p>
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
