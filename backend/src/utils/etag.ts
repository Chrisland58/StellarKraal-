/**
 * ETag support for HTTP caching.
 *
 * Computes ETags as MD5 hashes of JSON response bodies.
 * Supports conditional GET with If-None-Match header.
 */
import { createHash } from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Compute an ETag for a response body.
 * Uses MD5 hash of the JSON-stringified body, wrapped in double quotes.
 * @param body - The response body to hash.
 * @returns The ETag string (e.g., "a1b2c3d4e5f6...").
 */
export function computeETag(body: unknown): string {
  const json = JSON.stringify(body);
  const hash = createHash('md5').update(json).digest('hex');
  return `"${hash}"`;
}

/**
 * Middleware that wraps res.json() to automatically compute and set ETags.
 * If the client sends If-None-Match header matching the computed ETag,
 * responds with 304 Not Modified instead of the full body.
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware callback
 */
export function etagMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = function(body: unknown) {
    const etag = computeETag(body);
    res.setHeader('ETag', etag);

    const ifNoneMatch = req.get('If-None-Match');
    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).end();
    }

    return originalJson.call(this, body);
  };

  next();
}
