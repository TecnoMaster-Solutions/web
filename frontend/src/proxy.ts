import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/auth/login", "/auth/register", "/auth/forgot", "/auth/forgot-password"];
const CLOUDINARY_ORIGIN = "https://api.cloudinary.com";
const IMAGE_ORIGINS = [
  "https://cdn-icons-png.flaticon.com",
  "https://via.placeholder.com",
  "https://res.cloudinary.com",
];

function asOrigin(value?: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function applySecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

function buildCsp(request: NextRequest, nonce: string) {
  const isDev = process.env.NODE_ENV !== "production";
  const apiOrigin = asOrigin(process.env.NEXT_PUBLIC_API_URL);
  const appOrigin =
    asOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    asOrigin(process.env.RENDER_EXTERNAL_URL) ??
    request.nextUrl.origin;

  const connectSrc = unique([
    "'self'",
    apiOrigin,
    appOrigin,
    CLOUDINARY_ORIGIN,
    ...(isDev ? ["http://localhost:3000", "http://localhost:3001"] : []),
  ]);

  const imgSrc = unique([
    "'self'",
    "data:",
    "blob:",
    ...IMAGE_ORIGINS,
    CLOUDINARY_ORIGIN,
  ]);

  const scriptSrc = unique([
    "'self'",
    `'nonce-${nonce}'`,
    ...(isDev ? ["'unsafe-eval'"] : []),
  ]);

  const styleSrc = unique([
    "'self'",
    `'nonce-${nonce}'`,
    "https://fonts.googleapis.com",
  ]);

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `img-src ${imgSrc.join(" ")}`,
    "font-src 'self' data:",
    `style-src ${styleSrc.join(" ")}`,
    "style-src-attr 'unsafe-inline'",
    `script-src ${scriptSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    "worker-src 'self' blob:",
    "frame-src 'self' https://www.mercadopago.com https://sandbox.mercadopago.com",
    "manifest-src 'self'",
    "media-src 'self' blob:",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}

function buildResponse(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const csp = buildCsp(request, nonce);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return applySecurityHeaders(response, csp);
}

function buildRedirectResponse(request: NextRequest, destination: URL) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const response = NextResponse.redirect(destination);
  const csp = buildCsp(request, nonce);
  response.headers.set("x-nonce", nonce);
  return applySecurityHeaders(response, csp);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard && !token) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("next", pathname);
    return buildRedirectResponse(request, url);
  }

  if (isPublic && token) {
    return buildRedirectResponse(request, new URL("/dashboard", request.url));
  }

  return buildResponse(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
