// Cloudflare Pages Function to proxy Yahoo Finance API
export async function onRequest(context) {
  const symbols = [
    // US Indices
    '^GSPC',    // S&P 500
    '^NDX',     // Nasdaq 100
    '^DJI',     // Dow Jones
    '^VIX',     // VIX
    // International
    '^STOXX50E', // Euro Stoxx 50
    '^N225',    // Nikkei 225
    '000001.SS', // Shanghai Composite
    // Bonds
    '^TNX',     // 10Y Treasury Yield
    '^TYX',     // 30Y Treasury Yield
    '^IRX',     // 13-Week T-Bill
    // Currency & Commodities
    'DX-Y.NYB', // Dollar Index
    'GC=F',     // Gold
    'CL=F',     // Crude Oil WTI
    'HG=F',     // Copper
    // ETFs for additional data
    'TLT',      // 20+ Year Treasury ETF
    'HYG',      // High Yield Corporate Bond ETF
    'LQD',      // Investment Grade Corporate Bond ETF
  ];

  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
