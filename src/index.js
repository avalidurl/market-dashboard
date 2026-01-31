// Worker entry point
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/quotes') {
      return handleQuotes();
    }

    return env.ASSETS.fetch(request);
  }
};

const SYMBOLS = [
  // US Indices (via ETFs)
  { symbol: 'SPY', name: 'S&P 500', section: 'indices', display: 'SPX' },
  { symbol: 'QQQ', name: 'Nasdaq 100', section: 'indices', display: 'NDX' },
  { symbol: 'DIA', name: 'Dow Jones', section: 'indices', display: 'DJI' },
  { symbol: 'IWM', name: 'Russell 2000', section: 'indices', display: 'RUT' },
  // International
  { symbol: 'EFA', name: 'Developed Markets', section: 'indices', display: 'EFA' },
  { symbol: 'EEM', name: 'Emerging Markets', section: 'indices', display: 'EEM' },
  // Volatility
  { symbol: 'VXX', name: 'VIX Short-Term', section: 'volatility', display: 'VIX' },
  // Bonds
  { symbol: 'TLT', name: '20+ Year Treasury', section: 'bonds', display: 'TLT' },
  { symbol: 'IEF', name: '7-10 Year Treasury', section: 'bonds', display: 'IEF' },
  { symbol: 'HYG', name: 'High Yield Corporate', section: 'bonds', display: 'HYG' },
  { symbol: 'LQD', name: 'Investment Grade', section: 'bonds', display: 'LQD' },
  // Commodities & FX
  { symbol: 'GLD', name: 'Gold', section: 'commodities', display: 'GLD' },
  { symbol: 'SLV', name: 'Silver', section: 'commodities', display: 'SLV' },
  { symbol: 'USO', name: 'Crude Oil', section: 'commodities', display: 'OIL' },
  { symbol: 'UNG', name: 'Natural Gas', section: 'commodities', display: 'GAS' },
  { symbol: 'UUP', name: 'US Dollar', section: 'commodities', display: 'DXY' },
];

async function handleQuotes() {
  const results = await Promise.all(
    SYMBOLS.map(async (item) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${item.symbol}?interval=1d&range=1y`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        if (!response.ok) return null;

        const data = await response.json();
        const meta = data.chart?.result?.[0]?.meta;
        const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0];

        if (!meta) return null;

        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose;
        const change = price - prevClose;
        const changePct = (change / prevClose) * 100;

        // Calculate YTD (first price of the year vs now)
        const timestamps = data.chart?.result?.[0]?.timestamp || [];
        const closes = quotes?.close || [];
        let ytdChange = null;

        if (timestamps.length > 0 && closes.length > 0) {
          // Find first trading day of current year
          const currentYear = new Date().getFullYear();
          const yearStart = new Date(currentYear, 0, 1).getTime() / 1000;

          let firstYearPrice = null;
          for (let i = 0; i < timestamps.length; i++) {
            if (timestamps[i] >= yearStart && closes[i]) {
              firstYearPrice = closes[i];
              break;
            }
          }

          if (firstYearPrice) {
            ytdChange = ((price - firstYearPrice) / firstYearPrice) * 100;
          }
        }

        return {
          symbol: item.display,
          displayName: item.name,
          section: item.section,
          regularMarketPrice: price,
          regularMarketChange: change,
          regularMarketChangePercent: changePct,
          regularMarketPreviousClose: prevClose,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
          regularMarketDayHigh: meta.regularMarketDayHigh,
          regularMarketDayLow: meta.regularMarketDayLow,
          regularMarketVolume: meta.regularMarketVolume,
          ytdChangePercent: ytdChange,
        };
      } catch (e) {
        console.error(e);
        return null;
      }
    })
  );

  const quotes = results.filter(Boolean);

  return new Response(JSON.stringify({
    quoteResponse: { result: quotes },
    timestamp: Date.now()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
