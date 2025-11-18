# FitHub Database Setup

## Step 1: Run the Migration

In your Supabase project SQL editor, run the migration file:

`supabase/migrations/20240101000000_initial_schema.sql`

This will create:
- All database tables (profiles, user_roles, gym_owners, gyms, plans, memberships, payments, attendance)
- Row Level Security policies
- Database triggers for user creation
- Security definer functions

## Step 2: Create Your First Admin User

After running the migration:

1. Sign up through the app at `/auth`
2. Go to your Supabase dashboard → Authentication → Users
3. Copy your user ID
4. In the SQL Editor, run:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin');
```

Now you can access the admin panel!

## Step 3: Disable Email Confirmation (Optional - For Testing)

For faster testing:

1. Go to Supabase Dashboard → Authentication → Settings
2. Toggle OFF "Enable email confirmations"
3. Users can now log in immediately after signup

## Step 4: Set up Razorpay (Later)

For payment integration:
1. Get Razorpay API keys from razorpay.com
2. Store them as Supabase secrets
3. Create edge function for webhook handling

## Database Schema Overview

- **profiles**: User basic info
- **user_roles**: Role-based access (admin/owner/user)
- **gym_owners**: Gym owner applications and status
- **gyms**: Gym details and info
- **plans**: Membership plans per gym
- **memberships**: Active user memberships
- **payments**: Payment records
- **attendance**: Check-in history

All tables have RLS enabled for security!
