import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import our shared utilities
import { type CondensedDataPoint } from "../_shared/dataProcessing.ts";

// Bot name components for generating realistic, diverse names
const FIRST_NAMES = [
  "Alex", "Jordan", "Morgan", "Casey", "Taylor", "Riley", "Jamie", "Dakota",
  "Avery", "Quinn", "Blake", "Cameron", "Skyler", "Reese", "Peyton", "Parker",
  "Drew", "Kai", "River", "Sage", "Charlie", "Sam", "Phoenix", "Rory", "Emerson",
  "Finley", "Hayden", "Logan", "Bailey", "Rowan", "Elliott", "Spencer", "Kendall",
  "Addison", "Aubrey", "Reagan", "Harper", "Sawyer", "Tanner", "Devon", "Max",
  "Madison", "Dylan", "Kennedy", "Tatum", "Justice", "Marlowe", "Landry", "Shiloh",
  "Sutton", "Bellamy", "Ridley", "Ellis", "Hollis", "Jules", "Lennon", "Mercer",
  "Monroe", "Oakley", "Palmer", "Presley", "Quincy", "Reilly", "Sasha", "Shay",
  "Sloan", "Sterling", "Tate", "Teagan", "Wren", "Arden", "Aspen", "Blair",
  "Brooke", "Campbell", "Carter", "Chase", "Colby", "Dani", "Eden", "Greer",
  "Marcus", "Nina", "Leo", "Zara", "Ethan", "Mia", "Lucas", "Emma", "Oliver",
  "Sophia", "Noah", "Ava", "Liam", "Isabella", "Mason", "Charlotte", "James",
  "Amelia", "Benjamin", "Harper", "Lucas", "Evelyn", "Henry", "Abigail", "Jack",
  "Emily", "Sebastian", "Elizabeth", "Michael", "Sofia", "Daniel", "Avery", "Matthew",
  "Ella", "David", "Scarlett", "Joseph", "Grace", "Samuel", "Chloe", "Ryan",
  "Victoria", "Nathan", "Riley", "Isaac", "Aria", "Gabriel", "Lily", "Anthony",
  "Aubrey", "Dylan", "Zoey", "Andrew", "Penelope", "Josiah", "Lillian", "Christopher",
  "Nora", "Joshua", "Hannah", "Caleb", "Mila", "Owen", "Lucy"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Martinez", "Lee", "Chen", "Patel", "Kumar", "Wong", "Singh", "Kim", "Nguyen",
  "Cohen", "Lopez", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Jackson",
  "Martin", "Thompson", "White", "Harris", "Clark", "Lewis", "Walker", "Hall",
  "Allen", "Young", "King", "Wright", "Scott", "Green", "Baker", "Adams",
  "Nelson", "Carter", "Mitchell", "Roberts", "Turner", "Phillips", "Campbell",
  "Parker", "Evans", "Edwards", "Collins", "Stewart", "Morris", "Rogers", "Reed",
  "Cook", "Morgan", "Bell", "Murphy", "Bailey", "Rivera", "Cooper", "Richardson",
  "Cox", "Howard", "Ward", "Torres", "Peterson", "Gray", "Ramirez", "James",
  "Watson", "Brooks", "Kelly", "Sanders", "Price", "Bennett", "Wood", "Barnes",
  "Ross", "Henderson", "Coleman", "Jenkins", "Perry", "Powell", "Long", "Patterson",
  "Hughes", "Flores", "Washington", "Butler", "Simmons", "Foster", "Gonzales", "Bryant",
  "Alexander", "Russell", "Griffin", "Diaz", "Hayes", "Myers", "Ford", "Hamilton",
  "Graham", "Sullivan", "Wallace", "Woods", "Cole", "West", "Jordan", "Owens",
  "Reynolds", "Fisher", "Ellis", "Harrison", "Gibson", "McDonald", "Cruz", "Marshall",
  "Ortiz", "Gomez", "Murray", "Freeman", "Wells", "Webb", "Simpson", "Stevens",
  "Tucker", "Porter", "Hunter", "Hicks", "Crawford", "Henry", "Boyd", "Mason",
  "Morales", "Kennedy", "Warren", "Dixon", "Ramos", "Reyes", "Burns", "Gordon",
  "Shaw", "Holmes", "Rice", "Robertson", "Hunt", "Black", "Daniels", "Palmer"
];

