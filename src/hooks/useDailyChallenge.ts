import { useState, useEffect, useCallback } from 'react';
import { supabase, type DailyChallengeRow } from '../lib/supabase';
import type { CondensedDataPoint } from './types';

export interface DailyChallenge {
  id: string;
  day: number;
  challengeDate: string;
  tickerSymbol: string;
  companyName: string;
  sector: string | null;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
  tradingDays: number;
  startingCash: number;
  startingShares: number;
  targetValue: number;
  initialStockPrice: number;
  targetReturnPercentage: number;
  parAverageBuyPrice: number;
  parTotalSharesBought: number;
  parProfitPerTrade: number;
  parFinalValue: number;
  parCashRemaining: number;
  parEfficiency: number;
  priceData: CondensedDataPoint[];
  createdAt?: string;
}

export interface UseDailyChallengeResult {
  challenge: DailyChallenge | null;
  isLoading: boolean;
  error: string | null;
  refreshChallenge: () => Promise<void>;
}

/**
 * Hook to fetch today's daily challenge from the backend
 */
export const useDailyChallenge = (): UseDailyChallengeResult => {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodaysChallenge = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const today = new Date().toISOString().split('T')[0];
      
      console.log('Fetching daily challenge for:', today);
      
      const { data, error: fetchError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', today)
        .single();

      if (fetchError) {
        // If no challenge exists for today, this is expected
        if (fetchError.code === 'PGRST116') {
          setError('No daily challenge available for today. Please check back later!');
        } else {
          console.error('Database error:', fetchError);
          setError(`Database error: ${fetchError.message}`);
        }
        setChallenge(null);
        return;
      }

      if (!data) {
        setError('No daily challenge found for today');
        setChallenge(null);
        return;
      }

      // Transform database row to our interface
      const transformedChallenge: DailyChallenge = {
        id: data.id,
        day: data.day,
        challengeDate: data.challenge_date,
        tickerSymbol: data.ticker_symbol,
        companyName: data.company_name,
        sector: data.sector,
        startYear: data.start_year,
        endYear: data.end_year,
        startDate: data.start_date,
        endDate: data.end_date,
        tradingDays: data.trading_days,
        startingCash: data.starting_cash,
        startingShares: data.starting_shares,
        targetValue: data.target_value,
        initialStockPrice: data.initial_stock_price,
        targetReturnPercentage: data.target_return_percentage,
        parAverageBuyPrice: data.par_average_buy_price,
        parTotalSharesBought: data.par_total_shares_bought,
        parProfitPerTrade: data.par_profit_per_trade,
        parFinalValue: data.par_final_value,
        parCashRemaining: data.par_cash_remaining,
        parEfficiency: data.par_efficiency,
        priceData: data.price_data as CondensedDataPoint[],
        createdAt: data.created_at,
      };

      console.log('Successfully loaded daily challenge:', {
        day: transformedChallenge.day,
        stock: transformedChallenge.tickerSymbol,
        company: transformedChallenge.companyName,
        priceDataPoints: transformedChallenge.priceData.length,
        startingCash: transformedChallenge.startingCash,
        targetValue: transformedChallenge.targetValue,
      });

      setChallenge(transformedChallenge);
      
    } catch (err) {
      console.error('Error fetching daily challenge:', err);
      setError(err instanceof Error ? err.message : 'Failed to load daily challenge');
      setChallenge(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load challenge on mount
  useEffect(() => {
    fetchTodaysChallenge();
  }, [fetchTodaysChallenge]);

  const refreshChallenge = useCallback(async () => {
    await fetchTodaysChallenge();
  }, [fetchTodaysChallenge]);

  return {
    challenge,
    isLoading,
    error,
    refreshChallenge,
  };
};

/**
 * Hook to get a specific challenge by day number (for historical challenges)
 */
export const useChallengeByDay = (day: number): UseDailyChallengeResult => {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChallengeByDay = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('day', day)
        .single();

      if (fetchError) {
        console.error('Database error:', fetchError);
        setError(`Challenge not found for day ${day}`);
        setChallenge(null);
        return;
      }

      if (!data) {
        setError(`No challenge found for day ${day}`);
        setChallenge(null);
        return;
      }

      // Transform database row to our interface
      const transformedChallenge: DailyChallenge = {
        id: data.id,
        day: data.day,
        challengeDate: data.challenge_date,
        tickerSymbol: data.ticker_symbol,
        companyName: data.company_name,
        sector: data.sector,
        startYear: data.start_year,
        endYear: data.end_year,
        startDate: data.start_date,
        endDate: data.end_date,
        tradingDays: data.trading_days,
        startingCash: data.starting_cash,
        startingShares: data.starting_shares,
        targetValue: data.target_value,
        initialStockPrice: data.initial_stock_price,
        targetReturnPercentage: data.target_return_percentage,
        parAverageBuyPrice: data.par_average_buy_price,
        parTotalSharesBought: data.par_total_shares_bought,
        parProfitPerTrade: data.par_profit_per_trade,
        parFinalValue: data.par_final_value,
        parCashRemaining: data.par_cash_remaining,
        parEfficiency: data.par_efficiency,
        priceData: data.price_data as CondensedDataPoint[],
        createdAt: data.created_at,
      };

      setChallenge(transformedChallenge);
      
    } catch (err) {
      console.error('Error fetching challenge by day:', err);
      setError(err instanceof Error ? err.message : 'Failed to load challenge');
      setChallenge(null);
    } finally {
      setIsLoading(false);
    }
  }, [day]);

  // Load challenge on mount or when day changes
  useEffect(() => {
    fetchChallengeByDay();
  }, [fetchChallengeByDay]);

  const refreshChallenge = useCallback(async () => {
    await fetchChallengeByDay();
  }, [fetchChallengeByDay]);

  return {
    challenge,
    isLoading,
    error,
    refreshChallenge,
  };
};
