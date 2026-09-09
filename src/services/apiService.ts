import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ApiProxyOptions {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: Record<string, any> | URLSearchParams;
}

export async function proxyApiRequest(options: ApiProxyOptions): Promise<any> {
  const { url, method = 'POST', headers = {}, body } = options;

  const defaultHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    ...headers,
  };

  let requestBody: URLSearchParams | string | undefined = undefined;
  if (body) {
    if (body instanceof URLSearchParams) {
      requestBody = body;
    } else if (typeof body === 'object') {
      const params = new URLSearchParams();
      for (const [key, val] of Object.entries(body)) {
        params.append(key, String(val));
      }
      requestBody = params;
    } else {
      requestBody = String(body);
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers: defaultHeaders,
      body: method === 'POST' ? requestBody : undefined,
    });

    const status = res.status;
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html') || contentType.includes('text/html');

    if (isHtml || !res.ok) {
      // Log error response into 'api_error_logs' collection in Firestore
      try {
        await addDoc(collection(db, 'api_error_logs'), {
          url,
          status,
          contentType,
          rawHtmlPreview: text.slice(0, 1000),
          createdAt: serverTimestamp(),
          timestamp: Date.now(),
        });
      } catch (logErr) {
        console.error('Failed to write to api_error_logs collection:', logErr);
      }

      console.error(`[API Proxy Error] URL: ${url}, Status: ${status}, Content-Type: ${contentType}`);
      console.error(`[API Proxy HTML Preview]:`, text.slice(0, 300));

      throw new Error(`API returned HTML error page or status ${status}. Logged to api_error_logs.`);
    }

    try {
      return JSON.parse(text);
    } catch (parseErr) {
      console.error('[API Proxy JSON Parse Error]:', text.slice(0, 200));
      throw new Error('Invalid JSON response received from API endpoint.');
    }
  } catch (err: any) {
    console.error('[proxyApiRequest Error]:', err);
    throw err;
  }
}
