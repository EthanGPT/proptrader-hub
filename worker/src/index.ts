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
  ALLOWED_ORIGIN: string;
}

const DATA_KEY = 'proptracker.json';

function cors(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Only handle /sync
    if (url.pathname !== '/sync') {
      return new Response('Not found', { status: 404 });
    }

    const headers = cors(env);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
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
