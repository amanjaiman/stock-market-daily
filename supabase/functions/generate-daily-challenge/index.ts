import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import our shared utilities
import { 
  calculateGameParameters, 
  calculateParPerformance,
  type GameParameters,
  type ParPerformance 
} from "../_shared/gameCalculations.ts";
import { 
  condenseStockData,
  type RawStockPrice
} from "../_shared/dataProcessing.ts";
import { fetchStockData } from "../_shared/stockDataFetcher.ts";
import { 
  generateRandomDateRange,
  getDailySeed,
  isValidDateRange,
  getRandomStockWithSeed,
  type DateRange,
  type StockSymbol 
} from "../_shared/utils.ts";

// Daily challenge interface for database
interface DailyChallengeData {
  day: number;
  challenge_date: string;
  ticker_symbol: string;
  company_name: string;
  sector: string | null;
  wiki_link?: string | null;
  stock_link?: string | null;
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
}

serve(async (req) => {
  // Get CORS headers for preflight requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if today's challenge already exists
    const today = new Date().toISOString().split('T')[0];
    const { data: existingChallenge } = await supabase
      .from('daily_challenges')
      .select('id, day')
      .eq('challenge_date', today)
      .single();

    if (existingChallenge) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Challenge already exists for today',
          day: existingChallenge.day,
          existingChallenge: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the next day number
    const { data: lastChallenge } = await supabase
      .from('daily_challenges')
      .select('day')
      .order('day', { ascending: false })
      .limit(1)
      .single();
    
    const nextDay = (lastChallenge?.day || 0) + 1;

    // Get all available stocks
    const { data: allStocks, error: stocksError } = await supabase
      .from('stocks')
      .select('*');

    if (stocksError || !allStocks || allStocks.length === 0) {
      throw new Error('No stocks found in database. Please run seed-stocks first.');
    }

    // 1. Pick random stock based on today's seed
    const seed = getDailySeed();
    const selectedStock = getRandomStockWithSeed(allStocks, seed);

    // 2. Generate random date range (deterministic based on seed)
    let dateRange: DateRange;
    let attempts = 0;
    const maxAttempts = 10;

    // Keep generating until we get a valid range or hit max attempts
    do {
      dateRange = generateRandomDateRange(seed + attempts);
      attempts++;
    } while (!isValidDateRange(dateRange) && attempts < maxAttempts);

    // If we still don't have a valid range, create a fallback
    if (!isValidDateRange(dateRange)) {
      const endDate = new Date(2023, 11, 31); // Dec 31, 2023
      const startDate = new Date(2021, 11, 31); // Dec 31, 2021

      dateRange = {
        startDate: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`,
        endDate: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`,
        days: 504, // Approximately 2 years of trading days
      };
    }

    // 3. Fetch real stock data
    const rawPrices: RawStockPrice[] = await fetchStockData(
      selectedStock.symbol, 
      dateRange.startDate, 
      dateRange.endDate
    );

    // 4. Condense data to 300 points
    const condensedData = condenseStockData(rawPrices);

    // 5. Calculate game parameters
    const gameParams: GameParameters = calculateGameParameters(condensedData);

    // 6. Calculate par performance
    const parPerformance: ParPerformance = calculateParPerformance(condensedData, gameParams);

    // 7. Prepare challenge data for database
    const challengeData: DailyChallengeData = {
      day: nextDay,
      challenge_date: today,
      ticker_symbol: selectedStock.symbol,
      company_name: selectedStock.name,
      sector: selectedStock.sector || null,
      wiki_link: (selectedStock as any).wiki_link || null,
      stock_link: (selectedStock as any).stock_link || null,
      start_year: new Date(dateRange.startDate).getFullYear(),
      end_year: new Date(dateRange.endDate).getFullYear(),
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
      trading_days: dateRange.days,
      starting_cash: gameParams.startingCash,
      starting_shares: gameParams.startingShares,
      target_value: gameParams.targetValue,
      initial_stock_price: Number(gameParams.initialStockPrice.toFixed(2)),
      target_return_percentage: Number(gameParams.targetReturnPercentage.toFixed(2)),
      par_average_buy_price: Number(parPerformance.parAverageBuyPrice.toFixed(2)),
      par_total_shares_bought: parPerformance.parTotalSharesBought,
      par_profit_per_trade: Number(parPerformance.parProfitPerTrade.toFixed(2)),
      par_final_value: Number(parPerformance.parFinalValue.toFixed(2)),
      par_cash_remaining: Number(parPerformance.parCashRemaining.toFixed(2)),
      par_efficiency: Number(parPerformance.efficiency.toFixed(4)),
      price_data: condensedData
    };

    // 8. Store in database
    const { data: insertedChallenge, error: insertError } = await supabase
      .from('daily_challenges')
      .insert(challengeData)
      .select()
      .single();

    if (insertError) {
      console.error('Database insertion error:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully generated daily challenge for day ${nextDay}`,
        challenge: insertedChallenge,
        day: nextDay,
        stock: selectedStock.symbol,
        dateRange: `${dateRange.startDate} to ${dateRange.endDate}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error generating daily challenge:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
