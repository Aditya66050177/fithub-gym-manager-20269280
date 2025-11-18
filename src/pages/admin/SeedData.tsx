import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { seedMockGyms } from '@/utils/seedGyms';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SeedData = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSeed = async () => {
    setIsSeeding(true);
    const result = await seedMockGyms();
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Mock gyms added successfully!",
      });
      setTimeout(() => navigate('/admin'), 1500);
    } else {
      toast({
        title: "Error",
        description: "Failed to seed gyms. Check console for details.",
        variant: "destructive",
      });
    }
    setIsSeeding(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Seed Mock Data</CardTitle>
            <CardDescription>
              Add 2 mock gyms to the database for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSeed} 
              disabled={isSeeding}
              className="w-full"
            >
              {isSeeding ? "Adding Gyms..." : "Add 2 Mock Gyms"}
            </Button>
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
