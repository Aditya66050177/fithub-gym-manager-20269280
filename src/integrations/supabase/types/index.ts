export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'owner' | 'user'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'owner' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'owner' | 'user'
          created_at?: string
        }
      }
      gym_owners: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
      }
      gyms: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          photos: string[]
          location: string
          timings: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          photos?: string[]
          location: string
          timings: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          photos?: string[]
          location?: string
          timings?: string
          created_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          gym_id: string
          name: string
          duration_days: number
          price: number
          features: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          gym_id: string
          name: string
          duration_days: number
          price: number
          features?: string[]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          gym_id?: string
          name?: string
          duration_days?: number
          price?: number
          features?: string[]
          is_active?: boolean
          created_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          gym_id: string
          start_date: string
          end_date: string
          payment_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          gym_id: string
          start_date: string
          end_date: string
          payment_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          gym_id?: string
          start_date?: string
          end_date?: string
          payment_id?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          gym_id: string
          amount: number
          status: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gym_id: string
          amount: number
          status: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gym_id?: string
          amount?: number
          status?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          user_id: string
          gym_id: string
          check_in_time: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gym_id: string
          check_in_time?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          gym_id?: string
          check_in_time?: string
          created_at?: string
        }
      }
    }
  }
}
