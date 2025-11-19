import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type GymOwnerInsert = Database['public']['Tables']['gym_owners']['Insert'];

export const seedGymOwnerApplications = async () => {
  // Get some user IDs to assign as applicants (will use auth users or null)
  const { data: users } = await supabase.auth.admin.listUsers();
  const userIds = users?.users?.map(u => u.id) || [];

  const mockApplications: any[] = [
    {
      user_id: userIds[0] || null,
      status: 'pending',
      business_name: "Elite Fitness Centers LLC",
      business_address: "789 Business Park Drive, Tech City, TC 12345",
      business_phone: "+1-555-0123",
      business_email: "contact@elitefitness.com",
      years_in_business: 8,
      number_of_locations: 3,
      description: "We operate premium fitness facilities focusing on personalized training and wellness programs. Our centers feature state-of-the-art equipment, certified trainers, and holistic health services including nutrition counseling and spa facilities.",
      terms_accepted: true
    },
    {
      user_id: userIds[1] || null,
      status: 'pending',
      business_name: "FitZone Community Gyms",
      business_address: "456 Health Avenue, Wellness Town, WT 67890",
      business_phone: "+1-555-0456",
      business_email: "info@fitzonegyms.com",
      years_in_business: 5,
      number_of_locations: 2,
      description: "Community-focused fitness centers offering affordable memberships, group classes, and family-friendly facilities. We specialize in creating inclusive environments for all fitness levels with certified instructors and modern equipment.",
      terms_accepted: true
    },
    {
      user_id: userIds[2] || null,
      status: 'approved',
      business_name: "Iron Works Strength Studio",
      business_address: "321 Power Street, Muscle City, MC 11111",
      business_phone: "+1-555-0789",
      business_email: "hello@ironworksstudio.com",
      years_in_business: 12,
      number_of_locations: 5,
      description: "Established strength and conditioning facility with a focus on powerlifting, bodybuilding, and athletic performance. Our experienced coaches provide personalized programs and we host regional competitions regularly.",
      terms_accepted: true
    }
  ];

  const { data, error } = await supabase
    .from('gym_owners')
    .insert(mockApplications as any)
    .select();

  if (error) {
    console.error('Error seeding gym owner applications:', error);
    return { success: false, error };
  }

  console.log('Successfully seeded gym owner applications:', data);
  return { success: true, data };
};