// Common username words people actually use
const USERNAME_WORDS = [
  "shadow", "dark", "silent", "thunder", "lightning", "fire", "ice", "storm",
  "night", "moon", "star", "sun", "sky", "cloud", "rain", "snow",
  "wolf", "lion", "tiger", "bear", "fox", "eagle", "hawk", "dragon",
  "ninja", "warrior", "knight", "ghost", "phantom", "cyber", "cosmic", "mystic",
  "pixel", "neon", "retro", "cool", "epic", "mega", "ultra", "super",
  "legend", "hero", "ace", "pro", "master", "chief", "king", "queen",
  "blue", "red", "green", "gold", "silver", "crimson", "azure", "violet",
  "lucky", "happy", "wild", "crazy", "chill", "zen", "fierce", "swift"
];

const GAMING_WORDS = [
  "gamer", "player", "noob", "veteran", "legend", "champion", "winner", "beast",
  "killer", "sniper", "tank", "warrior", "mage", "ranger", "rogue", "hunter",
  "slayer", "crusher", "destroyer", "warlord", "overlord", "supreme", "elite", "alpha"
];

const CASUAL_NAMES = [
  "mike", "sarah", "john", "lisa", "dave", "emma", "tom", "kate",
  "brian", "anna", "chris", "julia", "matt", "amy", "rob", "jen",
  "steve", "laura", "paul", "maria", "dan", "nina", "mark", "sophie",
  "eric", "grace", "ryan", "olivia", "kevin", "hannah", "jake", "zoe",
  "brad", "claire", "adam", "lily", "ben", "rose", "sean", "maya",
  "nick", "isla", "luke", "ella", "kyle", "ruby", "tyler", "ivy",
  "connor", "iris", "shane", "jade", "derek", "dawn", "brett", "autumn",
  "travis", "summer", "blake", "winter", "reed", "misty", "quinn", "rain",
  "parker", "sky", "hunter", "sierra", "chase", "sage", "cooper", "willow",
  "alex", "jordan", "casey", "riley", "drew", "max", "sam", "jay",
  "vic", "pat", "ash", "corey", "morgan", "quinn", "avery", "reese"
];

const RANDOM_NOUNS = [
  "potato", "banana", "pickle", "waffle", "taco", "burrito", "pizza", "cookie",
  "panda", "koala", "penguin", "octopus", "narwhal", "unicorn", "llama", "dino",
  "wizard", "robot", "pirate", "zombie", "alien", "astronaut", "samurai", "viking"
];

const ADJECTIVES = [
  "cool", "epic", "mega", "super", "hyper", "turbo", "ultra", "max",
  "mini", "tiny", "big", "giant", "quick", "fast", "slow", "lazy",
  "happy", "sad", "angry", "calm", "wild", "tame", "hot", "cold",
  "smart", "clever", "wise", "silly", "goofy", "random", "weird", "odd"
];

