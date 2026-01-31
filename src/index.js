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
  // International
  { symbol: 'EFA', name: 'Intl Developed', section: 'indices', display: 'EFA' },
  { symbol: 'EEM', name: 'Emerging Markets', section: 'indices', display: 'EEM' },
  { symbol: 'FXI', name: 'China Large Cap', section: 'indices', display: 'FXI' },
  // Volatility
  { symbol: 'VXX', name: 'VIX Short-Term', section: 'volatility', display: 'VIX' },
  // Bonds
  { symbol: 'TLT', name: '20Y+ Treasury', section: 'bonds', display: 'TLT' },
  { symbol: 'IEF', name: '7-10Y Treasury', section: 'bonds', display: 'IEF' },
  { symbol: 'SHY', name: 'Short Treasury', section: 'bonds', display: 'SHY' },
  { symbol: 'HYG', name: 'High Yield Corp', section: 'bonds', display: 'HYG' },
  { symbol: 'LQD', name: 'Inv Grade Corp', section: 'bonds', display: 'LQD' },
  // Commodities & FX
  { symbol: 'GLD', name: 'Gold', section: 'commodities', display: 'GLD' },
  { symbol: 'USO', name: 'Crude Oil', section: 'commodities', display: 'USO' },
  { symbol: 'UUP', name: 'Dollar Index', section: 'commodities', display: 'DXY' },
  { symbol: 'COPX', name: 'Copper Miners', section: 'commodities', display: 'COPX' },
];

async function handleQuotes() {
  const results = await Promise.all(
    SYMBOLS.map(async (item) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${item.symbol}?interval=1d&range=1d`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        if (!response.ok) return null;

        const data = await response.json();
        const meta = data.chart?.result?.[0]?.meta;

        if (!meta) return null;

        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose;
        const change = price - prevClose;
        const changePct = (change / prevClose) * 100;

        return {
          symbol: item.display,
          displayName: item.name,
          section: item.section,
          regularMarketPrice: price,
          regularMarketChange: change,
          regularMarketChangePercent: changePct,
          regularMarketPreviousClose: prevClose,
        };
      } catch (e) {
        return null;
      }
    })
  );

  const quotes = results.filter(Boolean);

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
