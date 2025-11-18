import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type GymInsert = Database['public']['Tables']['gyms']['Insert'];

export const seedMockGyms = async () => {
  const mockGyms: GymInsert[] = [
    {
      owner_id: null,
      name: "PowerFit Arena",
      description: "State-of-the-art facility with Olympic-grade equipment, personal training, and group fitness classes. Perfect for serious athletes and fitness enthusiasts.",
      location: "123 Fitness Street, Downtown",
      timings: "Monday-Saturday: 6:00 AM - 10:00 PM, Sunday: 8:00 AM - 8:00 PM",
      photos: ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"]
    },
    {
      owner_id: null,
      name: "Zen Wellness Studio",
      description: "A holistic fitness center focusing on yoga, pilates, meditation, and functional training in a peaceful environment.",
      location: "456 Wellness Avenue, Uptown",
      timings: "Monday-Sunday: 7:00 AM - 9:00 PM",
      photos: ["https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800"]
    }
  ];

  const { data, error } = await supabase
    .from('gyms')
    .insert(mockGyms as any)
    .select();

  if (error) {
    console.error('Error seeding gyms:', error);
    return { success: false, error };
  }

  console.log('Successfully seeded gyms:', data);
  return { success: true, data };
};
