"""
Security Headers Middleware
Adds HTTP security headers to every response.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds standard HTTP security headers to all responses.

    Headers added:
      - Strict-Transport-Security  (HTTPS only)
      - X-Frame-Options            (clickjacking)
      - X-Content-Type-Options     (MIME sniffing)
      - X-XSS-Protection           (legacy XSS filter)
      - Content-Security-Policy    (XSS / injection)
      - Referrer-Policy
      - Permissions-Policy
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response: Response = await call_next(request)

        # ── HTTPS enforcement (only in production) ─────────────────────────
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        # ── Clickjacking protection ────────────────────────────────────────
        response.headers["X-Frame-Options"] = "DENY"

        # ── MIME type sniffing protection ──────────────────────────────────
        response.headers["X-Content-Type-Options"] = "nosniff"

        # ── Legacy XSS filter (still respected by older browsers) ──────────
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # ── Content Security Policy ────────────────────────────────────────
        # Adjust as needed. Current policy: self + same-origin for scripts.
        csp_parts = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",   # inline needed for Vite HMR in dev
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://graph.facebook.com https://celcer.sri.gob.ec https://cel.sri.gob.ec",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_parts)

        # ── Referrer policy ────────────────────────────────────────────────
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # ── Permissions policy (disable unused browser features) ───────────
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), "
            "payment=(), usb=(), bluetooth=()"
        )

        # ── Remove server fingerprint ──────────────────────────────────────
        response.headers.pop("Server", None)
        response.headers.pop("X-Powered-By", None)

        return response