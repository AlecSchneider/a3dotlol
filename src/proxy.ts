import { NextResponse, type NextRequest } from "next/server";

import { securityHeaders } from "./lib/security-headers";
import { shortcutDestination } from "./lib/shortcut-redirects";

export function proxy(request: NextRequest) {
  const destination = shortcutDestination(request.nextUrl);
  if (!destination) return NextResponse.next();

  // Next 16.3.5 config redirects discard accumulated response headers.
  // Return them explicitly, without proxying page/asset traffic or doing I/O.
  return NextResponse.redirect(destination, {
    status: 307,
    headers: securityHeaders,
  });
}

// Must remain literal for Next's build-time analysis. Regression tests cover
// every mapped shortcut and verify that ordinary pages/assets are excluded.
// Character classes preserve config redirects' case-insensitive matching.
export const config = {
  matcher: [
    "/([yY][oO][uU][tT][uU][bB][eE])",
    "/([lL][iI][vV][eE])",
    "/([tT][uU][tT][oO][rR][iI][aA][lL])",
    "/([dD][iI][sS][cC][oO][rR][dD])",
    "/([gG][iI][tT][hH][uU][bB])",
    "/([xX])",
    "/([iI][nN][sS][tT][aA][gG][rR][aA][mM])",
    "/([tT][iI][kK][tT][oO][kK])",
    "/([lL][iI][nN][kK][eE][dD][iI][nN])",
    "/([eE][mM][aA][iI][lL])",
  ],
};
