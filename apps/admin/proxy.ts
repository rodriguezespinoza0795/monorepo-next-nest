import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@repo/auth/cookie";

// Sin cookie de sesión no hay panel: directo al login (de la app principal),
// recordando la página para volver a ella. La cookie y el permiso de admin se
// verifican de verdad en el layout del panel.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set(
    "next",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/moderacion", "/moderacion/:path*"] };
