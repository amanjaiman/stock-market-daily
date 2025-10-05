import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Stock data interface
interface StockSymbol {
  symbol: string;
  name: string;
  sector?: string;
  wiki_link?: string;
  stock_link?: string;
}

// Top 300 stocks - S&P 500 companies and popular trading stocks
const TOP_STOCKS: StockSymbol[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Apple_Inc",
    stock_link: "https://www.google.com/search?q=Apple+Inc.+stock"
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Microsoft_Corporation",
    stock_link: "https://www.google.com/search?q=Microsoft+Corporation+stock"
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Alphabet_Inc",
    stock_link: "https://www.google.com/search?q=Alphabet+Inc.+stock"
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Amazon.com_Inc",
    stock_link: "https://www.google.com/search?q=Amazon.com+Inc.+stock"
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/NVIDIA_Corporation",
    stock_link: "https://www.google.com/search?q=NVIDIA+Corporation+stock"
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Tesla_Inc",
    stock_link: "https://www.google.com/search?q=Tesla+Inc.+stock"
  },
  {
    symbol: "META",
    name: "Meta Platforms Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Meta_Platforms_Inc",
    stock_link: "https://www.google.com/search?q=Meta+Platforms+Inc.+stock"
  },
  {
    symbol: "NFLX",
    name: "Netflix Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Netflix_Inc",
    stock_link: "https://www.google.com/search?q=Netflix+Inc.+stock"
  },
  {
    symbol: "CRM",
    name: "Salesforce Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Salesforce_Inc",
    stock_link: "https://www.google.com/search?q=Salesforce+Inc.+stock"
  },
  {
    symbol: "ORCL",
    name: "Oracle Corporation",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Oracle_Corporation",
    stock_link: "https://www.google.com/search?q=Oracle+Corporation+stock"
  },
  {
    symbol: "JPM",
    name: "JPMorgan Chase & Co.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/JPMorgan_Chase_%26_Co",
    stock_link: "https://www.google.com/search?q=JPMorgan+Chase+%26+Co.+stock"
  },
  {
    symbol: "BAC",
    name: "Bank of America Corp.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/Bank_of_America_Corp",
    stock_link: "https://www.google.com/search?q=Bank+of+America+Corp.+stock"
  },
  {
    symbol: "WFC",
    name: "Wells Fargo & Company",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/Wells_Fargo_%26_Company",
    stock_link: "https://www.google.com/search?q=Wells+Fargo+%26+Company+stock"
  },
  {
    symbol: "GS",
    name: "The Goldman Sachs Group Inc.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/The_Goldman_Sachs_Group_Inc",
    stock_link: "https://www.google.com/search?q=The+Goldman+Sachs+Group+Inc.+stock"
  },
  {
    symbol: "MS",
    name: "Morgan Stanley",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/Morgan_Stanley",
    stock_link: "https://www.google.com/search?q=Morgan+Stanley+stock"
  },
  {
    symbol: "C",
    name: "Citigroup Inc.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/Citigroup_Inc",
    stock_link: "https://www.google.com/search?q=Citigroup+Inc.+stock"
  },
  {
    symbol: "AXP",
    name: "American Express Company",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/American_Express_Company",
    stock_link: "https://www.google.com/search?q=American+Express+Company+stock"
  },
  {
    symbol: "V",
    name: "Visa Inc.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/Visa_Inc",
    stock_link: "https://www.google.com/search?q=Visa+Inc.+stock"
  },
  {
    symbol: "MA",
    name: "Mastercard Incorporated",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/Mastercard_Incorporated",
    stock_link: "https://www.google.com/search?q=Mastercard+Incorporated+stock"
  },
  {
    symbol: "PYPL",
    name: "PayPal Holdings Inc.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/PayPal_Holdings_Inc",
    stock_link: "https://www.google.com/search?q=PayPal+Holdings+Inc.+stock"
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/Johnson_%26_Johnson",
    stock_link: "https://www.google.com/search?q=Johnson+%26+Johnson+stock"
  },
  {
    symbol: "UNH",
    name: "UnitedHealth Group Inc.",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/UnitedHealth_Group_Inc",
    stock_link: "https://www.google.com/search?q=UnitedHealth+Group+Inc.+stock"
  },
  {
    symbol: "PFE",
    name: "Pfizer Inc.",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/Pfizer_Inc",
    stock_link: "https://www.google.com/search?q=Pfizer+Inc.+stock"
  },
  {
    symbol: "ABBV",
    name: "AbbVie Inc.",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/AbbVie_Inc",
    stock_link: "https://www.google.com/search?q=AbbVie+Inc.+stock"
  },
  {
    symbol: "TMO",
    name: "Thermo Fisher Scientific Inc.",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/Thermo_Fisher_Scientific_Inc",
    stock_link: "https://www.google.com/search?q=Thermo+Fisher+Scientific+Inc.+stock"
  },
  {
    symbol: "ABT",
    name: "Abbott Laboratories",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/Abbott_Laboratories",
    stock_link: "https://www.google.com/search?q=Abbott+Laboratories+stock"
  },
  {
    symbol: "LLY",
    name: "Eli Lilly and Company",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/Eli_Lilly_and_Company",
    stock_link: "https://www.google.com/search?q=Eli+Lilly+and+Company+stock"
  },
  {
    symbol: "BMY",
    name: "Bristol-Myers Squibb Company",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/Bristol-Myers_Squibb_Company",
    stock_link: "https://www.google.com/search?q=Bristol-Myers+Squibb+Company+stock"
  },
  {
    symbol: "MDT",
    name: "Medtronic plc",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/Medtronic_plc",
    stock_link: "https://www.google.com/search?q=Medtronic+plc+stock"
  },
  {
    symbol: "AMGN",
    name: "Amgen Inc.",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/Amgen_Inc",
    stock_link: "https://www.google.com/search?q=Amgen+Inc.+stock"
  },
  {
    symbol: "HD",
    name: "The Home Depot Inc.",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/The_Home_Depot_Inc",
    stock_link: "https://www.google.com/search?q=The+Home+Depot+Inc.+stock"
  },
  {
    symbol: "MCD",
    name: "McDonald's Corporation",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/McDonald%27s_Corporation",
    stock_link: "https://www.google.com/search?q=McDonald%27s+Corporation+stock"
  },
  {
    symbol: "NKE",
    name: "NIKE Inc.",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/NIKE_Inc",
    stock_link: "https://www.google.com/search?q=NIKE+Inc.+stock"
  },
  {
    symbol: "SBUX",
    name: "Starbucks Corporation",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/Starbucks_Corporation",
    stock_link: "https://www.google.com/search?q=Starbucks+Corporation+stock"
  },
  {
    symbol: "LOW",
    name: "Lowe's Companies Inc.",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/Lowe%27s_Companies_Inc",
    stock_link: "https://www.google.com/search?q=Lowe%27s+Companies+Inc.+stock"
  },
  {
    symbol: "TJX",
    name: "The TJX Companies Inc.",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/The_TJX_Companies_Inc",
    stock_link: "https://www.google.com/search?q=The+TJX+Companies+Inc.+stock"
  },
  {
    symbol: "BKNG",
    name: "Booking Holdings Inc.",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/Booking_Holdings_Inc",
    stock_link: "https://www.google.com/search?q=Booking+Holdings+Inc.+stock"
  },
  {
    symbol: "EBAY",
    name: "eBay Inc.",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/eBay_Inc",
    stock_link: "https://www.google.com/search?q=eBay+Inc.+stock"
  },
  {
    symbol: "PG",
    name: "The Procter & Gamble Company",
    sector: "Consumer Staples",
    wiki_link: "https://en.wikipedia.org/wiki/The_Procter_%26_Gamble_Company",
    stock_link: "https://www.google.com/search?q=The+Procter+%26+Gamble+Company+stock"
  },
  {
    symbol: "KO",
    name: "The Coca-Cola Company",
    sector: "Consumer Staples",
    wiki_link: "https://en.wikipedia.org/wiki/The_Coca-Cola_Company",
    stock_link: "https://www.google.com/search?q=The+Coca-Cola+Company+stock"
  },
  {
    symbol: "PEP",
    name: "PepsiCo Inc.",
    sector: "Consumer Staples",
    wiki_link: "https://en.wikipedia.org/wiki/PepsiCo_Inc",
    stock_link: "https://www.google.com/search?q=PepsiCo+Inc.+stock"
  },
  {
    symbol: "WMT",
    name: "Walmart Inc.",
    sector: "Consumer Staples",
    wiki_link: "https://en.wikipedia.org/wiki/Walmart_Inc",
    stock_link: "https://www.google.com/search?q=Walmart+Inc.+stock"
  },
  {
    symbol: "COST",
    name: "Costco Wholesale Corporation",
    sector: "Consumer Staples",
    wiki_link: "https://en.wikipedia.org/wiki/Costco_Wholesale_Corporation",
    stock_link: "https://www.google.com/search?q=Costco+Wholesale+Corporation+stock"
  },
  {
    symbol: "XOM",
    name: "Exxon Mobil Corporation",
    sector: "Energy",
    wiki_link: "https://en.wikipedia.org/wiki/Exxon_Mobil_Corporation",
    stock_link: "https://www.google.com/search?q=Exxon+Mobil+Corporation+stock"
  },
  {
    symbol: "CVX",
    name: "Chevron Corporation",
    sector: "Energy",
    wiki_link: "https://en.wikipedia.org/wiki/Chevron_Corporation",
    stock_link: "https://www.google.com/search?q=Chevron+Corporation+stock"
  },
  {
    symbol: "COP",
    name: "ConocoPhillips",
    sector: "Energy",
    wiki_link: "https://en.wikipedia.org/wiki/ConocoPhillips",
    stock_link: "https://www.google.com/search?q=ConocoPhillips+stock"
  },
  {
    symbol: "T",
    name: "AT&T Inc.",
    sector: "Communication Services",
    wiki_link: "https://en.wikipedia.org/wiki/AT%26T_Inc",
    stock_link: "https://www.google.com/search?q=AT%26T+Inc.+stock"
  },
  {
    symbol: "VZ",
    name: "Verizon Communications Inc.",
    sector: "Communication Services",
    wiki_link: "https://en.wikipedia.org/wiki/Verizon_Communications_Inc",
    stock_link: "https://www.google.com/search?q=Verizon+Communications+Inc.+stock"
  },
  {
    symbol: "CMCSA",
    name: "Comcast Corporation",
    sector: "Communication Services",
    wiki_link: "https://en.wikipedia.org/wiki/Comcast_Corporation",
    stock_link: "https://www.google.com/search?q=Comcast+Corporation+stock"
  },
  {
    symbol: "DIS",
    name: "The Walt Disney Company",
    sector: "Communication Services",
    wiki_link: "https://en.wikipedia.org/wiki/The_Walt_Disney_Company",
    stock_link: "https://www.google.com/search?q=The+Walt+Disney+Company+stock"
  },
  {
    symbol: "BA",
    name: "The Boeing Company",
    sector: "Industrials",
    wiki_link: "https://en.wikipedia.org/wiki/The_Boeing_Company",
    stock_link: "https://www.google.com/search?q=The+Boeing+Company+stock"
  },
  {
    symbol: "CAT",
    name: "Caterpillar Inc.",
    sector: "Industrials",
    wiki_link: "https://en.wikipedia.org/wiki/Caterpillar_Inc",
    stock_link: "https://www.google.com/search?q=Caterpillar+Inc.+stock"
  },
  {
    symbol: "GE",
    name: "General Electric Company",
    sector: "Industrials",
    wiki_link: "https://en.wikipedia.org/wiki/General_Electric_Company",
    stock_link: "https://www.google.com/search?q=General+Electric+Company+stock"
  },
  {
    symbol: "MMM",
    name: "3M Company",
    sector: "Industrials",
    wiki_link: "https://en.wikipedia.org/wiki/3M_Company",
    stock_link: "https://www.google.com/search?q=3M+Company+stock"
  },
  {
    symbol: "UPS",
    name: "United Parcel Service Inc.",
    sector: "Industrials",
    wiki_link: "https://en.wikipedia.org/wiki/United_Parcel_Service_Inc",
    stock_link: "https://www.google.com/search?q=United+Parcel+Service+Inc.+stock"
  },
  {
    symbol: "FDX",
    name: "FedEx Corporation",
    sector: "Industrials",
    wiki_link: "https://en.wikipedia.org/wiki/FedEx_Corporation",
    stock_link: "https://www.google.com/search?q=FedEx+Corporation+stock"
  },
  {
    symbol: "LIN",
    name: "Linde plc",
    sector: "Materials",
    wiki_link: "https://en.wikipedia.org/wiki/Linde_plc",
    stock_link: "https://www.google.com/search?q=Linde+plc+stock"
  },
  {
    symbol: "SHW",
    name: "The Sherwin-Williams Company",
    sector: "Materials",
    wiki_link: "https://en.wikipedia.org/wiki/The_Sherwin-Williams_Company",
    stock_link: "https://www.google.com/search?q=The+Sherwin-Williams+Company+stock"
  },
  {
    symbol: "NEE",
    name: "NextEra Energy Inc.",
    sector: "Utilities",
    wiki_link: "https://en.wikipedia.org/wiki/NextEra_Energy_Inc",
    stock_link: "https://www.google.com/search?q=NextEra+Energy+Inc.+stock"
  },
  {
    symbol: "SO",
    name: "The Southern Company",
    sector: "Utilities",
    wiki_link: "https://en.wikipedia.org/wiki/The_Southern_Company",
    stock_link: "https://www.google.com/search?q=The+Southern+Company+stock"
  },
  {
    symbol: "DUK",
    name: "Duke Energy Corporation",
    sector: "Utilities",
    wiki_link: "https://en.wikipedia.org/wiki/Duke_Energy_Corporation",
    stock_link: "https://www.google.com/search?q=Duke+Energy+Corporation+stock"
  },
  {
    symbol: "AMT",
    name: "American Tower Corporation",
    sector: "Real Estate",
    wiki_link: "https://en.wikipedia.org/wiki/American_Tower_Corporation",
    stock_link: "https://www.google.com/search?q=American+Tower+Corporation+stock"
  },
  {
    symbol: "PLD",
    name: "Prologis Inc.",
    sector: "Real Estate",
    wiki_link: "https://en.wikipedia.org/wiki/Prologis_Inc",
    stock_link: "https://www.google.com/search?q=Prologis+Inc.+stock"
  },
  {
    symbol: "CCI",
    name: "Crown Castle Inc.",
    sector: "Real Estate",
    wiki_link: "https://en.wikipedia.org/wiki/Crown_Castle_Inc",
    stock_link: "https://www.google.com/search?q=Crown+Castle+Inc.+stock"
  },
  {
    symbol: "GME",
    name: "GameStop Corp.",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/GameStop_Corp",
    stock_link: "https://www.google.com/search?q=GameStop+Corp.+stock"
  },
  {
    symbol: "AMC",
    name: "AMC Entertainment Holdings Inc.",
    sector: "Communication Services",
    wiki_link: "https://en.wikipedia.org/wiki/AMC_Entertainment_Holdings_Inc",
    stock_link: "https://www.google.com/search?q=AMC+Entertainment+Holdings+Inc.+stock"
  },
  {
    symbol: "BB",
    name: "BlackBerry Limited",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/BlackBerry_Limited",
    stock_link: "https://www.google.com/search?q=BlackBerry+Limited+stock"
  },
  {
    symbol: "NOK",
    name: "Nokia Corporation",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Nokia_Corporation",
    stock_link: "https://www.google.com/search?q=Nokia+Corporation+stock"
  },
  {
    symbol: "PLTR",
    name: "Palantir Technologies Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Palantir_Technologies_Inc",
    stock_link: "https://www.google.com/search?q=Palantir+Technologies+Inc.+stock"
  },
  {
    symbol: "COIN",
    name: "Coinbase Global Inc.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/Coinbase_Global_Inc",
    stock_link: "https://www.google.com/search?q=Coinbase+Global+Inc.+stock"
  },
  {
    symbol: "RIVN",
    name: "Rivian Automotive Inc.",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/Rivian_Automotive_Inc",
    stock_link: "https://www.google.com/search?q=Rivian+Automotive+Inc.+stock"
  },
  {
    symbol: "LCID",
    name: "Lucid Group Inc.",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/Lucid_Group_Inc",
    stock_link: "https://www.google.com/search?q=Lucid+Group+Inc.+stock"
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Advanced_Micro_Devices_Inc",
    stock_link: "https://www.google.com/search?q=Advanced+Micro+Devices+Inc.+stock"
  },
  {
    symbol: "INTC",
    name: "Intel Corporation",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Intel_Corporation",
    stock_link: "https://www.google.com/search?q=Intel+Corporation+stock"
  },
  {
    symbol: "IBM",
    name: "International Business Machines Corporation",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/International_Business_Machines_Corporation",
    stock_link: "https://www.google.com/search?q=International+Business+Machines+Corporation+stock"
  },
  {
    symbol: "CSCO",
    name: "Cisco Systems Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Cisco_Systems_Inc",
    stock_link: "https://www.google.com/search?q=Cisco+Systems+Inc.+stock"
  },
  {
    symbol: "ADBE",
    name: "Adobe Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Adobe_Inc",
    stock_link: "https://www.google.com/search?q=Adobe+Inc.+stock"
  },
  {
    symbol: "QCOM",
    name: "QUALCOMM Incorporated",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/QUALCOMM_Incorporated",
    stock_link: "https://www.google.com/search?q=QUALCOMM+Incorporated+stock"
  },
  {
    symbol: "TXN",
    name: "Texas Instruments Incorporated",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Texas_Instruments_Incorporated",
    stock_link: "https://www.google.com/search?q=Texas+Instruments+Incorporated+stock"
  },
  {
    symbol: "AVGO",
    name: "Broadcom Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Broadcom_Inc",
    stock_link: "https://www.google.com/search?q=Broadcom+Inc.+stock"
  },
  {
    symbol: "BRK.A",
    name: "Berkshire Hathaway Inc.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/Berkshire_Hathaway_Inc",
    stock_link: "https://www.google.com/search?q=Berkshire+Hathaway+Inc.+stock"
  },
  {
    symbol: "BRK.B",
    name: "Berkshire Hathaway Inc.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/Berkshire_Hathaway_Inc",
    stock_link: "https://www.google.com/search?q=Berkshire+Hathaway+Inc.+stock"
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/SPDR_S%26P_500_ETF_Trust",
    stock_link: "https://www.google.com/search?q=SPDR+S%26P+500+ETF+Trust+stock"
  },
  {
    symbol: "QQQ",
    name: "Invesco QQQ Trust",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/Invesco_QQQ_Trust",
    stock_link: "https://www.google.com/search?q=Invesco+QQQ+Trust+stock"
  },
  {
    symbol: "IWM",
    name: "iShares Russell 2000 ETF",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/iShares_Russell_2000_ETF",
    stock_link: "https://www.google.com/search?q=iShares+Russell+2000+ETF+stock"
  },
  {
    symbol: "UBER",
    name: "Uber Technologies Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Uber_Technologies_Inc",
    stock_link: "https://www.google.com/search?q=Uber+Technologies+Inc.+stock"
  },
  {
    symbol: "ZM",
    name: "Zoom Video Communications Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Zoom_Video_Communications_Inc",
    stock_link: "https://www.google.com/search?q=Zoom+Video+Communications+Inc.+stock"
  },
  {
    symbol: "SNOW",
    name: "Snowflake Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Snowflake_Inc",
    stock_link: "https://www.google.com/search?q=Snowflake+Inc.+stock"
  },
  {
    symbol: "SQ",
    name: "Block Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Block_Inc",
    stock_link: "https://www.google.com/search?q=Block+Inc.+stock"
  },
  {
    symbol: "TWLO",
    name: "Twilio Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Twilio_Inc",
    stock_link: "https://www.google.com/search?q=Twilio+Inc.+stock"
  },
  {
    symbol: "OKTA",
    name: "Okta Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Okta_Inc",
    stock_link: "https://www.google.com/search?q=Okta+Inc.+stock"
  },
  {
    symbol: "CRWD",
    name: "CrowdStrike Holdings Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/CrowdStrike_Holdings_Inc",
    stock_link: "https://www.google.com/search?q=CrowdStrike+Holdings+Inc.+stock"
  },
  {
    symbol: "NOW",
    name: "ServiceNow Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/ServiceNow_Inc",
    stock_link: "https://www.google.com/search?q=ServiceNow+Inc.+stock"
  },
  {
    symbol: "DOCU",
    name: "DocuSign Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/DocuSign_Inc",
    stock_link: "https://www.google.com/search?q=DocuSign+Inc.+stock"
  },
  {
    symbol: "U",
    name: "Unity Software Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Unity_Software_Inc",
    stock_link: "https://www.google.com/search?q=Unity+Software+Inc.+stock"
  },
  {
    symbol: "ABNB",
    name: "Airbnb Inc.",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Airbnb_Inc",
    stock_link: "https://www.google.com/search?q=Airbnb+Inc.+stock"
  },
  {
    symbol: "RBLX",
    name: "Roblox Corporation",
    sector: "Technology",
    wiki_link: "https://en.wikipedia.org/wiki/Roblox_Corporation",
    stock_link: "https://www.google.com/search?q=Roblox+Corporation+stock"
  },
  {
    symbol: "BLK",
    name: "BlackRock Inc.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/BlackRock_Inc",
    stock_link: "https://www.google.com/search?q=BlackRock+Inc.+stock"
  },
  {
    symbol: "SCHW",
    name: "The Charles Schwab Corporation",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/The_Charles_Schwab_Corporation",
    stock_link: "https://www.google.com/search?q=The+Charles+Schwab+Corporation+stock"
  },
  {
    symbol: "HOOD",
    name: "Robinhood Markets Inc.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/Robinhood_Markets_Inc",
    stock_link: "https://www.google.com/search?q=Robinhood+Markets+Inc.+stock"
  },
  {
    symbol: "BK",
    name: "The Bank of New York Mellon Corporation",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/The_Bank_of_New_York_Mellon_Corporation",
    stock_link: "https://www.google.com/search?q=The+Bank+of+New+York+Mellon+Corporation+stock"
  },
  {
    symbol: "SPGI",
    name: "S&P Global Inc.",
    sector: "Financial Services",
    wiki_link: "https://en.wikipedia.org/wiki/S%26P_Global_Inc",
    stock_link: "https://www.google.com/search?q=S%26P+Global+Inc.+stock"
  },
  {
    symbol: "TGT",
    name: "Target Corporation",
    sector: "Consumer Discretionary",
    wiki_link: "https://en.wikipedia.org/wiki/Target_Corporation",
    stock_link: "https://www.google.com/search?q=Target+Corporation+stock"
  },
  {
    symbol: "KHC",
    name: "The Kraft Heinz Company",
    sector: "Consumer Staples",
    wiki_link: "https://en.wikipedia.org/wiki/The_Kraft_Heinz_Company",
    stock_link: "https://www.google.com/search?q=The+Kraft+Heinz+Company+stock"
  },
  {
    symbol: "MDLZ",
    name: "Mondelez International Inc.",
    sector: "Consumer Staples",
    wiki_link: "https://en.wikipedia.org/wiki/Mondelez_International_Inc",
    stock_link: "https://www.google.com/search?q=Mondelez+International+Inc.+stock"
  },
  {
    symbol: "CL",
    name: "Colgate-Palmolive Company",
    sector: "Consumer Staples",
    wiki_link: "https://en.wikipedia.org/wiki/Colgate-Palmolive_Company",
    stock_link: "https://www.google.com/search?q=Colgate-Palmolive+Company+stock"
  },
  {
    symbol: "KMB",
    name: "Kimberly-Clark Corporation",
    sector: "Consumer Staples",
    wiki_link: "https://en.wikipedia.org/wiki/Kimberly-Clark_Corporation",
    stock_link: "https://www.google.com/search?q=Kimberly-Clark+Corporation+stock"
  },
  {
    symbol: "MO",
    name: "Altria Group Inc.",
    sector: "Consumer Staples",
    wiki_link: "https://en.wikipedia.org/wiki/Altria_Group_Inc",
    stock_link: "https://www.google.com/search?q=Altria+Group+Inc.+stock"
  },
  {
    symbol: "GM",
    name: "General Motors Company",
    sector: "Industrials",
    wiki_link: "https://en.wikipedia.org/wiki/General_Motors_Company",
    stock_link: "https://www.google.com/search?q=General+Motors+Company+stock"
  },
  {
    symbol: "F",
    name: "Ford Motor Company",
    sector: "Industrials",
    wiki_link: "https://en.wikipedia.org/wiki/Ford_Motor_Company",
    stock_link: "https://www.google.com/search?q=Ford+Motor+Company+stock"
  },
  {
    symbol: "LMT",
    name: "Lockheed Martin Corporation",
    sector: "Industrials",
    wiki_link: "https://en.wikipedia.org/wiki/Lockheed_Martin_Corporation",
    stock_link: "https://www.google.com/search?q=Lockheed+Martin+Corporation+stock"
  },
  {
    symbol: "HON",
    name: "Honeywell International Inc.",
    sector: "Industrials",
    wiki_link: "https://en.wikipedia.org/wiki/Honeywell_International_Inc",
    stock_link: "https://www.google.com/search?q=Honeywell+International+Inc.+stock"
  },
  {
    symbol: "OXY",
    name: "Occidental Petroleum Corporation",
    sector: "Energy",
    wiki_link: "https://en.wikipedia.org/wiki/Occidental_Petroleum_Corporation",
    stock_link: "https://www.google.com/search?q=Occidental+Petroleum+Corporation+stock"
  },
  {
    symbol: "PSX",
    name: "Phillips 66",
    sector: "Energy",
    wiki_link: "https://en.wikipedia.org/wiki/Phillips_66",
    stock_link: "https://www.google.com/search?q=Phillips+66+stock"
  },
  {
    symbol: "SLB",
    name: "Schlumberger Limited",
    sector: "Energy",
    wiki_link: "https://en.wikipedia.org/wiki/Schlumberger_Limited",
    stock_link: "https://www.google.com/search?q=Schlumberger+Limited+stock"
  },
  {
    symbol: "D",
    name: "Dominion Energy Inc.",
    sector: "Utilities",
    wiki_link: "https://en.wikipedia.org/wiki/Dominion_Energy_Inc",
    stock_link: "https://www.google.com/search?q=Dominion+Energy+Inc.+stock"
  },
  {
    symbol: "EXC",
    name: "Exelon Corporation",
    sector: "Utilities",
    wiki_link: "https://en.wikipedia.org/wiki/Exelon_Corporation",
    stock_link: "https://www.google.com/search?q=Exelon+Corporation+stock"
  },
  {
    symbol: "DOW",
    name: "Dow Inc.",
    sector: "Materials",
    wiki_link: "https://en.wikipedia.org/wiki/Dow_Inc",
    stock_link: "https://www.google.com/search?q=Dow+Inc.+stock"
  },
  {
    symbol: "NEM",
    name: "Newmont Corporation",
    sector: "Materials",
    wiki_link: "https://en.wikipedia.org/wiki/Newmont_Corporation",
    stock_link: "https://www.google.com/search?q=Newmont+Corporation+stock"
  },
  {
    symbol: "FCX",
    name: "Freeport-McMoRan Inc.",
    sector: "Materials",
    wiki_link: "https://en.wikipedia.org/wiki/Freeport-McMoRan_Inc",
    stock_link: "https://www.google.com/search?q=Freeport-McMoRan+Inc.+stock"
  },
  {
    symbol: "SPG",
    name: "Simon Property Group Inc.",
    sector: "Real Estate",
    wiki_link: "https://en.wikipedia.org/wiki/Simon_Property_Group_Inc",
    stock_link: "https://www.google.com/search?q=Simon+Property+Group+Inc.+stock"
  },
  {
    symbol: "O",
    name: "Realty Income Corporation",
    sector: "Real Estate",
    wiki_link: "https://en.wikipedia.org/wiki/Realty_Income_Corporation",
    stock_link: "https://www.google.com/search?q=Realty+Income+Corporation+stock"
  },
  {
    symbol: "MRK",
    name: "Merck & Co., Inc.",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/Merck_%26_Co.%2C_Inc",
    stock_link: "https://www.google.com/search?q=Merck+%26+Co.%2C+Inc.+stock"
  },
  {
    symbol: "GILD",
    name: "Gilead Sciences Inc.",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/Gilead_Sciences_Inc",
    stock_link: "https://www.google.com/search?q=Gilead+Sciences+Inc.+stock"
  },
  {
    symbol: "CVS",
    name: "CVS Health Corporation",
    sector: "Healthcare",
    wiki_link: "https://en.wikipedia.org/wiki/CVS_Health_Corporation",
    stock_link: "https://www.google.com/search?q=CVS+Health+Corporation+stock"
  }
];

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

    // Insert stocks into database using upsert to handle duplicates
    const { data, error } = await supabase
      .from('stocks')
      .upsert(TOP_STOCKS, { 
        onConflict: 'symbol',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully seeded ${data?.length || TOP_STOCKS.length} stocks`,
        stocks_added: data?.length || TOP_STOCKS.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error in seed-stocks function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
