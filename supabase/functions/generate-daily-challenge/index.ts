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

    const seed = getDailySeed();
    const maxTotalAttempts = 50; // Try up to 50 different stock/date combinations
    let totalAttempts = 0;
    let selectedStock!: any;
    let dateRange!: DateRange;
    let condensedData!: any;
    let gameParams!: GameParameters;
    let parPerformance!: ParPerformance;
    let validChallengeFound = false;

    // Keep trying different stocks and date ranges until we find a viable challenge
    while (!validChallengeFound && totalAttempts < maxTotalAttempts) {
      // 1. Pick stock based on seed + attempt number
      selectedStock = getRandomStockWithSeed(allStocks, seed + totalAttempts);
      console.log(`Attempt ${totalAttempts + 1}: Trying stock ${selectedStock.symbol}`);

      // 2. Try multiple date ranges for this stock
      let dateRangeAttempts = 0;
      const maxDateRangeAttempts = 5;
      
      while (dateRangeAttempts < maxDateRangeAttempts && !validChallengeFound) {
        // Generate random date range
        const dateRangeSeed = seed + totalAttempts * 100 + dateRangeAttempts;
        dateRange = generateRandomDateRange(dateRangeSeed);
        
        // Validate date range
        if (!isValidDateRange(dateRange)) {
          console.log(`  Date range attempt ${dateRangeAttempts + 1}: Invalid date range, trying next`);
          dateRangeAttempts++;
          totalAttempts++;
          continue;
        }

        console.log(`  Date range attempt ${dateRangeAttempts + 1}: ${dateRange.startDate} to ${dateRange.endDate}`);

        try {
          // 3. Fetch real stock data
          const rawPrices: RawStockPrice[] = await fetchStockData(
            selectedStock.symbol, 
            dateRange.startDate, 
            dateRange.endDate
          );

          // 4. Condense data to 300 points
          condensedData = condenseStockData(rawPrices);

          // 5. Calculate game parameters
          gameParams = calculateGameParameters(condensedData);

          // 6. Validate that target value is greater than starting cash
          // This ensures the challenge is winnable and makes financial sense
          if (gameParams.targetValue <= gameParams.startingCash) {
            console.log(`  ❌ Target value ($${gameParams.targetValue}) <= Starting cash ($${gameParams.startingCash}). Rejecting.`);
            dateRangeAttempts++;
            totalAttempts++;
            continue;
          }

          // Additional validation: ensure target return is at least 5%
          if (gameParams.targetReturnPercentage < 5) {
            console.log(`  ❌ Target return too low (${gameParams.targetReturnPercentage}%). Rejecting.`);
            dateRangeAttempts++;
            totalAttempts++;
            continue;
          }

          // 7. Calculate par performance
          parPerformance = calculateParPerformance(condensedData, gameParams);

          // If we made it here, we have a valid challenge!
          console.log(`  ✅ Valid challenge found! Target: $${gameParams.targetValue}, Return: ${gameParams.targetReturnPercentage}%`);
          validChallengeFound = true;

        } catch (error) {
          console.log(`  Error fetching/processing data: ${error.message}`);
          dateRangeAttempts++;
          totalAttempts++;
          continue;
        }
      }

      // If we exhausted date ranges for this stock, move to next stock
      if (!validChallengeFound) {
        totalAttempts++;
      }
    }

    // If we couldn't find a valid challenge after all attempts, throw error
    if (!validChallengeFound) {
      throw new Error(`Could not generate a valid challenge after ${totalAttempts} attempts. All stock/date combinations resulted in negative or minimal returns.`);
    }

    // 8. Prepare challenge data for database
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

    // 9. Store in database
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
        dateRange: `${dateRange.startDate} to ${dateRange.endDate}`,
        attemptsRequired: totalAttempts + 1,
        targetValue: gameParams.targetValue,
        startingCash: gameParams.startingCash,
        targetReturnPercentage: gameParams.targetReturnPercentage
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
