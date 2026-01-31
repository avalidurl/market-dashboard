// Worker entry point
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/quotes') {
      return handleQuotes(env);
    }

    return env.ASSETS.fetch(request);
  }
};

// Symbol mapping: our display -> Finnhub symbol
const SYMBOLS = {
  // US Indices (Finnhub uses ^SYMBOL format for indices)
  'SPX': { finnhub: 'SPY', name: 'S&P 500', section: 'indices', multiplier: 10 },
  'NDX': { finnhub: 'QQQ', name: 'Nasdaq 100', section: 'indices', multiplier: 45 },
  'DJI': { finnhub: 'DIA', name: 'Dow Jones', section: 'indices', multiplier: 100 },
  // Volatility
  'VIX': { finnhub: 'UVXY', name: 'VIX (proxy)', section: 'volatility' },
  // Bonds
  'TLT': { finnhub: 'TLT', name: '20Y+ Treasury', section: 'bonds' },
  'HYG': { finnhub: 'HYG', name: 'High Yield Corp', section: 'bonds' },
  'LQD': { finnhub: 'LQD', name: 'Inv Grade Corp', section: 'bonds' },
  'SHY': { finnhub: 'SHY', name: 'Short Treasury', section: 'bonds' },
  // Commodities & FX
  'GLD': { finnhub: 'GLD', name: 'Gold', section: 'commodities' },
  'USO': { finnhub: 'USO', name: 'Oil', section: 'commodities' },
  'UUP': { finnhub: 'UUP', name: 'Dollar Index', section: 'commodities' },
  // International
  'EFA': { finnhub: 'EFA', name: 'Intl Developed', section: 'indices' },
  'EEM': { finnhub: 'EEM', name: 'Emerging Markets', section: 'indices' },
  'FXI': { finnhub: 'FXI', name: 'China Large Cap', section: 'indices' },
};

async function handleQuotes(env) {
  const apiKey = env.FINNHUB_API_KEY || 'demo';
  const results = [];

  // Fetch all quotes in parallel
  const promises = Object.entries(SYMBOLS).map(async ([key, config]) => {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${config.finnhub}&token=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) return null;

      const data = await response.json();

      if (data.c) { // c = current price
        return {
          symbol: key,
          displayName: config.name,
          section: config.section,
          regularMarketPrice: data.c * (config.multiplier || 1),
          regularMarketChange: data.d * (config.multiplier || 1),
          regularMarketChangePercent: data.dp,
          regularMarketPreviousClose: data.pc * (config.multiplier || 1),
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const quotes = (await Promise.all(promises)).filter(Boolean);

  return new Response(JSON.stringify({
    quoteResponse: { result: quotes }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
