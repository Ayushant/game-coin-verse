
// Define all shared types for the application

export type UserRole = 'user' | 'admin';

export type PaymentMethod = 'coins' | 'razorpay' | 'manual' | 'free';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export type WithdrawalStatus = 'pending' | 'completed' | 'failed';

export interface App {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  download_url: string;
  coin_price: number | null;
  inr_price: number | null;
  payment_method: PaymentMethod;
  payment_instructions: string | null;
  created_at: string;
  is_purchased?: boolean;
}

export interface Payment {
  id: string;
  user_id: string;
  app_id: string;
  payment_proof_url: string | null;
  user_note: string | null;
  payment_method: string;
  status: PaymentStatus;
  submitted_at: string;
  verified_at: string | null;
  verified_by: string | null;
  user_name: string;
  user_email: string;
  app_name: string;
}

export interface UserWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  coins_spent: number;
  method: string;
  payment_detail: string;
  status: WithdrawalStatus;
  requested_at: string;
  processed_at: string | null;
}

export interface UserPurchase {
  id: string;
  app_id: string;
  app_name: string;
  payment_type: string;
  created_at: string;
}

export interface UserData {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  coins: number;
  isGuest: boolean;
  role?: UserRole;
}
