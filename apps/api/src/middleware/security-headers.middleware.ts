import {Next, ValueOrPromise} from '@loopback/core';
import {Middleware, MiddlewareContext} from '@loopback/express';

const API_PREFIXES = ['/setup', '/prompts', '/projects', '/auth', '/chat-sessions', '/queue', '/webhook', '/claude-code-api-keys', '/openapi.json', '/explorer'];

function isApiPath(path: string): boolean {
  return API_PREFIXES.some(p => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`));
}

export const securityHeadersMiddleware: Middleware = (
  middlewareCtx: MiddlewareContext,
  next: Next,
): ValueOrPromise<object> => {
  const {response} = middlewareCtx;
  const csp = isApiPath(middlewareCtx.request.path)
    ? "default-src 'none'; frame-ancestors 'none'"
    : "default-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:; img-src 'self' data:; frame-ancestors 'none'";
  response.setHeader('Content-Security-Policy', csp);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('X-XSS-Protection', '1; mode=block');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (process.env.NODE_ENV === 'production') {
    response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  return next() as ValueOrPromise<object>;
};
