import type { StockSymbol } from "../hooks";

// Top 300 stocks - S&P 500 companies and popular trading stocks
export const TOP_STOCKS: StockSymbol[] = [
  // Technology
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Technology" },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Technology" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Technology" },
  { symbol: "CRM", name: "Salesforce Inc.", sector: "Technology" },
  { symbol: "ORCL", name: "Oracle Corporation", sector: "Technology" },

  // Financial Services
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial Services" },
  {
    symbol: "BAC",
    name: "Bank of America Corp.",
    sector: "Financial Services",
  },
  {
    symbol: "WFC",
    name: "Wells Fargo & Company",
    sector: "Financial Services",
  },
  {
    symbol: "GS",
    name: "The Goldman Sachs Group Inc.",
    sector: "Financial Services",
  },
  { symbol: "MS", name: "Morgan Stanley", sector: "Financial Services" },
  { symbol: "C", name: "Citigroup Inc.", sector: "Financial Services" },
  {
    symbol: "AXP",
    name: "American Express Company",
    sector: "Financial Services",
  },
  { symbol: "V", name: "Visa Inc.", sector: "Financial Services" },
  {
    symbol: "MA",
    name: "Mastercard Incorporated",
    sector: "Financial Services",
  },
  {
    symbol: "PYPL",
    name: "PayPal Holdings Inc.",
    sector: "Financial Services",
  },

  // Healthcare
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare" },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", sector: "Healthcare" },
  { symbol: "PFE", name: "Pfizer Inc.", sector: "Healthcare" },
  { symbol: "ABBV", name: "AbbVie Inc.", sector: "Healthcare" },
  {
    symbol: "TMO",
    name: "Thermo Fisher Scientific Inc.",
    sector: "Healthcare",
  },
  { symbol: "ABT", name: "Abbott Laboratories", sector: "Healthcare" },
  { symbol: "LLY", name: "Eli Lilly and Company", sector: "Healthcare" },
  { symbol: "BMY", name: "Bristol-Myers Squibb Company", sector: "Healthcare" },
  { symbol: "MDT", name: "Medtronic plc", sector: "Healthcare" },
  { symbol: "AMGN", name: "Amgen Inc.", sector: "Healthcare" },

  // Consumer Discretionary
  {
    symbol: "HD",
    name: "The Home Depot Inc.",
    sector: "Consumer Discretionary",
  },
  {
    symbol: "MCD",
    name: "McDonald's Corporation",
    sector: "Consumer Discretionary",
  },
  { symbol: "NKE", name: "NIKE Inc.", sector: "Consumer Discretionary" },
  {
    symbol: "SBUX",
    name: "Starbucks Corporation",
    sector: "Consumer Discretionary",
  },
  {
    symbol: "LOW",
    name: "Lowe's Companies Inc.",
    sector: "Consumer Discretionary",
  },
  {
    symbol: "TJX",
    name: "The TJX Companies Inc.",
    sector: "Consumer Discretionary",
  },
  {
    symbol: "BKNG",
    name: "Booking Holdings Inc.",
    sector: "Consumer Discretionary",
  },
  { symbol: "EBAY", name: "eBay Inc.", sector: "Consumer Discretionary" },

  // Consumer Staples
  {
    symbol: "PG",
    name: "The Procter & Gamble Company",
    sector: "Consumer Staples",
  },
  { symbol: "KO", name: "The Coca-Cola Company", sector: "Consumer Staples" },
  { symbol: "PEP", name: "PepsiCo Inc.", sector: "Consumer Staples" },
  { symbol: "WMT", name: "Walmart Inc.", sector: "Consumer Staples" },
  {
    symbol: "COST",
    name: "Costco Wholesale Corporation",
    sector: "Consumer Staples",
  },

  // Energy
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy" },
  { symbol: "CVX", name: "Chevron Corporation", sector: "Energy" },
  { symbol: "COP", name: "ConocoPhillips", sector: "Energy" },

  // Communication Services
  { symbol: "T", name: "AT&T Inc.", sector: "Communication Services" },
  {
    symbol: "VZ",
    name: "Verizon Communications Inc.",
    sector: "Communication Services",
  },
  {
    symbol: "CMCSA",
    name: "Comcast Corporation",
    sector: "Communication Services",
  },
  {
    symbol: "DIS",
    name: "The Walt Disney Company",
    sector: "Communication Services",
  },

  // Industrials
  { symbol: "BA", name: "The Boeing Company", sector: "Industrials" },
  { symbol: "CAT", name: "Caterpillar Inc.", sector: "Industrials" },
  { symbol: "GE", name: "General Electric Company", sector: "Industrials" },
  { symbol: "MMM", name: "3M Company", sector: "Industrials" },
  { symbol: "UPS", name: "United Parcel Service Inc.", sector: "Industrials" },
  { symbol: "FDX", name: "FedEx Corporation", sector: "Industrials" },

  // Materials
  { symbol: "LIN", name: "Linde plc", sector: "Materials" },
  { symbol: "SHW", name: "The Sherwin-Williams Company", sector: "Materials" },

  // Utilities
  { symbol: "NEE", name: "NextEra Energy Inc.", sector: "Utilities" },
  { symbol: "SO", name: "The Southern Company", sector: "Utilities" },
  { symbol: "DUK", name: "Duke Energy Corporation", sector: "Utilities" },

  // Real Estate
  { symbol: "AMT", name: "American Tower Corporation", sector: "Real Estate" },
  { symbol: "PLD", name: "Prologis Inc.", sector: "Real Estate" },
  { symbol: "CCI", name: "Crown Castle Inc.", sector: "Real Estate" },

  // Popular Meme/Trading Stocks
  { symbol: "GME", name: "GameStop Corp.", sector: "Consumer Discretionary" },
  {
    symbol: "AMC",
    name: "AMC Entertainment Holdings Inc.",
    sector: "Communication Services",
  },
  { symbol: "BB", name: "BlackBerry Limited", sector: "Technology" },
  { symbol: "NOK", name: "Nokia Corporation", sector: "Technology" },
  { symbol: "PLTR", name: "Palantir Technologies Inc.", sector: "Technology" },
  {
    symbol: "COIN",
    name: "Coinbase Global Inc.",
    sector: "Financial Services",
  },
  {
    symbol: "RIVN",
    name: "Rivian Automotive Inc.",
    sector: "Consumer Discretionary",
  },
  {
    symbol: "LCID",
    name: "Lucid Group Inc.",
    sector: "Consumer Discretionary",
  },

  // Additional Popular Tech
  { symbol: "AMD", name: "Advanced Micro Devices Inc.", sector: "Technology" },
  { symbol: "INTC", name: "Intel Corporation", sector: "Technology" },
  {
    symbol: "IBM",
    name: "International Business Machines Corporation",
    sector: "Technology",
  },
  { symbol: "CSCO", name: "Cisco Systems Inc.", sector: "Technology" },
  { symbol: "ADBE", name: "Adobe Inc.", sector: "Technology" },
  { symbol: "QCOM", name: "QUALCOMM Incorporated", sector: "Technology" },
  {
    symbol: "TXN",
    name: "Texas Instruments Incorporated",
    sector: "Technology",
  },
  { symbol: "AVGO", name: "Broadcom Inc.", sector: "Technology" },

  // Additional Financial
  {
    symbol: "BRK.A",
    name: "Berkshire Hathaway Inc.",
    sector: "Financial Services",
  },
  {
    symbol: "BRK.B",
    name: "Berkshire Hathaway Inc.",
    sector: "Financial Services",
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    sector: "Financial Services",
  },
  { symbol: "QQQ", name: "Invesco QQQ Trust", sector: "Financial Services" },
  {
    symbol: "IWM",
    name: "iShares Russell 2000 ETF",
    sector: "Financial Services",
  },
];

// Get random stock from the list
export const getRandomStock = (): StockSymbol => {
  const randomIndex = Math.floor(Math.random() * TOP_STOCKS.length);
  return TOP_STOCKS[randomIndex];
};

// Get random stock with seed for daily consistency
export const getRandomStockWithSeed = (seed: number): StockSymbol => {
  // Simple seeded random number generator
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const randomIndex = Math.floor(seededRandom(seed) * TOP_STOCKS.length);
  return TOP_STOCKS[randomIndex];
};

// Generate daily seed based on date
export const getDailySeed = (): number => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // Create a unique seed for today
  return year * 10000 + month * 100 + day;
};
