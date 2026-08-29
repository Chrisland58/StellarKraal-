# ALLOWED_ORIGINS

The `ALLOWED_ORIGINS` environment variable controls which origins the backend permits via CORS.

## Format

Comma-separated list of HTTP(S) URLs:

```
ALLOWED_ORIGINS=https://app.example.com,https://staging.example.com
```

## Rules

| Environment | Wildcard `*` | HTTP origins | HTTPS origins |
|-------------|-------------|--------------|---------------|
| development / test | ✅ allowed | ✅ | ✅ |
| production | ❌ startup error | ✅ | ✅ |

- Invalid patterns (missing scheme, `ftp://`, etc.) **fail startup validation**.
- Takes precedence over `FRONTEND_URL` when set.
- Trailing/leading whitespace around each origin is stripped.

## Examples

```bash
# Local development — allow any origin
ALLOWED_ORIGINS=*

# Staging — two specific origins
ALLOWED_ORIGINS=https://staging.stellarkraal.example.com,https://app.stellarkraal.example.com

# Production — single origin
ALLOWED_ORIGINS=https://app.stellarkraal.example.com
```

See also: [`env.example`](../env.example), [`backend/src/middleware/cors.ts`](../backend/src/middleware/cors.ts).
