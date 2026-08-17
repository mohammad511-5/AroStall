import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: string;
  createdAt: string;
}
