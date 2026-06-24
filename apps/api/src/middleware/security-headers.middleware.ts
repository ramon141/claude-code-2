import {Next, ValueOrPromise} from '@loopback/core';
import {Middleware, MiddlewareContext} from '@loopback/express';

export const securityHeadersMiddleware: Middleware = (
  middlewareCtx: MiddlewareContext,
  next: Next,
): ValueOrPromise<object> => {
  const {response} = middlewareCtx;
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
