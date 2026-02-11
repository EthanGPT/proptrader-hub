/**
 * Cloudflare Worker – R2-backed JSON storage for Prop Tracker.
 *
 * Endpoints:
 *   GET  /sync         → returns the stored JSON blob
 *   PUT  /sync         → overwrites the blob (requires Authorization header)
 *   OPTIONS /sync      → CORS preflight
 *
 * Deploy:
 *   cd worker && npx wrangler deploy
 */

export interface Env {
  BUCKET: R2Bucket;
  AUTH_TOKEN: string;
  ALLOWED_ORIGINS: string; // comma-separated list of origins
  FRED_API_KEY: string;
}

const DATA_KEY = 'proptracker.json';

function cors(env: Env, request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  const matched = allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': matched,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = cors(env, request);

    // CORS preflight for any route
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // FRED API Proxy – /fred/releases
    if (url.pathname === '/fred/releases') {
      const startDate = url.searchParams.get('start') || '';
      const endDate = url.searchParams.get('end') || '';

      // Fetch release dates from FRED (max 1000 per request, sorted ascending by date)
      const fredUrl = `https://api.stlouisfed.org/fred/releases/dates?realtime_start=${startDate}&realtime_end=${endDate}&include_release_dates_with_no_data=true&sort_order=asc&limit=1000&api_key=${env.FRED_API_KEY}&file_type=json`;

      try {
        const resp = await fetch(fredUrl);
        const data = await resp.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'FRED API error' }), {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    }

    // FRED API Proxy – /fred/release/:id
    if (url.pathname.startsWith('/fred/release/')) {
      const releaseId = url.pathname.split('/')[3];
      const startDate = url.searchParams.get('start') || '';
      const endDate = url.searchParams.get('end') || '';

      const fredUrl = `https://api.stlouisfed.org/fred/release/dates?release_id=${releaseId}&realtime_start=${startDate}&realtime_end=${endDate}&include_release_dates_with_no_data=true&api_key=${env.FRED_API_KEY}&file_type=json`;

      try {
        const resp = await fetch(fredUrl);
        const data = await resp.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'FRED API error' }), {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle /sync
    if (url.pathname !== '/sync') {
      return new Response('Not found', { status: 404 });
    }

    // GET – read data from R2
    if (request.method === 'GET') {
      const object = await env.BUCKET.get(DATA_KEY);
      if (!object) {
        return new Response('{}', {
          status: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
      const body = await object.text();
      return new Response(body, {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // PUT – write data to R2
    if (request.method === 'PUT') {
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${env.AUTH_TOKEN}`) {
        return new Response('Unauthorized', { status: 401, headers });
      }

      const body = await request.text();

      // Validate it's proper JSON
      try {
        JSON.parse(body);
      } catch {
        return new Response('Invalid JSON', { status: 400, headers });
      }

      await env.BUCKET.put(DATA_KEY, body, {
        httpMetadata: { contentType: 'application/json' },
      });

      return new Response('OK', { status: 200, headers });
    }

    return new Response('Method not allowed', { status: 405, headers });
  },
};