// Generate a realistic display name that looks like actual internet usernames
function generateDisplayName(random: SeededRandom): string {
  const nameType = random.next();
  
  // 4% chance: Full name (FirstName LastName)
  if (nameType < 0.04) {
    const firstName = FIRST_NAMES[random.nextInt(0, FIRST_NAMES.length - 1)];
    const lastName = LAST_NAMES[random.nextInt(0, LAST_NAMES.length - 1)];
    return `${firstName} ${lastName}`;
  }
  
  // 3% chance: First name + Last initial (Sarah M.)
  else if (nameType < 0.07) {
    const firstName = FIRST_NAMES[random.nextInt(0, FIRST_NAMES.length - 1)];
    const lastInitial = LAST_NAMES[random.nextInt(0, LAST_NAMES.length - 1)][0];
    return `${firstName} ${lastInitial}.`;
  }
  
  // 28% chance: Casual name variations (mike23, sarah_k, brianpa, etc)
  else if (nameType < 0.35) {
    const base = CASUAL_NAMES[random.nextInt(0, CASUAL_NAMES.length - 1)];
    const format = random.next();
    if (format < 0.30) {
      // Just numbers (mike23)
      const num = random.nextInt(1, 99);
      return `${base}${num}`;
    } else if (format < 0.35) {
      // With underscore + letter (sarah_k) - rare
      const letter = String.fromCharCode(97 + random.nextInt(0, 25));
      return `${base}_${letter}`;
    } else if (format < 0.60) {
      // Add "pa" or similar (brianpa)
      const suffixes = ["pa", "la", "ma", "da", "ra", "ka", "ta", "na", "sa", "wa"];
      const suffix = suffixes[random.nextInt(0, suffixes.length - 1)];
      return `${base}${suffix}`;
    } else if (format < 0.85) {
      // Year-style (mike94, sarah07, mike85, sarah01)
      const yearFull = random.nextInt(85, 109); // 1985-2009
      const yearStr = yearFull < 100 ? `${yearFull}` : `0${yearFull - 100}`;
      return `${base}${yearStr}`;
    } else {
      // Just the name
      return base;
    }
  }
  
  // 15% chance: Two word combos (shadowwolf, happypanda, epicgamer)
  else if (nameType < 0.50) {
    const word1 = USERNAME_WORDS[random.nextInt(0, USERNAME_WORDS.length - 1)];
    const word2 = USERNAME_WORDS[random.nextInt(0, USERNAME_WORDS.length - 1)];
    const separator = random.next();
    if (separator < 0.75) {
      // No separator (most common)
      return `${word1}${word2}`;
    } else if (separator < 0.85) {
      // With numbers
      const num = random.nextInt(1, 99);
      return `${word1}${word2}${num}`;
    } else {
      // With underscore (rare)
      return `${word1}_${word2}`;
    }
  }
  
  // 12% chance: Adjective + Noun combos (happypanda, lazypotato)
  else if (nameType < 0.62) {
    const adj = ADJECTIVES[random.nextInt(0, ADJECTIVES.length - 1)];
    const noun = RANDOM_NOUNS[random.nextInt(0, RANDOM_NOUNS.length - 1)];
    const comboStyle = random.next();
    if (comboStyle < 0.70) {
      // No separator (most common)
      return `${adj}${noun}`;
    } else if (comboStyle < 0.85) {
      // With numbers
      const num = random.nextInt(1, 999);
      return `${adj}${noun}${num}`;
    } else {
      // With underscore (rare)
      return `${adj}_${noun}`;
    }
  }
  
  // 8% chance: Gaming usernames (xXNinjaXx, Pro_Gamer420, etc)
  else if (nameType < 0.70) {
    const word = GAMING_WORDS[random.nextInt(0, GAMING_WORDS.length - 1)];
    const style = random.next();
    if (style < 0.35) {
      // xX style
      return `xX${word}Xx`;
    } else if (style < 0.70) {
      // With numbers
      const num = random.nextInt(1, 999);
      return `${word}${num}`;
    } else if (style < 0.90) {
      // Pro/The prefix
      const prefix = random.next() < 0.5 ? "Pro" : "The";
      return `${prefix}${word}`;
    } else {
      // Two words no separator
      const word2 = GAMING_WORDS[random.nextInt(0, GAMING_WORDS.length - 1)];
      return `${word}${word2}`;
    }
  }
  
  // 7% chance: Name + word combos (sarahgamer, mikethebest, etc)
  else if (nameType < 0.77) {
    const name = CASUAL_NAMES[random.nextInt(0, CASUAL_NAMES.length - 1)];
    const word = USERNAME_WORDS[random.nextInt(0, USERNAME_WORDS.length - 1)];
    if (random.next() < 0.85) {
      // No separator (most common)
      return `${name}${word}`;
    } else {
      // With underscore (rare)
      return `${name}_${word}`;
    }
  }
  
  // 23% chance: Random single word with numbers
  else {
    const allWords = [...USERNAME_WORDS, ...RANDOM_NOUNS, ...GAMING_WORDS];
    const word = allWords[random.nextInt(0, allWords.length - 1)];
    if (random.next() < 0.35) {
      return word;
    } else {
      const num = random.nextInt(1, 9999);
      return `${word}${num}`;
    }
  }
}

