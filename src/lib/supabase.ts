import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface DailyChallengeRow {
  id: string;
  day: number;
  challenge_date: string;
  ticker_symbol: string;
  company_name: string;
  sector: string | null;
  start_year: number;
  end_year: number;
  start_date: string;
  end_date: string;
  trading_days: number;
  starting_cash: number;
  starting_shares: number;
  target_value: number;
  initial_stock_price: number;
  target_return_percentage: number;
  par_average_buy_price: number;
  par_total_shares_bought: number;
  par_profit_per_trade: number;
  par_final_value: number;
  par_cash_remaining: number;
  par_efficiency: number;
  price_data: any; // JSONB data
  created_at?: string;
}
