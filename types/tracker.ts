export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export interface Tracker {
  id: string;
  user_id: string;
  name: string;
  price: number;
  currency: string;
  cycle: BillingCycle;
  next_billing_date: string;
  notify_datetime?: string;
  url?: string;
  notes?: string;
  created_at: string;
}
