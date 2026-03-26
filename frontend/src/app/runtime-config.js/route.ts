import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const payload = {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ?? "https://vertecx-api-sha-09ac69f.onrender.com",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.RENDER_EXTERNAL_URL ??
      request.nextUrl.origin,
  };

  return new NextResponse(`window.__RUNTIME_CONFIG__ = ${JSON.stringify(payload)};`, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
