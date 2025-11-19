import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { seedMockGyms } from '@/utils/seedGyms';
import { seedGymOwnerApplications } from '@/utils/seedGymOwnerApplications';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SeedData = () => {
  const [isSeedingGyms, setIsSeedingGyms] = useState(false);
  const [isSeedingApplications, setIsSeedingApplications] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSeedGyms = async () => {
    setIsSeedingGyms(true);
    const result = await seedMockGyms();
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Mock gyms added successfully!",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to seed gyms. Check console for details.",
        variant: "destructive",
      });
    }
    setIsSeedingGyms(false);
  };

  const handleSeedApplications = async () => {
    setIsSeedingApplications(true);
    const result = await seedGymOwnerApplications();
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Mock gym owner applications added successfully!",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to seed applications. Check console for details.",
        variant: "destructive",
      });
    }
    setIsSeedingApplications(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Seed Mock Data</CardTitle>
            <CardDescription>
              Add test data to the database for development and testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Gyms</h3>
              <Button 
                onClick={handleSeedGyms} 
                disabled={isSeedingGyms}
                className="w-full"
              >
                {isSeedingGyms ? "Adding Gyms..." : "Add 2 Mock Gyms"}
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Gym Owner Applications</h3>
              <Button 
                onClick={handleSeedApplications} 
                disabled={isSeedingApplications}
                className="w-full"
                variant="secondary"
              >
                {isSeedingApplications ? "Adding Applications..." : "Add 3 Mock Applications"}
              </Button>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')}
              className="w-full"
            >
              Back to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SeedData;
