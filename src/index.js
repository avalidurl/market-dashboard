// Worker entry point
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API endpoint for market quotes
    if (url.pathname === '/api/quotes') {
      return handleQuotes();
    }

    // Serve static files from assets
    return env.ASSETS.fetch(request);
  }
};

async function handleQuotes() {
  const symbols = [
    '^GSPC', '^NDX', '^DJI', '^VIX',
    '^STOXX50E', '^N225', '000001.SS',
    '^TNX', '^TYX', '^IRX',
    'DX-Y.NYB', 'GC=F', 'CL=F', 'HG=F',
    'TLT', 'HYG', 'LQD',
  ];

  const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;

  try {
    const response = await fetch(yahooUrl, {
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
        'Cache-Control': 'public, max-age=60',
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
