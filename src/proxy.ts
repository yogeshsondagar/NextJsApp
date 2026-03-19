// Previously named middleware.ts but renamed to proxy.ts from nextjs 16+
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// 1. Export the default NextAuth middleware
export default withAuth(
    function middleware(req) {
        // 2. Grab the route they are trying to visit and their token
        const path = req.nextUrl.pathname;
        const role = req.nextauth.token?.role;

        // 3. The Custom Rule: Is this the admin dashboard?
        if (path.startsWith("/admin-dashboard")) {
            // If they are anything other than an admin, kick them out
            if (role !== "admin") {
                // Redirect them back to the safe homepage
                return NextResponse.redirect(new URL("/", req.url));
            }
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

// 2. Define which routes the middleware should protect
export const config = {
    //   "Protect /students and any sub-routes inside it"
    matcher: ["/students/:path*", "/admin-dashboard/:path*"]
};


