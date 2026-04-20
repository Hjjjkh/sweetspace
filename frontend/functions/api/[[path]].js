// Cloudflare Pages Function - API Proxy
// Forwards all /api/* requests to the Worker backend

const WORKER_URL = 'https://sweetspace.248851185.workers.dev';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Build the target URL
  const targetUrl = new URL(url.pathname + url.search, WORKER_URL);
  
  try {
    // Forward the request to Worker
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    // Return response from Worker
    return response;
  } catch (error) {
    console.error('Pages Function API proxy error:', error);
    return new Response(JSON.stringify({
      error: 'API proxy error',
      message: error.message
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
