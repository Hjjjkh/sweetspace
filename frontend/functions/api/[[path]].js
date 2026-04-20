// Cloudflare Pages Function - API Proxy
// Forwards all /api/* requests to the Worker backend

const WORKER_URL = 'https://sweetspace.248851185.workers.dev';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Build the target URL
  const targetUrl = new URL(url.pathname + url.search, WORKER_URL);
  
  console.log('Proxying request:', {
    method: request.method,
    pathname: url.pathname,
    target: targetUrl.toString()
  });
  
  try {
    // Clone the request body properly
    const body = ['POST', 'PUT', 'PATCH'].includes(request.method) 
      ? await request.clone().json()
      : undefined;
    
    // Forward the request to Worker
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        // Pass through any auth headers if needed
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    console.log('Worker response status:', response.status);
    
    // Get response data
    const responseData = await response.clone().json().catch(() => null);
    console.log('Worker response:', responseData);
    
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
