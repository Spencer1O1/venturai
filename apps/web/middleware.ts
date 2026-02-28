import { type NextRequest, NextResponse } from "next/server";

/**
 * ConvexAuthProvider uses localStorage (no cookies), so we don't use
 * convexAuthNextjsMiddleware for route protection. Auth is enforced
 * client-side via AuthGuard in the dashboard layout.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};
