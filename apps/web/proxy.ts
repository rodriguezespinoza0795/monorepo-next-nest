import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@repo/auth/cookie";

// Sin cookie de sesión no hay nada que mostrar en el feed: directo al login
// (de la app principal), recordando la página para volver a ella. La cookie
// se verifica de verdad en el layout del feed.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set(
    "next",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(login);
}

export const config = { matcher: ["/feed", "/feed/:path*"] };
