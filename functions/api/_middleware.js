// Cloudflare Pages Function - API Proxy
// Forwards all /api/* requests to the Worker backend

const WORKER_URL = 'https://sweetspace.248851185.workers.dev';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = new URL(url.pathname + url.search, WORKER_URL);
  
  console.log('Proxying:', request.method, url.pathname);
  
  try {
    const body = ['POST', 'PUT', 'PATCH'].includes(request.method) 
      ? await request.clone().json()
      : undefined;
    
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    
    console.log('Response:', response.status);
    return response;
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
