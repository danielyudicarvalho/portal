import { withAuth } from "next-auth/middleware"

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Define which routes require authentication
        const { pathname } = req.nextUrl
        
        // Admin routes require admin role
        if (pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN'
        }
        
        // Dashboard routes require authentication
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }
        
        // Profile routes require authentication
        if (pathname.startsWith('/profile')) {
          return !!token
        }
        
        // All other routes are public
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*'
  ]
}