// Seeded random number generator for reproducibility
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Generate a random number between 0 and 1
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Generate a random integer between min (inclusive) and max (inclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Box-Muller transform for normal distribution
  nextGaussian(mean: number = 0, stdDev: number = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
}

interface TradingStrategy {
  name: string;
  simulate: (
    priceData: CondensedDataPoint[],
    startingCash: number,
    random: SeededRandom
  ) => TradingResult;
}

interface TradingResult {
  finalValue: number;
  avgBuyPrice: number;
  totalSharesBought: number;
  numTrades: number;
}

// Strategy 1: Buy and Hold
const buyAndHoldStrategy: TradingStrategy = {
  name: "Buy and Hold",
  simulate: (priceData, startingCash, random) => {
    const initialPrice = priceData[0].price;
    const finalPrice = priceData[priceData.length - 1].price;
    
    // Buy at the start with most of cash (90-100%)
    const investmentRatio = 0.9 + random.next() * 0.1;
    const sharesToBuy = Math.floor((startingCash * investmentRatio) / initialPrice);
    const cashSpent = sharesToBuy * initialPrice;
    const cashRemaining = startingCash - cashSpent;
    
    const finalValue = sharesToBuy * finalPrice + cashRemaining;
    
    return {
      finalValue,
      avgBuyPrice: initialPrice,
      totalSharesBought: sharesToBuy,
      numTrades: 1,
    };
  },
};

// Strategy 2: Momentum Trading (varying aggressiveness)
const momentumTradingStrategy = (aggressiveness: number): TradingStrategy => ({
  name: `Momentum (${aggressiveness.toFixed(1)}x)`,
  simulate: (priceData, startingCash, random) => {
    let cash = startingCash;
    let shares = 0;
    let totalSharesBought = 0;
    let totalCostBasis = 0;
    let numTrades = 0;
    
    const prices = priceData.map(d => d.price);
    let consecutiveRising = 0;
    let consecutiveFalling = 0;
    
    const buyThreshold = Math.max(1, Math.floor(3 - aggressiveness));
    const sellThreshold = Math.max(1, Math.floor(3 - aggressiveness));
    const cashPerTrade = 0.2 + (aggressiveness * 0.15);
    
    for (let i = 3; i < priceData.length - 1; i++) {
      const currentPrice = prices[i];
      const previousPrice = prices[i - 1];
      const prevPrevPrice = prices[i - 2];
      
      if (currentPrice > previousPrice && previousPrice > prevPrevPrice) {
        consecutiveRising++;
        consecutiveFalling = 0;
      } else if (currentPrice < previousPrice && previousPrice < prevPrevPrice) {
        consecutiveFalling++;
        consecutiveRising = 0;
      } else {
        consecutiveRising = 0;
        consecutiveFalling = 0;
      }
      
      // Buy signal
      if (consecutiveRising >= buyThreshold && cash > startingCash * cashPerTrade) {
        const amountToInvest = cash * cashPerTrade;
        const sharesToBuy = Math.floor(amountToInvest / currentPrice);
        
        if (sharesToBuy > 0) {
          const cost = sharesToBuy * currentPrice;
          cash -= cost;
          shares += sharesToBuy;
          totalSharesBought += sharesToBuy;
          totalCostBasis += cost;
          numTrades++;
        }
      }
      
      // Sell signal
      else if (shares > 0 && consecutiveFalling >= sellThreshold) {
        const sharesToSell = Math.floor(shares * (0.3 + aggressiveness * 0.2));
        
        if (sharesToSell > 0) {
          const revenue = sharesToSell * currentPrice;
          cash += revenue;
          shares -= sharesToSell;
          numTrades++;
        }
      }
    }
    
    // Sell remaining shares at final price
    const finalPrice = prices[prices.length - 1];
    if (shares > 0) {
      cash += shares * finalPrice;
      shares = 0;
    }
    
    const avgBuyPrice = totalSharesBought > 0 ? totalCostBasis / totalSharesBought : prices[0];
    
    return {
      finalValue: cash,
      avgBuyPrice,
      totalSharesBought,
      numTrades,
    };
  },
});

// Strategy 3: Dollar Cost Averaging
const dcaStrategy: TradingStrategy = {
  name: "DCA",
  simulate: (priceData, startingCash, random) => {
    let cash = startingCash;
    let shares = 0;
    let totalSharesBought = 0;
    let totalCostBasis = 0;
    
    const prices = priceData.map(d => d.price);
    const finalPrice = prices[prices.length - 1];
    
    // Buy at regular intervals (every 20-40 points)
    const interval = random.nextInt(20, 40);
    const numBuys = Math.floor(prices.length / interval);
    const amountPerBuy = startingCash / (numBuys + 1); // Save some cash
    
    for (let i = interval; i < prices.length; i += interval) {
      if (cash >= amountPerBuy) {
        const sharesToBuy = Math.floor(amountPerBuy / prices[i]);
        if (sharesToBuy > 0) {
          const cost = sharesToBuy * prices[i];
          cash -= cost;
          shares += sharesToBuy;
          totalSharesBought += sharesToBuy;
          totalCostBasis += cost;
        }
      }
    }
    
    // Sell all at the end
    const finalValue = shares * finalPrice + cash;
    const avgBuyPrice = totalSharesBought > 0 ? totalCostBasis / totalSharesBought : prices[0];
    
    return {
      finalValue,
      avgBuyPrice,
      totalSharesBought,
      numTrades: numBuys,
    };
  },
};

// Strategy 4: Mean Reversion
const meanReversionStrategy: TradingStrategy = {
  name: "Mean Reversion",
  simulate: (priceData, startingCash, random) => {
    let cash = startingCash;
    let shares = 0;
    let totalSharesBought = 0;
    let totalCostBasis = 0;
    let numTrades = 0;
    
    const prices = priceData.map(d => d.price);
    const windowSize = 20;
    
    for (let i = windowSize; i < priceData.length - 1; i++) {
      const currentPrice = prices[i];
      const recentPrices = prices.slice(i - windowSize, i);
      const mean = recentPrices.reduce((sum, p) => sum + p, 0) / windowSize;
      const deviation = (currentPrice - mean) / mean;
      
      // Buy when price is below mean
      if (deviation < -0.03 && cash > startingCash * 0.3) {
        const amountToInvest = cash * 0.3;
        const sharesToBuy = Math.floor(amountToInvest / currentPrice);
        
        if (sharesToBuy > 0) {
          const cost = sharesToBuy * currentPrice;
          cash -= cost;
          shares += sharesToBuy;
          totalSharesBought += sharesToBuy;
          totalCostBasis += cost;
          numTrades++;
        }
      }
      
      // Sell when price is above mean
      else if (shares > 0 && deviation > 0.03) {
        const sharesToSell = Math.floor(shares * 0.4);
        
        if (sharesToSell > 0) {
          const revenue = sharesToSell * currentPrice;
          cash += revenue;
          shares -= sharesToSell;
          numTrades++;
        }
      }
    }
    
    // Sell remaining shares at final price
    const finalPrice = prices[prices.length - 1];
    if (shares > 0) {
      cash += shares * finalPrice;
    }
    
    const avgBuyPrice = totalSharesBought > 0 ? totalCostBasis / totalSharesBought : prices[0];
    
    return {
      finalValue: cash,
      avgBuyPrice,
      totalSharesBought,
      numTrades,
    };
  },
};

// Strategy 5: Random/Amateur Trading
const randomTradingStrategy: TradingStrategy = {
  name: "Random",
  simulate: (priceData, startingCash, random) => {
    let cash = startingCash;
    let shares = 0;
    let totalSharesBought = 0;
    let totalCostBasis = 0;
    let numTrades = 0;
    
    const prices = priceData.map(d => d.price);
    
    // Make 3-8 random trades
    const numRandomTrades = random.nextInt(3, 8);
    
    for (let trade = 0; trade < numRandomTrades; trade++) {
      const randomIndex = random.nextInt(10, prices.length - 10);
      const currentPrice = prices[randomIndex];
      
      // Randomly decide to buy or sell
      if (random.next() > 0.5 && cash > startingCash * 0.2) {
        // Buy
        const amountToInvest = cash * (0.2 + random.next() * 0.3);
        const sharesToBuy = Math.floor(amountToInvest / currentPrice);
        
        if (sharesToBuy > 0) {
          const cost = sharesToBuy * currentPrice;
          cash -= cost;
          shares += sharesToBuy;
          totalSharesBought += sharesToBuy;
          totalCostBasis += cost;
          numTrades++;
        }
      } else if (shares > 0) {
        // Sell
        const sharesToSell = Math.floor(shares * (0.3 + random.next() * 0.4));
        
        if (sharesToSell > 0) {
          const revenue = sharesToSell * currentPrice;
          cash += revenue;
          shares -= sharesToSell;
          numTrades++;
        }
      }
    }
    
    // Sell remaining shares at final price
    const finalPrice = prices[prices.length - 1];
    if (shares > 0) {
      cash += shares * finalPrice;
    }
    
    const avgBuyPrice = totalSharesBought > 0 ? totalCostBasis / totalSharesBought : prices[0];
    
    return {
      finalValue: cash,
      avgBuyPrice,
      totalSharesBought,
      numTrades,
    };
  },
};

// Generate a bot entry
function generateBotEntry(
  botIndex: number,
  dayNumber: number,
  challenge: any,
  random: SeededRandom
): any {
  const priceData = challenge.price_data as CondensedDataPoint[];
  const startingCash = challenge.starting_cash;
  const parFinalValue = challenge.par_final_value;
  
  // Select a strategy based on weighted probabilities
  const strategyRoll = random.next();
  let strategy: TradingStrategy;
  
  if (strategyRoll < 0.15) {
    strategy = buyAndHoldStrategy;
  } else if (strategyRoll < 0.5) {
    // Momentum with varying aggressiveness (most common)
    const aggressiveness = random.nextGaussian(0.5, 0.3);
    strategy = momentumTradingStrategy(Math.max(0, Math.min(1, aggressiveness)));
  } else if (strategyRoll < 0.65) {
    strategy = dcaStrategy;
  } else if (strategyRoll < 0.8) {
    strategy = meanReversionStrategy;
  } else {
    strategy = randomTradingStrategy;
  }
  
  // Simulate the trading
  const result = strategy.simulate(priceData, startingCash, random);
  
  // Apply a performance modifier based on normal distribution
  // Mean: 0.85 (most bots perform at 85% of par), StdDev: 0.25
  const performanceMultiplier = Math.max(0.3, Math.min(1.5, random.nextGaussian(0.85, 0.25)));
  
  // Calculate final value relative to par
  const potentialGain = result.finalValue - startingCash;
  const adjustedGain = potentialGain * performanceMultiplier;
  const finalValue = Math.max(startingCash * 0.5, startingCash + adjustedGain);
  
  // Calculate metrics
  const percentageChange = ((finalValue - startingCash) / startingCash) * 100;
  const ppt = result.totalSharesBought > 0 
    ? (finalValue - startingCash) / result.totalSharesBought 
    : 0;
  
  // Generate a realistic name
  const name = generateDisplayName(random);
  
  // Number of tries (1-4, weighted toward 1-2)
  const triesRoll = random.next();
  let numTries: number;
  if (triesRoll < 0.6) {
    numTries = 1;
  } else if (triesRoll < 0.85) {
    numTries = 2;
  } else if (triesRoll < 0.95) {
    numTries = 3;
  } else {
    numTries = 4;
  }
  
  return {
    day: dayNumber,
    name,
    final_value: Number(finalValue.toFixed(2)),
    percentage_change_of_value: Number(percentageChange.toFixed(2)),
    avg_buy: Number(result.avgBuyPrice.toFixed(2)),
    ppt: Number(ppt.toFixed(2)),
    num_tries: numTries,
  };
}

serve(async (req) => {
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

    // Get today's challenge
    const today = new Date().toISOString().split('T')[0];
    const { data: challenge, error: challengeError } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', today)
      .single();

    if (challengeError || !challenge) {
      throw new Error('No challenge found for today. Please run generate-daily-challenge first.');
    }

    // Check if bots already exist for today
    const { data: existingBots, error: checkError } = await supabase
      .from('leaderboard')
      .select('id')
      .eq('day', challenge.day)
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (existingBots && existingBots.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Bots already exist for today',
          day: challenge.day,
          existingBots: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 100 bot entries
    const botEntries = [];
    const seed = challenge.day * 12345; // Use day as seed for reproducibility
    const random = new SeededRandom(seed);

    for (let i = 0; i < 100; i++) {
      const botEntry = generateBotEntry(i, challenge.day, challenge, random);
      botEntries.push(botEntry);
    }

    // Ensure a minimum number of bots beat the target
    const minWinners = random.nextInt(3, 10);
    const targetValue = challenge.target_value;
    const winnersCount = botEntries.filter(bot => bot.final_value >= targetValue).length;
    
    if (winnersCount < minWinners) {
      // Need to boost some bots to reach the target
      const botsNeeded = minWinners - winnersCount;
      
      // Get bots that are below target, sorted by how close they are (closest first)
      const losers = botEntries
        .filter(bot => bot.final_value < targetValue)
        .sort((a, b) => b.final_value - a.final_value); // Highest to lowest
      
      // Boost the top performers who didn't quite make it
      for (let i = 0; i < Math.min(botsNeeded, losers.length); i++) {
        const bot = losers[i];
        const startingCash = challenge.starting_cash;
        
        // Boost them to 100-110% of target (random within that range)
        const boostMultiplier = 1.00 + (random.next() * 0.10);
        const newFinalValue = targetValue * boostMultiplier;
        
        // Update final value and recalculate dependent metrics
        bot.final_value = Number(newFinalValue.toFixed(2));
        bot.percentage_change_of_value = Number(((newFinalValue - startingCash) / startingCash * 100).toFixed(2));
        
        // Recalculate PPT if they have shares bought
        if (bot.ppt !== 0) {
          const totalSharesBought = (newFinalValue - startingCash) / bot.ppt;
          bot.ppt = Number(((newFinalValue - startingCash) / totalSharesBought).toFixed(2));
        }
      }
    }

    // Insert all bot entries
    const { data: insertedBots, error: insertError } = await supabase
      .from('leaderboard')
      .insert(botEntries)
      .select('id');

    if (insertError) {
      console.error('Database insertion error:', insertError);
      throw insertError;
    }

    // Get some statistics
    const finalValues = botEntries.map(b => b.final_value);
    const avgFinalValue = finalValues.reduce((sum, v) => sum + v, 0) / finalValues.length;
    const maxFinalValue = Math.max(...finalValues);
    const minFinalValue = Math.min(...finalValues);
    const finalWinnersCount = botEntries.filter(bot => bot.final_value >= targetValue).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully generated ${botEntries.length} bot entries for day ${challenge.day}`,
        day: challenge.day,
        botsCreated: insertedBots?.length || 0,
        statistics: {
          startingCash: challenge.starting_cash,
          targetValue: challenge.target_value,
          parFinalValue: challenge.par_final_value,
          avgBotFinalValue: Number(avgFinalValue.toFixed(2)),
          maxBotFinalValue: Number(maxFinalValue.toFixed(2)),
          minBotFinalValue: Number(minFinalValue.toFixed(2)),
          botsAboveTarget: finalWinnersCount,
          minWinnersRequired: minWinners,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating bots:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

