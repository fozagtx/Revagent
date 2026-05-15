import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/pitch", "/call", "/audit"];

export function middleware(req: NextRequest) {
  if (process.env.AUTH_DISABLED === "true") return NextResponse.next();

  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  const session = req.cookies.get("session");
  if (session?.value) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/pitch/:path*", "/call/:path*", "/audit/:path*"],
};
