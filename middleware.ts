import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing(.*)",
  "/upload(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/report(.*)",
  "/demo(.*)",
  "/terms(.*)",
  "/privacy(.*)",
]);

// auth.protect()'s default unauthenticated handling picks a response based on
// request headers (Sec-Fetch-Dest, next-url, etc). Non-browser callers (curl,
// test scripts, expired-token retries) don't send those, so it falls through to
// notFound() — and for multipart/form-data requests, Next's dev-mode Server
// Action detection then misfires on that notFound() render and throws
// "Failed to find Server Action" instead of a clean 401. Bypass auth.protect()
// here and return JSON directly so an expired/invalid token is unambiguous.
const isExtractCoiRoute = createRouteMatcher(["/api/extract-coi(.*)"]);

const unauthorizedResponse = () =>
  NextResponse.json(
    { error: "Unauthorized - token expired or invalid" },
    { status: 401 }
  );

// Dev-only regression-test bypass — lets scripts/test-engine.mjs authenticate
// with a static secret instead of a Clerk session JWT (which expires in ~60s
// and makes automated runs impractical). NODE_ENV is set by the Next.js build
// process itself ('production' for `next build`/`next start`), not read from
// .env, so this branch is structurally unreachable in a production deployment
// even if COVIRA_TEST_SECRET were somehow set there.
function isDevTestBypass(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }
  const configuredSecret = process.env.COVIRA_TEST_SECRET;
  if (!configuredSecret) {
    return false;
  }
  return request.headers.get("x-test-secret") === configuredSecret;
}

const withClerk = clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }

  if (isExtractCoiRoute(request)) {
    // Bypass runs inside clerkMiddleware (rather than short-circuiting
    // before it) so the request still gets the auth context clerkMiddleware
    // attaches — route.ts's own auth() call still works normally and just
    // sees a signed-out user, which it already handles by falling back to
    // DEFAULT_REQUIREMENTS.
    if (isDevTestBypass(request)) {
      return;
    }
    const { userId } = await auth();
    return userId ? undefined : unauthorizedResponse();
  }

  await auth.protect();
});

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  try {
    return await withClerk(request, event);
  } catch (err) {
    // A structurally malformed bearer token (not just an expired one) makes
    // Clerk's own JWT decoder throw during request authentication, before
    // the handler above ever runs — catch that here so it degrades to the
    // same clean 401 instead of Next's generic error page.
    if (isExtractCoiRoute(request)) {
      return unauthorizedResponse();
    }
    throw err;
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
