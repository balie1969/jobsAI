import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    // Update session expiration if it exists
    const response = await updateSession(request);
    if (response) return response;

    // Dashboard protection logic is also handled in the page component for robust server-side checking,
    // but we can add a redirect here too if we want global protection for /dashboard/*
    /* 
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
        const session = request.cookies.get("session");
        if (!session) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }
    */

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
